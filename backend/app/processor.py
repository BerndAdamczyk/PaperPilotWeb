import os
import shutil
import uuid
import json
import logging
import time
import asyncio
import re
import cv2
import numpy as np
import pytesseract
from pathlib import Path
from typing import Optional
from pdf2image import convert_from_path
from pyzbar.pyzbar import decode
from PIL import Image
from pypdf import PdfReader, PdfWriter
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
import qrcode
from app.config import TEMP_DIR, INPUT_DIR, OUTPUT_DIR, SPLIT_MARKER, OCR_ROTATION_THRESHOLD
from app.models import DocumentState, DocumentStatus, Page, PageStatus
from app.events import event_manager

logger = logging.getLogger("processor")

class DocumentProcessor:
    def __init__(self):
        self.active_docs = {} # id -> DocumentState

    def load_existing_temp_docs(self):
        """Scans TEMP_DIR for existing processed docs on startup."""
        for item in TEMP_DIR.iterdir():
            if item.is_dir():
                state_file = item / "state.json"
                if state_file.exists():
                    try:
                        with open(state_file, "r") as f:
                            data = json.load(f)
                            doc = DocumentState(**data)
                            self.active_docs[doc.id] = doc
                    except Exception as e:
                        logger.error(f"Failed to load state for {item.name}: {e}")

    async def _wait_for_file_ready(self, file_path: Path, timeout: int = 10):
        """Waits until the file size is stable (fully written)."""
        start_time = time.time()
        last_size = -1
        
        while time.time() - start_time < timeout:
            if not file_path.exists():
                return # File disappeared?
            
            try:
                current_size = file_path.stat().st_size
                if current_size == last_size and current_size > 0:
                    return # Stable
                last_size = current_size
            except Exception:
                pass # access error, maybe locked
            
            await asyncio.sleep(1.0)
        
        logger.warning(f"Timeout waiting for file {file_path} to stabilize. Proceeding anyway.")

    async def process_new_file(self, file_path: Path):
        """Ingests a new PDF file."""
        # Wait for file to be fully written
        await self._wait_for_file_ready(file_path)

        doc_id = str(uuid.uuid4())
        work_dir = TEMP_DIR / doc_id
        work_dir.mkdir(parents=True, exist_ok=True)
        
        # Create initial state
        doc = DocumentState(
            id=doc_id,
            original_filename=file_path.name,
            user_filename=file_path.stem, # Default to stem
            status=DocumentStatus.PROCESSING,
            created_at=time.time()
        )
        self.active_docs[doc_id] = doc
        self._save_state(doc)
        # Broadcast creation
        await event_manager.broadcast("doc_create", doc.model_dump())

        try:
            # Copy file to work dir
            temp_pdf_path = work_dir / "original.pdf"
            shutil.copy2(file_path, temp_pdf_path)
            
            # Remove original file (PaperPilot logic: move from input to temp)
            os.remove(file_path)

            # Process in background (blocking, so maybe run in executor in real app)
            # For this prototype, we'll do it synchronously or rely on FastAPIs async
            await asyncio.to_thread(self._analyze_pdf, doc, temp_pdf_path, work_dir)
            
            doc.status = DocumentStatus.READY
            self._save_state(doc)
            # Broadcast update
            await event_manager.broadcast("doc_update", doc.model_dump())
            
        except Exception as e:
            logger.error(f"Error processing {file_path}: {e}")
            doc.status = DocumentStatus.ERROR
            self._save_state(doc)
            await event_manager.broadcast("doc_update", doc.model_dump())

    def _analyze_pdf(self, doc: DocumentState, pdf_path: Path, work_dir: Path):
        images_dir = work_dir / "images"
        images_dir.mkdir(exist_ok=True)

        # Convert PDF to images
        # standard dpi=100 is usually enough for preview and QR detection
        images = convert_from_path(str(pdf_path), dpi=300)
        
        processed_pages = []
        
        for i, img in enumerate(images):
            img_filename = f"page_{i}.jpg"
            img_path = images_dir / img_filename
            img.save(img_path, "JPEG")
            
            # Analyze
            status = self._detect_page_type(img)
            
            # Detect orientation (only for valid pages to save time/errors)
            rotation = 0
            if status == PageStatus.VALID:
                rotation = self._detect_orientation(img)

            # Relative path for frontend
            rel_path = f"{doc.id}/images/{img_filename}"
            
            page = Page(
                page_number=i,
                image_path=rel_path,
                status=status,
                rotation=rotation,
                original_width=img.width,
                original_height=img.height
            )
            processed_pages.append(page)
        
        doc.pages = processed_pages

    def _detect_orientation(self, pil_image: Image) -> int:
        """Detects text orientation using Tesseract OSD."""
        try:
            # Use German and English for better accuracy with Umlauts
            # psm 0 = Orientation and script detection (OSD) only
            # Note: We removed lang='deu+eng' because the standard apt packages for deu
            # often lack the legacy engine data required for OSD (--psm 0), causing it to fail.
            # The default 'osd' model is usually sufficient for Latin scripts.
            osd = pytesseract.image_to_osd(pil_image, config='--psm 0')
            
            # Parse output
            rotation_match = re.search(r'Rotate: (\d+)', osd)
            conf_match = re.search(r'Orientation confidence: ([\d\.]+)', osd)
            
            if rotation_match and conf_match:
                rotation = int(rotation_match.group(1))
                conf = float(conf_match.group(1))
                
                logger.info(f"OSD: Rotate={rotation}, Conf={conf} (Threshold={OCR_ROTATION_THRESHOLD})")

                # Only apply rotation if confidence is high enough
                # Low confidence often leads to false positives (e.g. 180 flip on sparse text)
                if conf < OCR_ROTATION_THRESHOLD:
                    logger.info("Skipping rotation due to low confidence")
                    return 0
                    
                return rotation
            else:
                logger.warning(f"OSD Parse Failed. Output: {osd}")
        except Exception as e:
            logger.warning(f"Orientation detection failed: {e}")
            pass
        return 0

    def _detect_page_type(self, pil_image: Image) -> PageStatus:
        # 1. Check for QR Code / Split Marker
        try:
            decoded = decode(pil_image)
            for obj in decoded:
                if SPLIT_MARKER in obj.data.decode("utf-8"):
                    return PageStatus.SPLIT
        except Exception:
            pass # Detection failed, assume not split

        # 2. Check for Blank Page
        # Convert to CV2 format
        cv_img = cv2.cvtColor(np.array(pil_image), cv2.COLOR_RGB2GRAY)
        
        # Calculate standard deviation
        std_dev = np.std(cv_img)
        
        # If std_dev is very low, it's likely a solid color (white/empty)
        # Threshold needs tuning. 5-10 is usually safe for "clean" scans. 
        # Scanned paper might have noise.
        if std_dev < 10: 
            return PageStatus.DELETE

        return PageStatus.VALID

    def _save_state(self, doc: DocumentState):
        work_dir = TEMP_DIR / doc.id
        with open(work_dir / "state.json", "w") as f:
            f.write(doc.model_dump_json(indent=2))

    def get_doc(self, doc_id: str) -> Optional[DocumentState]:
        return self.active_docs.get(doc_id)
    
    async def update_doc(self, doc: DocumentState):
        self.active_docs[doc.id] = doc
        self._save_state(doc)
        await event_manager.broadcast("doc_update", doc.model_dump())

    async def delete_doc(self, doc_id: str):
        if doc_id in self.active_docs:
            doc = self.active_docs[doc_id]
            # remove dir
            shutil.rmtree(TEMP_DIR / doc.id, ignore_errors=True)
            del self.active_docs[doc_id]
            await event_manager.broadcast("doc_delete", doc_id)

    async def export_doc(self, doc_id: str):
        doc = self.get_doc(doc_id)
        if not doc:
            raise ValueError("Document not found")

        work_dir = TEMP_DIR / doc.id
        original_pdf_path = work_dir / "original.pdf"
        
        # Run blocking PDF processing in a thread
        await asyncio.to_thread(self._perform_export, doc, original_pdf_path)
        
        # Clean up
        await self.delete_doc(doc_id)

    def _perform_export(self, doc, original_pdf_path):
        reader = PdfReader(original_pdf_path)
        writers = []
        current_writer = PdfWriter()
        writers.append(current_writer)

        for page_state in doc.pages:
            if page_state.status == PageStatus.DELETE:
                continue
            
            if page_state.status == PageStatus.SPLIT:
                # Start new document if current one is not empty, otherwise just skip split page
                if len(current_writer.pages) > 0:
                    current_writer = PdfWriter()
                    writers.append(current_writer)
                continue

            # It's VALID
            p = reader.pages[page_state.page_number]
            if page_state.rotation != 0:
                p.rotate(page_state.rotation)
            
            current_writer.add_page(p)

        # Save files
        # Use user_filename if available, else fallback to stem of original
        base_name = doc.user_filename if doc.user_filename else Path(doc.original_filename).stem
        
        # Filter empty writers (could happen if multiple splits in a row)
        valid_writers = [w for w in writers if len(w.pages) > 0]
        
        if len(valid_writers) == 1:
            # Single file
            out_name = f"{base_name}.pdf"
            out_path = OUTPUT_DIR / out_name
            with open(out_path, "wb") as f:
                valid_writers[0].write(f)
        else:
            # Multiple files: base_00.pdf, base_01.pdf ...
            for i, writer in enumerate(valid_writers):
                # Format: 00, 01, 02 ...
                suffix = f"{i:02d}"
                out_name = f"{base_name}_{suffix}.pdf"
                out_path = OUTPUT_DIR / out_name
                
                with open(out_path, "wb") as f:
                    writer.write(f)

    def generate_split_sheet(self) -> str:
        """Generates a PDF with the split marker QR code."""
        file_path = TEMP_DIR / "split_sheet.pdf"
        c = canvas.Canvas(str(file_path), pagesize=A4)
        width, height = A4
        
        # Draw Text
        c.setFont("Helvetica-Bold", 30)
        c.drawCentredString(width / 2, height - 100, "PaperPilot Split Sheet")
        
        c.setFont("Helvetica", 14)
        c.drawCentredString(width / 2, height - 150, "Insert this page between documents to split them automatically.")
        
        # Generate QR
        qr = qrcode.QRCode(box_size=10, border=4)
        qr.add_data(SPLIT_MARKER)
        qr.make(fit=True)
        img = qr.make_image(fill_color="black", back_color="white")
        
        # Save QR to temp image to draw on PDF
        qr_path = TEMP_DIR / "temp_qr.png"
        img.save(qr_path)
        
        # Draw QR on PDF (Centered)
        qr_size = 400
        c.drawImage(str(qr_path), (width - qr_size) / 2, (height - qr_size) / 2, width=qr_size, height=qr_size)
        
        c.showPage()
        c.save()
        
        return str(file_path)

processor = DocumentProcessor()

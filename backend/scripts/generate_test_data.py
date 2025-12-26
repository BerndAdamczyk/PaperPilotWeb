import os
import sys
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
import qrcode
from pathlib import Path

# Setup paths (assuming running from backend dir or similar context)
# We want to write to /data/input which is mapped in docker
# Inside container: /data/input
# Local dev: ../data/input

def generate_test_pdf():
    # Determine output path based on environment
    if os.path.exists("/data/input"):
        out_dir = Path("/data/input")
    else:
        # Fallback for local run
        out_dir = Path(__file__).parent.parent.parent / "data" / "input"
    
    out_dir.mkdir(parents=True, exist_ok=True)
    out_path = out_dir / "test_scan_sample.pdf"
    
    c = canvas.Canvas(str(out_path), pagesize=A4)
    width, height = A4
    
    # Page 1: Normal Content
    c.setFont("Helvetica-Bold", 30)
    c.drawString(100, 700, "Page 1: Valid Content")
    c.setFont("Helvetica", 12)
    c.drawString(100, 650, "This page should be detected as VALID (Green).")
    c.circle(300, 400, 50, fill=1)
    c.showPage()
    
    # Page 2: Blank Page (Empty)
    # Just a white page
    c.showPage()
    
    # Page 3: Split Sheet (QR Code)
    c.setFont("Helvetica-Bold", 20)
    c.drawString(100, 750, "Page 3: Split Sheet")
    c.drawString(100, 720, "Should be detected as SPLIT (Violet).")
    
    # Generate QR
    qr = qrcode.QRCode(box_size=10, border=4)
    qr.add_data("SPLITT")
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    img_path = "/tmp/test_qr.png"
    img.save(img_path)
    
    c.drawImage(img_path, 100, 300, width=400, height=400)
    c.showPage()

    # Page 4: Another Valid Page
    c.setFont("Helvetica-Bold", 30)
    c.drawString(100, 700, "Page 4: New Document Start")
    c.rect(100, 100, 400, 400, fill=0)
    c.showPage()
    
    c.save()
    print(f"Generated test PDF at: {out_path}")

if __name__ == "__main__":
    generate_test_pdf()

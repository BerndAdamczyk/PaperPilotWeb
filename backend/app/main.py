from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from app.config import INPUT_DIR, OUTPUT_DIR, TEMP_DIR
from app.processor import processor
from app.watcher import start_watcher
from app.models import DocumentState, PageStatus
import uvicorn
import asyncio
import os

app = FastAPI(title="PaperPilot Web")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve static files (images of pages)
app.mount("/static", StaticFiles(directory=str(TEMP_DIR)), name="static")

@app.on_event("startup")
async def startup_event():
    processor.load_existing_temp_docs()
    
    # Process existing files in input directory
    if INPUT_DIR.exists():
        for item in INPUT_DIR.iterdir():
            if item.is_file() and item.suffix.lower() == ".pdf":
                asyncio.create_task(processor.process_new_file(item))

    start_watcher(asyncio.get_event_loop())

@app.get("/")
def read_root():
    return {"message": "PaperPilot Backend Online"}

@app.get("/api/docs")
def list_docs():
    # Return list of docs sorted by creation time
    docs = list(processor.active_docs.values())
    docs.sort(key=lambda x: x.created_at, reverse=True)
    return docs

@app.get("/api/docs/{doc_id}")
def get_doc(doc_id: str):
    doc = processor.get_doc(doc_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    return doc

@app.put("/api/docs/{doc_id}")
def update_doc_metadata(doc_id: str, user_filename: str = None):
    doc = processor.get_doc(doc_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    
    if user_filename is not None:
        doc.user_filename = user_filename
    
    processor.update_doc(doc)
    return doc

@app.post("/api/docs/{doc_id}/pages/{page_num}/update")
def update_page(doc_id: str, page_num: int, status: PageStatus = None, rotation: int = None):
    doc = processor.get_doc(doc_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    
    if page_num < 0 or page_num >= len(doc.pages):
        raise HTTPException(status_code=404, detail="Page not found")
    
    page = doc.pages[page_num]
    if status:
        page.status = status
    if rotation is not None:
        page.rotation = rotation
    
    processor.update_doc(doc)
    return {"message": "Updated"}

@app.post("/api/docs/{doc_id}/export")
def export_doc(doc_id: str):
    try:
        processor.export_doc(doc_id)
        return {"message": "Export successful"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/docs/{doc_id}")
def delete_doc(doc_id: str):
    doc = processor.get_doc(doc_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    
    processor.delete_doc(doc_id)
    return {"message": "Document deleted"}

@app.get("/api/tools/split-sheet")
def get_split_sheet():
    path = processor.generate_split_sheet()
    return FileResponse(path, media_type="application/pdf", filename="PaperPilot_SplitSheet.pdf")

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)

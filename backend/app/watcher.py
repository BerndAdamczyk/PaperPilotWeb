import time
import logging
from pathlib import Path
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler
from app.config import INPUT_DIR, ALLOWED_EXTENSIONS
from app.processor import processor
import asyncio

logger = logging.getLogger("watcher")

class PDFHandler(FileSystemEventHandler):
    def on_created(self, event):
        if event.is_directory:
            return
        
        filename = event.src_path
        if any(filename.lower().endswith(ext) for ext in ALLOWED_EXTENSIONS):
            logger.info(f"New file detected: {filename}")
            # We need to run the async process_new_file from this sync callback
            # Ideally, we push to a queue. For now, we'll try to schedule it.
            asyncio.run_coroutine_threadsafe(
                processor.process_new_file(Path(filename)),
                loop
            )

class Watcher:
    def __init__(self):
        self.observer = Observer()

    def start(self):
        event_handler = PDFHandler()
        self.observer.schedule(event_handler, str(INPUT_DIR), recursive=False)
        self.observer.start()
        logger.info(f"Watcher started on {INPUT_DIR}")

    def stop(self):
        self.observer.stop()
        self.observer.join()

# Global loop reference for the threadsafe call
loop = None

def start_watcher(event_loop):
    global loop
    loop = event_loop
    w = Watcher()
    w.start()
    return w

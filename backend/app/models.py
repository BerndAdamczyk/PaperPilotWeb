from pydantic import BaseModel
from typing import List, Optional
from enum import Enum

class PageStatus(str, Enum):
    VALID = "valid"      # Green border
    DELETE = "delete"    # Red border (Blank)
    SPLIT = "split"      # Violet border (QR Code)

class Page(BaseModel):
    page_number: int        # 0-indexed
    image_path: str         # Relative path to the static mount
    status: PageStatus
    rotation: int = 0       # 0, 90, 180, 270
    original_width: int
    original_height: int

class DocumentStatus(str, Enum):
    PROCESSING = "processing"
    READY = "ready"
    ERROR = "error"

class DocumentState(BaseModel):
    id: str                 # UUID
    original_filename: str
    status: DocumentStatus
    pages: List[Page] = []
    created_at: float

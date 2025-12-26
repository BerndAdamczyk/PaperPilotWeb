import os
from pathlib import Path

# Base Paths (Can be overridden by ENV vars)
BASE_DIR = Path(__file__).resolve().parent.parent.parent
DATA_DIR = BASE_DIR / "data"

INPUT_DIR = Path(os.getenv("INPUT_DIR", DATA_DIR / "input"))
OUTPUT_DIR = Path(os.getenv("OUTPUT_DIR", DATA_DIR / "output"))
TEMP_DIR = Path(os.getenv("TEMP_DIR", DATA_DIR / "temp"))

# Ensure directories exist
INPUT_DIR.mkdir(parents=True, exist_ok=True)
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
TEMP_DIR.mkdir(parents=True, exist_ok=True)

# Application Settings
SPLIT_MARKER = "SPLIT_HERE"
ALLOWED_EXTENSIONS = {".pdf"}
OCR_ROTATION_THRESHOLD = float(os.getenv("OCR_ROTATION_THRESHOLD", "0.0"))

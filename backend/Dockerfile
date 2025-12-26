FROM python:3.10-slim

# Install system dependencies
# poppler-utils: for pdf2image
# libzbar0: for pyzbar (QR detection)
# libgl1: for opencv-python-headless
RUN apt-get update && apt-get install -y \
    poppler-utils \
    libzbar0 \
    libgl1 \
    tesseract-ocr \
    tesseract-ocr-eng \
    tesseract-ocr-deu \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Expose port
EXPOSE 8000

# Run
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]

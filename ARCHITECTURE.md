# PaperPilot Web - Architecture Overview

## 1. High-Level Design

PaperPilot Web is a containerized web application designed to streamline the post-scan processing of bulk documents. It decouples the scanning process from the verification process, allowing users to scan documents into a network folder and verify/split them via a responsive web interface on any device.

The system follows a **Client-Server** architecture wrapped in **Docker** containers.

### Core Components

1.  **Frontend (UI)**
    *   **Framework**: React (Vite)
    *   **Styling**: Tailwind CSS
    *   **State Management**: React Hooks (local state) + Polling
    *   **Responsibility**: Displays the document grid, handles user interactions (rotate, toggle delete/split/valid), and communicates with the backend API.

2.  **Backend (API & Processor)**
    *   **Framework**: FastAPI (Python)
    *   **Responsibility**:
        *   **File Watcher**: Monitors the `input` directory for new PDF scans.
        *   **Image Processing**: Converts PDF pages to images for preview.
        *   **Analysis**: Detects blank pages (histogram/std-dev analysis) and "SPLITT" QR codes.
        *   **State Management**: Maintains a JSON state for every document in the `temp` directory.
        *   **Export Engine**: Reconstructs PDFs based on user edits (removing deleted pages, splitting at markers).

3.  **Data Layer (FileSystem)**
    *   **Input**: Watch folder for raw scans.
    *   **Temp**: Working directory. Stores extracted images, state JSONs, and original PDFs during processing.
    *   **Output**: Destination for final, processed PDF files.

---

## 2. Detailed Data Flow

### A. Ingestion Phase
1.  User scans a physical document stack to the `data/input` folder.
2.  **Watchdog** (Backend Service) detects the `CREATE` event.
3.  The file is moved to `data/temp/{uuid}/original.pdf`.
4.  **Processor** converts pages to JPEG images.
5.  **Processor** runs detection algorithms:
    *   *Blank Page*: Checks pixel standard deviation. If < Threshold -> Mark as `DELETE`.
    *   *Split Page*: Scans for QR code containing "SPLITT". If found -> Mark as `SPLIT`.
6.  Initial state is saved to `data/temp/{uuid}/state.json`.

### B. Verification Phase
1.  User opens Web UI.
2.  Frontend polls `/docs` to list ready documents.
3.  User selects a document. Frontend fetches `/docs/{uuid}`.
4.  User interacts with grid:
    *   **Click**: Toggles status `VALID` (Green) -> `DELETE` (Red) -> `SPLIT` (Violet).
    *   **Rotate**: Rotates preview image 90° (updates state).
5.  All changes are sent immediately to `POST /docs/{uuid}/pages/...` to update `state.json`.

### C. Export Phase
1.  User clicks "Export".
2.  Backend reads the final `state.json`.
3.  Backend loads `original.pdf`.
4.  It iterates through pages:
    *   Skips `DELETE` pages.
    *   Cuts file and starts a new PDF writer on `SPLIT` pages.
    *   Applies defined rotations.
5.  Files are saved to `data/output` with timestamped filenames.
6.  Temporary data for that document is cleaned up.

---

## 3. Technology Stack

### Frontend
*   **Runtime**: Node.js (Build time), Nginx/Vite (Serve)
*   **Libraries**:
    *   `lucide-react`: Icons.
    *   `axios`: HTTP Client.
    *   `clsx` / `tailwind-merge`: Class manipulation.

### Backend
*   **Runtime**: Python 3.10+
*   **Key Libraries**:
    *   `fastapi`: API Server.
    *   `uvicorn`: ASGI Server.
    *   `watchdog`: File system monitoring.
    *   `pdf2image` + `poppler`: PDF rasterization.
    *   `opencv-python-headless`: Computer vision (blank detection).
    *   `pyzbar`: QR Code reading.
    *   `pypdf`: PDF manipulation (split/merge/rotate).
    *   `reportlab`: PDF generation (Split Sheet).

### Infrastructure
*   **Docker**: Container runtime.
*   **Docker Compose**: Orchestration.
*   **Volumes**:
    *   `/data/input`: Mapped to host scan folder.
    *   `/data/output`: Mapped to host destination.

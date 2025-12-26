# PaperPilot Web

**PaperPilot Web** is a web-based document digitization assistant designed to handle bulk scanning workflows. It automatically analyzes scanned PDFs to detect blank pages and special "Split Sheets" (via QR codes), allowing for automated document separation and cleanup.

A modern, containerized rewrite of the original [PaperPilotGodot](https://github.com/BerndAdamczyk/PaperPilotGodot).

![Status](https://img.shields.io/badge/Status-Prototype-blue)

## Features

*   **Watch Folder Automation**: Automatically picks up PDFs scanned into the input directory.
*   **Automatic Detection**:
    *   **Blank Pages**: Marked with a **Red** border for deletion.
    *   **Split Sheets**: Marked with a **Violet** border to split the document into multiple files.
*   **Web Interface**:
    *   Responsive Grid View compatible with Desktop and Mobile.
    *   **Visual Verification**: Quickly see which pages are kept, deleted, or used as splitters.
    *   **Interactive Editing**: Click to toggle page status (Keep/Delete/Split) or rotate pages 90°.
*   **Safe Processing**: Works on a temporary copy. The original file is moved, processed, and the result is saved to a separate output folder.
*   **Split Sheet Generator**: Built-in tool to generate and print the required QR code separator pages.

## Project Structure

```
├── backend/            # FastAPI Python Application
├── frontend/           # React + Tailwind Web App
├── data/               # Data Directories (Mapped Volumes)
│   ├── input/          # Drop scanned PDFs here
│   ├── output/         # Processed PDFs appear here
│   └── temp/           # Internal working directory
├── docker-compose.yml  # Container Orchestration
└── ARCHITECTURE.md     # Technical Documentation
```

## Quick Start

### Prerequisites
*   [Docker](https://www.docker.com/) and [Docker Compose](https://docs.docker.com/compose/) installed on your machine.

### Running the App

1.  **Clone the repository** (or download the source).
2.  **Start the services**:
    ```bash
    docker-compose up --build
    ```
3.  **Open the Web UI**:
    Navigate to `http://localhost:5173` in your browser.

### Usage Workflow

1.  **Print a Split Sheet**:
    *   In the Web UI, click **"Get Split Sheet"**.
    *   Print this page. Insert it into your stack of physical papers wherever you want a new PDF file to start.

2.  **Scan**:
    *   Scan your stack of papers (including Split Sheets) to the `data/input` folder.
    *   *Note: In a real setup, map your scanner's network path to this volume.*

3.  **Verify**:
    *   The document will appear in the PaperPilot Inbox.
    *   Click to open. Review the auto-detected pages.
    *   **Green**: Kept.
    *   **Red**: Deleted (Blank).
    *   **Violet**: Split Point (QR Code).
    *   *Click any page to override its status. Click the rotate icon to fix orientation.*

4.  **Export**:
    *   Click **"Export PDF"**.
    *   The system splits and cleans the file.
    *   Collect your finished files in `data/output`.

## Configuration

You can configure paths via `docker-compose.yml` environment variables:

*   `INPUT_DIR`: Folder to watch for new scans.
*   `OUTPUT_DIR`: Folder to save results.
*   `TEMP_DIR`: Internal processing folder.

## License

MIT

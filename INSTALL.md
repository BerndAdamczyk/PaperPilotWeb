# Installation & Setup Guide

This project is designed to run via **Docker Compose**. This is the recommended and supported way to run PaperPilot Web.

## Method 1: Docker (Recommended)

### Prerequisites
*   Docker Engine
*   Docker Compose plugin

### Steps

1.  **Navigate to the project root**:
    ```bash
    cd /path/to/PaperpilotWeb
    ```

2.  **Build and Start**:
    ```bash
    docker-compose up --build
    ```
    *   The first run might take a few minutes to build the Python image (installing OpenCV dependencies) and the Node.js frontend.

3.  **Access**:
    *   **Frontend**: http://localhost:5173
    *   **Backend API Docs**: http://localhost:8000/docs

4.  **Stop**:
    Press `Ctrl+C` in the terminal, or run:
    ```bash
    docker-compose down
    ```

---

## Method 2: Manual Installation (Development)

If you wish to run the services locally without Docker (e.g., for debugging).

### Prerequisites
*   Python 3.10+
*   Node.js 18+
*   System libraries: `poppler-utils`, `libzbar-dev`, `libgl1` (Ubuntu/Debian)

### 1. Backend Setup

1.  Navigate to `backend/`:
    ```bash
    cd backend
    ```

2.  Create a virtual environment:
    ```bash
    python -m venv venv
    source venv/bin/activate  # Linux/Mac
    # .\venv\Scripts\activate  # Windows
    ```

3.  Install dependencies:
    ```bash
    pip install -r requirements.txt
    ```

4.  Run the server:
    ```bash
    uvicorn app.main:app --reload --port 8000
    ```

### 2. Frontend Setup

1.  Navigate to `frontend/`:
    ```bash
    cd frontend
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

3.  Run the dev server:
    ```bash
    npm run dev
    ```

4.  Access at http://localhost:5173.

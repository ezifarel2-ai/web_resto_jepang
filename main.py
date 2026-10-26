"""
Savoria Restaurant Platform - Root Entrypoint Wrapper.
Memungkinkan server dijalankan langsung dari root repository:
    uvicorn main:app --reload
ataupun langsung dari direktori backend/:
    cd backend && uvicorn main:app --reload
"""
import os
import sys

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.join(BASE_DIR, "backend")
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from backend.main import app

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)

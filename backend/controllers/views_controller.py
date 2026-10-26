import os
from fastapi import APIRouter
from fastapi.responses import FileResponse
import config

router = APIRouter(tags=["Frontend Views"])

# Path direktori Views (Tampilan HTML di frontend/views/)
VIEWS_DIR = config.VIEWS_DIR

NO_CACHE_HEADERS = {
    "Cache-Control": "no-cache, no-store, must-revalidate, max-age=0",
    "Pragma": "no-cache",
    "Expires": "0"
}

from fastapi.responses import FileResponse, Response
import db

def render_view_or_error(filename: str):
    """Menampilkan halaman tampilan antarmuka (View) HTML."""
    view_file = os.path.join(VIEWS_DIR, filename)
    if not os.path.exists(view_file):
        return Response(content=f"View {filename} not found", status_code=404, media_type="text/plain")
    return FileResponse(view_file, headers=NO_CACHE_HEADERS)

@router.get("/")
def index_view():
    """Menampilkan halaman utama antarmuka restoran Savoria."""
    return render_view_or_error("index.html")

@router.get("/kitchen")
def kitchen_view():
    """Menampilkan halaman dasbor dapur & kasir (Kitchen Order Dashboard)."""
    return render_view_or_error("kitchen.html")

@router.get("/kitchen/qr")
@router.get("/qr")
def qr_generator_view():
    """Menampilkan halaman generator & cetak QR Code Meja untuk operasional restoran."""
    return render_view_or_error("qr_generator.html")

@router.get("/admin")
def admin_view():
    """Menampilkan portal admin & operasional Savoria (Katalog Menu, Dapur, Kasir, Meja)."""
    return render_view_or_error("admin.html")


import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware

import config
import db
from controllers import (
    views_router,
    foods_router,
    orders_router,
    ai_router
)
from fastapi import Request
from fastapi.responses import HTMLResponse, JSONResponse, Response

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Inisialisasi Skema & Data Awal Database (MySQL / SQLite)
    try:
        db.init_db()
        db.seed_all()
        print(f"[SAVORIA INFO] Database aktif: {db.get_active_db_type()}")
    except Exception as e:
        print(f"[SAVORIA WARNING] Inisialisasi database: {e}")
    yield

# Inisialisasi Aplikasi Utama FastAPI Savoria
app = FastAPI(
    title="Savoria - Smart AI Japanese Dining Platform",
    description="Sistem Restoran Pintar dengan Arsitektur Modular Decoupled, Asisten AI Sommelier, dan Rekomendasi Menu Cerdas.",
    version="2.3.0",
    lifespan=lifespan
)

# Exception Handler saat MySQL (Laragon) belum dinyalakan: standar 500 Internal Server Error
@app.exception_handler(db.DatabaseOfflineError)
async def database_offline_handler(request: Request, exc: db.DatabaseOfflineError):
    if request.url.path.startswith("/api"):
        return JSONResponse(
            status_code=500,
            content={"detail": "Internal Server Error: Database MySQL tidak aktif."}
        )
    return Response(content="Internal Server Error", status_code=500, media_type="text/plain")

# CORS Middleware untuk mendukung akses lintas domain
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Middleware anti-cache untuk memastikan browser selalu memuat kode & asset HTML/CSS terbaru
@app.middleware("http")
async def no_cache_headers_middleware(request, call_next):
    response = await call_next(request)
    if request.url.path.startswith("/static") or request.url.path in ["/", "/kitchen", "/qr", "/kitchen/qr"]:
        response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate, max-age=0"
        response.headers["Pragma"] = "no-cache"
        response.headers["Expires"] = "0"
    return response

# Mount File Statis (CSS, JS, Images) untuk Aset Frontend jika tersedia
if os.path.exists(config.STATIC_DIR):
    app.mount("/static", StaticFiles(directory=config.STATIC_DIR), name="static")

# Registrasi Seluruh Controller
app.include_router(views_router)
app.include_router(foods_router)
app.include_router(orders_router)
app.include_router(ai_router)

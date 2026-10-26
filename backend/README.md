# ⚙️ Savoria Backend

Layanan server, REST API, Database SQLite, dan Engine AI untuk platform restoran Savoria.

## 📂 Struktur Direktori

```text
backend/
├── controllers/          # HTTP API Routers (Foods, Orders, AI, Views)
├── services/             # Business Logic Layer (Order calculations, AI heuristics)
├── models/               # Pydantic Schemas / DTOs
├── db/                   # Database Layer (SQLite connection, schema, repositories, seeder)
├── tests/                # Automated Pytest suite
├── ai_engine.py          # AI Sommelier heuristic logic & base catalog
├── config.py             # Backend environment & path configuration
├── database.py           # Database CLI initialization & facade
├── main.py               # FastAPI application entrypoint
├── requirements.txt      # Python dependencies
├── savoria.db            # SQLite database file
└── Dockerfile            # Backend Docker image
```

## 🚀 Menjalankan Backend Secara Mandiri

```bash
# Dari direktori root:
uvicorn backend.main:app --reload --port 8000

# Atau masuk ke folder backend:
cd backend
uvicorn main:app --reload --port 8000
```

## 🧪 Menjalankan Pengujian

```bash
pytest backend/tests
```

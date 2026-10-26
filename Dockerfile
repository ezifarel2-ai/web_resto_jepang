# Base image Python 3.11 slim
FROM python:3.11-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

# Salin requirements dan pasang paket Python
COPY backend/requirements.txt /app/
RUN pip install --no-cache-dir -r requirements.txt

# Salin backend, frontend, dan entrypoint
COPY backend/ /app/backend/
COPY frontend/ /app/frontend/
COPY main.py /app/
COPY config.py /app/

# Port operasional FastAPI default
EXPOSE 8000

# Perintah startup container (mendukung port dinamis $PORT di Render, Railway, dll)
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}"]

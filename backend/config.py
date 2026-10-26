import os
from dotenv import load_dotenv

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.abspath(os.path.join(BASE_DIR, ".."))

# Muat environment variables dari .env (di backend/ atau root)
env_path = os.path.join(BASE_DIR, ".env")
if not os.path.exists(env_path):
    env_path = os.path.join(ROOT_DIR, ".env")
load_dotenv(dotenv_path=env_path)

RESTAURANT_NAME = os.getenv("RESTAURANT_NAME", "Savoria Japanese Dining")
RESTAURANT_WHATSAPP_NUMBER = os.getenv("RESTAURANT_WHATSAPP_NUMBER", "6281234567890")
TAX_RATE = float(os.getenv("TAX_RATE", "0.10"))
SERVICE_FEE_RATE = float(os.getenv("SERVICE_FEE_RATE", "0.05"))

# Database Settings (MySQL primary, SQLite fallback)
DB_TYPE = os.getenv("DB_TYPE", "mysql").lower()
MYSQL_HOST = os.getenv("MYSQL_HOST", "localhost")
MYSQL_PORT = int(os.getenv("MYSQL_PORT", "3306"))
MYSQL_USER = os.getenv("MYSQL_USER", "root")
MYSQL_PASSWORD = os.getenv("MYSQL_PASSWORD", "")
MYSQL_DB = os.getenv("MYSQL_DB", "savoria")

DB_FILE_NAME = os.getenv("DB_FILE", "savoria.db")
DB_FILE = os.path.abspath(os.path.join(BASE_DIR, DB_FILE_NAME))

# Path direktori Frontend (Views & Static Assets)
FRONTEND_DIR = os.getenv("FRONTEND_DIR", os.path.abspath(os.path.join(ROOT_DIR, "frontend")))
VIEWS_DIR = os.path.join(FRONTEND_DIR, "views") if os.path.exists(os.path.join(FRONTEND_DIR, "views")) else os.path.join(BASE_DIR, "views")
STATIC_DIR = os.path.join(FRONTEND_DIR, "static") if os.path.exists(os.path.join(FRONTEND_DIR, "static")) else os.path.join(BASE_DIR, "static")

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

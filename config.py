import os
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = os.path.abspath(os.path.dirname(__file__))
DATA_DIR = os.path.join(BASE_DIR, "data")
IMPORTS_DIR = os.path.join(DATA_DIR, "imports")
CACHE_DIR = os.path.join(DATA_DIR, "cache")
DB_PATH = os.path.join(BASE_DIR, "nexus.db")

FLASK_SECRET_KEY = os.getenv("FLASK_SECRET_KEY", "troque-essa-chave")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "").strip()
MODEL_NAME = os.getenv("MODEL_NAME", "gpt-4.1-mini")
ADMIN_IMPORT_TOKEN = os.getenv("ADMIN_IMPORT_TOKEN", "troque-esse-token")

os.makedirs(DATA_DIR, exist_ok=True)
os.makedirs(IMPORTS_DIR, exist_ok=True)
os.makedirs(CACHE_DIR, exist_ok=True)
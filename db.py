import os
import sqlite3
from contextlib import contextmanager

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
DATA_DIR = os.path.join(BASE_DIR, "robotics_data")
IMPORTS_DIR = os.path.join(DATA_DIR, "imports")
CACHE_DIR = os.path.join(DATA_DIR, "cache")
DB_PATH = os.path.join(DATA_DIR, "robotics.db")


def ensure_dir(path: str):
    if os.path.exists(path) and not os.path.isdir(path):
        raise RuntimeError(f"O caminho '{path}' existe mas não é pasta.")
    os.makedirs(path, exist_ok=True)


ensure_dir(DATA_DIR)
ensure_dir(IMPORTS_DIR)
ensure_dir(CACHE_DIR)


def init_robotics_db():
    with sqlite3.connect(DB_PATH) as conn:
        conn.execute("""
        CREATE TABLE IF NOT EXISTS robotics_parts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            source TEXT NOT NULL,
            source_path TEXT NOT NULL,
            name TEXT NOT NULL,
            category TEXT,
            extension TEXT,
            tags TEXT,
            metadata_json TEXT,
            file_count INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        """)
        conn.execute("""
        CREATE TABLE IF NOT EXISTS robotics_builds (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            prompt TEXT NOT NULL,
            title TEXT,
            requirements_json TEXT,
            selected_parts_json TEXT,
            build_steps_json TEXT,
            estimated_cost_json TEXT,
            generated_code TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        """)
        conn.execute("""
        CREATE TABLE IF NOT EXISTS robotics_import_runs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            source TEXT NOT NULL,
            status TEXT NOT NULL,
            details TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        """)
        conn.commit()


@contextmanager
def get_conn():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
        conn.commit()
    finally:
        conn.close()
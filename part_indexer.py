from services.db import get_conn
from services.utils import dumps

def clear_source(source: str):
    with get_conn() as conn:
        conn.execute("DELETE FROM parts WHERE source = ?", (source,))

def insert_parts(parts: list[dict]):
    with get_conn() as conn:
        conn.executemany("""
            INSERT INTO parts (
                source, source_path, name, category, extension, tags, metadata_json, file_count
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, [
            (
                p["source"],
                p["source_path"],
                p["name"],
                p.get("category"),
                p.get("extension"),
                dumps(p.get("tags", [])),
                dumps(p.get("metadata", {})),
                p.get("file_count", 1),
            )
            for p in parts
        ])
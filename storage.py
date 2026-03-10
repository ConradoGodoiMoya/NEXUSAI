import os
import base64
import mimetypes
from datetime import datetime
from supabase import create_client

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")  # use no backend
SUPABASE_BUCKET = os.getenv("SUPABASE_BUCKET", "uploads")

sb_admin = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

ALLOWED_MIME = {"image/png", "image/jpeg", "image/webp"}
MAX_BYTES = 8 * 1024 * 1024  # 8MB

def _safe_ext(filename: str) -> str:
    ext = (filename.rsplit(".", 1)[-1] if "." in filename else "").lower()
    return ext if ext in {"png", "jpg", "jpeg", "webp"} else "png"

def upload_image_file(file_storage, user_id: str) -> str:
    """
    file_storage: Flask werkzeug FileStorage
    retorna URL pública (ou assinada, se preferir)
    """
    if not file_storage or not user_id:
        raise ValueError("Arquivo e user_id são obrigatórios")

    # valida tamanho
    file_storage.stream.seek(0, 2)
    size = file_storage.stream.tell()
    file_storage.stream.seek(0)
    if size > MAX_BYTES:
        raise ValueError("Imagem muito grande (máx 8MB)")

    # valida mime
    mime = file_storage.mimetype
    if mime not in ALLOWED_MIME:
        raise ValueError("Formato inválido. Use PNG/JPG/WEBP.")

    ext = _safe_ext(file_storage.filename or "")
    ts = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    path = f"{user_id}/{ts}.{ext}"

    data = file_storage.read()
    sb_admin.storage.from_(SUPABASE_BUCKET).upload(
        path,
        data,
        {"content-type": mime, "upsert": "true"},
    )

    # deixa público no bucket OU use signed URL se quiser privado
    public_url = sb_admin.storage.from_(SUPABASE_BUCKET).get_public_url(path)
    return public_url
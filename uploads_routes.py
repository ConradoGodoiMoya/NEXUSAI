import os
import uuid
import imghdr

from flask import Blueprint, request, jsonify, url_for, current_app
from werkzeug.utils import secure_filename

bp_uploads = Blueprint("uploads", __name__)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOAD_DIR = os.path.join(BASE_DIR, "static", "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "webp", "gif"}
MAX_IMAGE_SIZE = 8 * 1024 * 1024  # 8 MB


def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


def detect_real_image_ext(file_bytes):
    kind = imghdr.what(None, h=file_bytes)
    if kind == "jpeg":
        return "jpg"
    if kind in {"png", "gif", "webp"}:
        return kind
    return None


@bp_uploads.post("/api/upload-image")
def upload_image():
    try:
        file = request.files.get("image")

        if not file:
            return jsonify({"ok": False, "error": "Nenhuma imagem enviada"}), 400

        if not file.filename:
            return jsonify({"ok": False, "error": "Arquivo inválido"}), 400

        if not allowed_file(file.filename):
            return jsonify({"ok": False, "error": "Formato não permitido"}), 400

        file_bytes = file.read()

        if not file_bytes:
            return jsonify({"ok": False, "error": "Arquivo vazio"}), 400

        if len(file_bytes) > MAX_IMAGE_SIZE:
            return jsonify({"ok": False, "error": "Imagem muito grande. Máximo: 8 MB"}), 413

        real_ext = detect_real_image_ext(file_bytes)
        if not real_ext:
            return jsonify({"ok": False, "error": "Arquivo enviado não é uma imagem válida"}), 400

        original_name = secure_filename(file.filename)
        base_name = original_name.rsplit(".", 1)[0] if "." in original_name else "imagem"
        safe_base = secure_filename(base_name) or "imagem"

        new_name = f"{safe_base}-{uuid.uuid4().hex}.{real_ext}"
        save_path = os.path.join(UPLOAD_DIR, new_name)

        with open(save_path, "wb") as f:
            f.write(file_bytes)

        image_url = url_for("static", filename=f"uploads/{new_name}", _external=False)

        return jsonify({
            "ok": True,
            "url": image_url,
            "filename": new_name
        }), 200

    except Exception as e:
        current_app.logger.exception("Erro ao fazer upload de imagem")
        return jsonify({
            "ok": False,
            "error": str(e)
        }), 500
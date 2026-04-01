from flask import Blueprint, request
from core.decorators import login_required
from core.utils import json_response

bp_uploads = Blueprint("uploads", __name__, url_prefix="/uploads")


@bp_uploads.route("/file", methods=["POST"])
@login_required
def upload_file():
    if "file" not in request.files:
        return json_response({"ok": False, "error": "Arquivo não enviado."}, 400)

    uploaded_file = request.files["file"]
    return json_response({
        "ok": True,
        "filename": uploaded_file.filename,
        "message": "Upload recebido. Integre com Supabase Storage depois.",
    })
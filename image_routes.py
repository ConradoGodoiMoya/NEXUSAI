from flask import Blueprint, request
from core.decorators import login_required
from core.utils import json_response
from services.image_service import generate_image_placeholder

bp_image = Blueprint("image", __name__, url_prefix="/image")


@bp_image.route("/generate", methods=["POST"])
@login_required
def generate_image():
    prompt = request.form.get("prompt", "").strip()
    if not prompt:
        return json_response({"ok": False, "error": "Prompt vazio."}, 400)

    result = generate_image_placeholder(prompt)
    return json_response({"ok": True, **result})
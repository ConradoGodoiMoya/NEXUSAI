from flask import Blueprint, render_template, request
from core.decorators import login_required
from core.utils import json_response
from services.ebook_service import create_ebook_outline

bp_ebook = Blueprint("ebook", __name__, url_prefix="/ebook")


@bp_ebook.route("/")
@login_required
def ebook_home():
    return render_template("ebook.html")


@bp_ebook.route("/generate", methods=["POST"])
@login_required
def ebook_generate():
    prompt = request.form.get("prompt", "").strip()
    return json_response({"ok": True, "result": create_ebook_outline(prompt)})
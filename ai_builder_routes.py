from flask import Blueprint, render_template, request
from core.decorators import login_required
from core.utils import json_response
from services.ai_builder_service import build_ai_project

bp_ai_builder = Blueprint("ai_builder", __name__, url_prefix="/ai-builder")


@bp_ai_builder.route("/")
@login_required
def ai_builder_home():
    return render_template("ai_builder.html")


@bp_ai_builder.route("/generate", methods=["POST"])
@login_required
def ai_builder_generate():
    prompt = request.form.get("prompt", "").strip()
    return json_response({"ok": True, "result": build_ai_project(prompt)})
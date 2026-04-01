from flask import Blueprint, render_template, request
from core.decorators import login_required
from core.utils import json_response
from services.saas_service import build_saas_project

bp_saas = Blueprint("saas", __name__, url_prefix="/saas")


@bp_saas.route("/")
@login_required
def saas_home():
    return render_template("saas_builder.html")


@bp_saas.route("/generate", methods=["POST"])
@login_required
def saas_generate():
    prompt = request.form.get("prompt", "").strip()
    return json_response({"ok": True, "result": build_saas_project(prompt)})
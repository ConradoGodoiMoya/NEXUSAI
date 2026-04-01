from flask import Blueprint, render_template, request
from core.decorators import login_required
from core.utils import json_response
from services.study_service import explain_topic

bp_study = Blueprint("study", __name__, url_prefix="/study")


@bp_study.route("/")
@login_required
def study_home():
    return render_template("study.html")


@bp_study.route("/ask", methods=["POST"])
@login_required
def study_ask():
    prompt = request.form.get("prompt", "").strip()
    return json_response({"ok": True, "result": explain_topic(prompt)})
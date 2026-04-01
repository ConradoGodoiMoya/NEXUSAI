from flask import Blueprint, render_template, request
from core.decorators import login_required
from core.utils import json_response
from services.chat_service import generate_chat_reply

bp_chat = Blueprint("chat", __name__, url_prefix="/chat")


@bp_chat.route("/")
@login_required
def chat_home():
    return render_template("chat.html")


@bp_chat.route("/message", methods=["POST"])
@login_required
def send_message():
    user_message = request.form.get("message", "").strip()
    if not user_message:
        return json_response({"ok": False, "error": "Mensagem vazia."}, 400)

    reply = generate_chat_reply(user_message)
    return json_response({"ok": True, "reply": reply})
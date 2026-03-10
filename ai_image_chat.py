import os
from openai import OpenAI

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

def chat_with_optional_image(user_text: str, image_url: str | None):
    content = []
    if user_text:
        content.append({"type": "input_text", "text": user_text})

    if image_url:
        content.append({"type": "input_image", "image_url": image_url})

    resp = client.responses.create(
        model="gpt-4.1-mini",
        input=[{"role": "user", "content": content}],
    )
    return resp.output_text
from flask import Blueprint, request, jsonify
from ai_image_chat import chat_with_optional_image

bp_chat_img = Blueprint("chat_img", __name__)

@bp_chat_img.post("/api/chat")
def api_chat():
    data = request.get_json(force=True)
    text = (data.get("text") or "").strip()
    image_url = (data.get("image_url") or "").strip() or None

    if not text and not image_url:
        return jsonify({"ok": False, "error": "Envie texto ou imagem"}), 400

    out = chat_with_optional_image(text, image_url)
    return jsonify({"ok": True, "answer": out})
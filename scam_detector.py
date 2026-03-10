import os
from openai import OpenAI

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

SYSTEM = """Você é um assistente de segurança digital.
Analise mensagens e prints suspeitos. Aponte sinais de golpe, riscos e ações seguras.
Se houver links/contatos, recomende verificação, sem incentivar clique.
Se o conteúdo for incerto, diga o que faltou e como checar com segurança.
Responda em pt-BR, objetivo e claro."""

def detect_scam_from_image(image_url: str):
    resp = client.responses.create(
        model="gpt-4.1-mini",
        input=[{
            "role": "system",
            "content": [{"type": "input_text", "text": SYSTEM}]
        },{
            "role": "user",
            "content": [
                {"type": "input_text", "text": "Analise este print e diga se parece golpe. Dê sinais e próximos passos seguros."},
                {"type": "input_image", "image_url": image_url}
            ]
        }]
    )
    return resp.output_text
from flask import Blueprint, request, jsonify
from scam_detector import detect_scam_from_image

bp_detective = Blueprint("detective", __name__)

@bp_detective.post("/api/detective")
def api_detective():
    data = request.get_json(force=True)
    image_url = (data.get("image_url") or "").strip()
    if not image_url:
        return jsonify({"ok": False, "error": "Envie image_url"}), 400

    out = detect_scam_from_image(image_url)
    return jsonify({"ok": True, "analysis": out})
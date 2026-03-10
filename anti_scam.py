import json
from flask import Blueprint, render_template, request, redirect, url_for, jsonify
from sb_utils import uid
from ai_utils import llm_text

bp_scam = Blueprint("scam", __name__, url_prefix="/scam")

SYSTEM = """Você é um analista de golpes (Brasil). 
Objetivo: identificar sinais de fraude/engenharia social com base no texto do usuário.
Regras:
- Não invente fatos. Avalie só pelo conteúdo recebido.
- Retorne JSON válido seguindo o schema pedido.
- Seja claro e prático, focando em ações seguras.
"""

def _analyze(payload_text: str) -> dict:
    user = f"""
Analise o conteúdo abaixo e produza um JSON no schema:
{{
  "risk_score": <int 0-100>,
  "risk_level": "baixo"|"medio"|"alto",
  "red_flags": [<strings curtas>],
  "benign_signals": [<strings curtas>],
  "what_to_do_now": [<passos práticos>],
  "what_not_to_do": [<coisas a evitar>],
  "safe_reply": "<resposta curta e segura para enviar>",
  "family_alert": "<texto curto para alertar família/grupo>",
  "notes": "<observações curtas>"
}}

Conteúdo:
\"\"\"{payload_text}\"\"\"
"""
    raw = llm_text(SYSTEM, user)
    # tenta parsear JSON; se falhar, devolve bruto em notes
    try:
        data = json.loads(raw)
        return data
    except Exception:
        return {
            "risk_score": 50,
            "risk_level": "medio",
            "red_flags": [],
            "benign_signals": [],
            "what_to_do_now": ["Cole o conteúdo completo (incluindo links) para uma análise melhor."],
            "what_not_to_do": ["Não clique em links nem envie códigos/dados pessoais."],
            "safe_reply": "Não vou prosseguir por aqui. Se for algo oficial, vou resolver direto pelo app/site oficial.",
            "family_alert": "Atenção: possível golpe circulando. Não clique em links e não envie códigos/dados.",
            "notes": f"Falha ao ler JSON do modelo. Resposta bruta:\n{raw}",
        }

@bp_scam.route("/", methods=["GET"])
def scam_page():
    if not uid():
        return redirect(url_for("login"))
    return render_template("scam.html")

@bp_scam.route("/analyze", methods=["POST"])
def scam_analyze():
    if not uid():
        return jsonify({"error": "unauthorized"}), 401
    text = (request.form.get("text") or request.json.get("text") or "").strip()
    if not text:
        return jsonify({"error": "text required"}), 400
    data = _analyze(text)
    return jsonify(data)
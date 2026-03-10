import json
from flask import Blueprint, render_template, request, redirect, url_for, jsonify
from sb_utils import uid
from ai_utils import llm_text

bp_plan = Blueprint("plan", __name__, url_prefix="/plan")

SYSTEM = """Você transforma conversas em um plano de ação.
Regras:
- Não invente detalhes. Use apenas o que está no texto.
- Retorne JSON válido no schema pedido.
- Seja objetivo e útil.
"""

def _make_plan(conversation: str) -> dict:
    user = f"""
Transforme a conversa em um plano. Retorne JSON no schema:

{{
  "summary": "<resumo curto em 3-6 linhas>",
  "key_points": [<pontos principais>],
  "tasks": [
    {{
      "title": "<tarefa>",
      "priority": "baixa"|"media"|"alta",
      "effort": "5min"|"15min"|"30-60min"|">1h",
      "deadline_hint": "<se existir no texto, senão vazio>",
      "steps": [<passos>]
    }}
  ],
  "checklist": [<itens curtos>],
  "suggested_reply": "<mensagem pronta para responder a pessoa, se fizer sentido; senão vazio>",
  "questions_to_clarify": [<perguntas que faltam>]
}}

Conversa:
\"\"\"{conversation}\"\"\"
"""
    raw = llm_text(SYSTEM, user)
    try:
        return json.loads(raw)
    except Exception:
        return {"summary": "", "key_points": [], "tasks": [], "checklist": [], "suggested_reply": "", "questions_to_clarify": [f"Falha ao ler JSON. Texto bruto:\n{raw}"]}

@bp_plan.route("/", methods=["GET"])
def plan_page():
    if not uid():
        return redirect(url_for("login"))
    return render_template("plan.html")

@bp_plan.route("/build", methods=["POST"])
def plan_build():
    if not uid():
        return jsonify({"error":"unauthorized"}), 401
    text = (request.form.get("text") or request.json.get("text") or "").strip()
    if not text:
        return jsonify({"error":"text required"}), 400
    return jsonify(_make_plan(text))
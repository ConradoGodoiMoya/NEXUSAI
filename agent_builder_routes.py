import json
from flask import Blueprint, request, jsonify, session
from supa import supa_user
from human_mode import apply_human_style

bp_builder_api = Blueprint("builder_api", __name__)


ALLOWED_TONES = {
    "amigavel", "formal", "direto", "professor",
    "motivacional", "tecnico", "vendedor", "criativo"
}


def uid():
    u = session.get("user") or {}
    return u.get("id")


def is_logged():
    return bool(session.get("user")) and bool(session.get("access_token"))


def get_sb():
    return supa_user(session["access_token"])


def safe_tone(tone: str) -> str:
    t = (tone or "amigavel").strip().lower()
    return t if t in ALLOWED_TONES else "amigavel"


def clamp(text: str, size: int) -> str:
    return (text or "").strip()[:size]


def normalize_rules(rules):
    if not isinstance(rules, list):
        return []
    clean = []
    for item in rules:
        s = str(item or "").strip()
        if s:
            clean.append(s[:200])
    return clean[:20]


def build_system_prompt(goal: str, tone: str, rules: list[str]) -> str:
    rules = normalize_rules(rules)
    rules_text = "\n".join(f"- {r}" for r in rules) if rules else "- (sem regras extras)"

    prompt = f"""Você é um agente especializado.

OBJETIVO:
{goal.strip()}

TOM:
{tone.strip()}

REGRAS:
{rules_text}

COMO RESPONDER:
- Seja útil, claro e direto.
- Organize a resposta quando fizer sentido.
- Se faltar contexto, faça no máximo 1 pergunta curta.
- Entregue valor já na primeira resposta.
""".strip()

    return apply_human_style(prompt)


@bp_builder_api.post("/api/agents")
def create_agent():
    if not is_logged():
        return jsonify({"ok": False, "error": "Não autenticado"}), 401

    data = request.get_json(silent=True) or {}

    name = clamp(data.get("name"), 80)
    goal = clamp(data.get("goal"), 2000)
    tone = safe_tone(data.get("tone"))
    rules = normalize_rules(data.get("rules"))
    image_url = clamp(data.get("image_url"), 500) or None

    if not name or not goal:
        return jsonify({"ok": False, "error": "Faltou name/goal"}), 400

    system_prompt = build_system_prompt(goal, tone, rules)

    row = {
        "user_id": uid(),
        "name": name,
        "tagline": clamp(data.get("tagline"), 120),
        "tone": tone,
        "description": goal,
        "first_message": clamp(data.get("first_message"), 300) or "Olá! Como posso ajudar?",
        "system_prompt": system_prompt,
        "image_url": image_url,
    }

    try:
        sb = get_sb()
        res = sb.table("ai_agents").insert(row).execute()
        agent = res.data[0] if res.data else None
        return jsonify({"ok": True, "agent": agent}), 200
    except Exception as e:
        return jsonify({"ok": False, "error": str(e)}), 400


@bp_builder_api.get("/api/agents")
def list_agents():
    if not is_logged():
        return jsonify({"ok": False, "error": "Não autenticado"}), 401

    try:
        sb = get_sb()
        res = (
            sb.table("ai_agents")
            .select("id,name,tagline,tone,image_url,created_at")
            .eq("user_id", uid())
            .order("created_at", desc=True)
            .execute()
        )
        return jsonify({"ok": True, "agents": res.data or []}), 200
    except Exception as e:
        return jsonify({"ok": False, "error": str(e)}), 400


@bp_builder_api.get("/api/agents/<int:agent_id>")
def get_agent(agent_id: int):
    if not is_logged():
        return jsonify({"ok": False, "error": "Não autenticado"}), 401

    try:
        sb = get_sb()
        res = (
            sb.table("ai_agents")
            .select("*")
            .eq("id", agent_id)
            .eq("user_id", uid())
            .limit(1)
            .execute()
        )
        if not res.data:
            return jsonify({"ok": False, "error": "Agente não encontrado"}), 404
        return jsonify({"ok": True, "agent": res.data[0]}), 200
    except Exception as e:
        return jsonify({"ok": False, "error": str(e)}), 400
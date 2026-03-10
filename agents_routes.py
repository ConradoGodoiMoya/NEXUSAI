from flask import Blueprint, render_template, request, redirect, session, url_for, flash
from supa import supa_user

bp_agents = Blueprint("agents", __name__)

ALLOWED_TONES = {
    "amigavel", "formal", "direto", "professor",
    "motivacional", "tecnico", "vendedor", "criativo"
}


def is_logged():
    return bool(session.get("user")) and bool(session.get("access_token"))


def require_login():
    if not is_logged():
        return redirect(url_for("login_page"))
    return None


def uid():
    return (session.get("user") or {}).get("id")


def safe_tone(t: str) -> str:
    tone = (t or "amigavel").strip().lower()
    return tone if tone in ALLOWED_TONES else "amigavel"


def clamp(text: str, size: int) -> str:
    return (text or "").strip()[:size]


@bp_agents.get("/agents")
def agents_list():
    r = require_login()
    if r:
        return r

    sb = supa_user(session["access_token"])

    try:
        agents = (
            sb.table("ai_agents")
            .select("*")
            .eq("user_id", uid())
            .order("created_at", desc=True)
            .execute()
            .data
        ) or []
    except Exception:
        agents = []

    return render_template("agents.html", agents=agents, show_create=False)


@bp_agents.get("/agents/create")
def agents_create_page():
    r = require_login()
    if r:
        return r
    return render_template("agents.html", agents=None, show_create=True)


@bp_agents.post("/agents/create")
def agents_create():
    r = require_login()
    if r:
        return r

    name = clamp(request.form.get("name"), 80)
    description = clamp(request.form.get("description"), 2000)
    tone = safe_tone(request.form.get("tone"))

    if not name:
        flash("Coloque um nome para a IA.", "error")
        return redirect(url_for("agents.agents_list"))

    sb = supa_user(session["access_token"])

    try:
        sb.table("ai_agents").insert(
            {
                "user_id": uid(),
                "name": name,
                "description": description,
                "tone": tone,
                "tagline": "",
                "first_message": "Olá! Como posso ajudar?",
                "system_prompt": "",
            }
        ).execute()

        flash("IA criada!", "ok")
    except Exception:
        flash("Falhou ao criar a IA.", "error")

    return redirect(url_for("agents.agents_list"))


@bp_agents.post("/agents/<int:agent_id>/delete")
def agent_delete(agent_id: int):
    r = require_login()
    if r:
        return r

    sb = supa_user(session["access_token"])

    try:
        sb.table("ai_agents").delete().eq("id", agent_id).eq("user_id", uid()).execute()
        flash("IA removida.", "ok")
    except Exception:
        flash("Falhou ao remover a IA.", "error")

    return redirect(url_for("agents.agents_list"))
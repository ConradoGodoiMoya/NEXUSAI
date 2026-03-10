import os
from flask import Blueprint, render_template, request, redirect, session, url_for, flash
from openai import OpenAI
from supa import supa_user
from human_mode import apply_human_style

bp_studio = Blueprint("studio", __name__)
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

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


def clamp(s: str, n: int):
    return (s or "").strip()[:n]


def safe_tone(t: str):
    t = (t or "amigavel").strip().lower()
    return t if t in ALLOWED_TONES else "amigavel"


def get_agent_or_404(sb, agent_id: int):
    rows = (
        sb.table("ai_agents")
        .select("id,user_id,name,tagline,tone,description,system_prompt,first_message,created_at")
        .eq("user_id", uid())
        .eq("id", agent_id)
        .limit(1)
        .execute()
        .data
    ) or []
    return rows[0] if rows else None


@bp_studio.get("/agents/<int:agent_id>/edit")
def agent_edit(agent_id: int):
    r = require_login()
    if r:
        return r

    sb = supa_user(session["access_token"])
    agent = get_agent_or_404(sb, agent_id)

    if not agent:
        flash("Agente não encontrado.", "error")
        return redirect(url_for("agents.agents_list"))

    return render_template("agent_edit.html", agent=agent)


@bp_studio.post("/agents/<int:agent_id>/edit")
def agent_edit_save(agent_id: int):
    r = require_login()
    if r:
        return r

    sb = supa_user(session["access_token"])
    agent = get_agent_or_404(sb, agent_id)

    if not agent:
        flash("Agente não encontrado.", "error")
        return redirect(url_for("agents.agents_list"))

    name = clamp(request.form.get("name"), 80)
    tagline = clamp(request.form.get("tagline"), 120)
    tone = safe_tone(request.form.get("tone"))
    description = clamp(request.form.get("description"), 2000)
    first_message = clamp(request.form.get("first_message"), 300)
    system_prompt = clamp(request.form.get("system_prompt"), 8000)

    if not name:
        flash("O agente precisa de um nome.", "error")
        return redirect(url_for("studio.agent_edit", agent_id=agent_id))

    try:
        sb.table("ai_agents").update({
            "name": name,
            "tagline": tagline,
            "tone": tone,
            "description": description,
            "first_message": first_message,
            "system_prompt": system_prompt,
        }).eq("id", agent_id).eq("user_id", uid()).execute()

        flash("Agente salvo!", "ok")
    except Exception:
        flash("Falhou ao salvar o agente.", "error")

    return redirect(url_for("studio.agent_edit", agent_id=agent_id))


@bp_studio.get("/agents/<int:agent_id>/play")
def agent_play(agent_id: int):
    r = require_login()
    if r:
        return r

    sb = supa_user(session["access_token"])
    agent = get_agent_or_404(sb, agent_id)

    if not agent:
        flash("Agente não encontrado.", "error")
        return redirect(url_for("agents.agents_list"))

    key = f"play_{agent_id}"
    convo = session.get(key)

    if not convo:
        first = agent.get("first_message") or "Olá! Me diga o que você quer fazer e eu te ajudo."
        convo = [{"role": "assistant", "content": first}]
        session[key] = convo

    return render_template("agent_playground.html", agent=agent, convo=convo)


@bp_studio.post("/agents/<int:agent_id>/play")
def agent_play_send(agent_id: int):
    r = require_login()
    if r:
        return r

    user_msg = (request.form.get("message") or "").strip()
    if not user_msg:
        return redirect(url_for("studio.agent_play", agent_id=agent_id))

    sb = supa_user(session["access_token"])
    agent = get_agent_or_404(sb, agent_id)

    if not agent:
        flash("Agente não encontrado.", "error")
        return redirect(url_for("agents.agents_list"))

    key = f"play_{agent_id}"
    convo = session.get(key) or []
    convo = convo[-18:]
    convo.append({"role": "user", "content": user_msg})

    system_prompt = (agent.get("system_prompt") or "").strip()
    if not system_prompt:
        system_prompt = (
            f"Você é um assistente chamado '{agent.get('name', 'Agente')}'. "
            f"Tom: {agent.get('tone', 'amigavel')}. "
            "Seja útil, direto e organizado."
        )

    system_prompt = apply_human_style(system_prompt)

    messages = [{"role": "system", "content": system_prompt}] + convo

    try:
        resp = client.chat.completions.create(
            model="gpt-4.1-mini",
            messages=messages,
        )
        assistant_msg = resp.choices[0].message.content or "Sem resposta."
    except Exception:
        assistant_msg = "Falha ao gerar resposta agora. Tente de novo."

    convo.append({"role": "assistant", "content": assistant_msg})
    session[key] = convo
    session.modified = True

    try:
        sb.table("chats").insert({
            "user_id": uid(),
            "role": "user",
            "message": user_msg,
            "agent_id": agent_id,
            "thread_id": None,
            "image_url": None,
        }).execute()

        sb.table("chats").insert({
            "user_id": uid(),
            "role": "assistant",
            "message": assistant_msg,
            "agent_id": agent_id,
            "thread_id": None,
            "image_url": None,
        }).execute()
    except Exception:
        pass

    return redirect(url_for("studio.agent_play", agent_id=agent_id))


@bp_studio.post("/agents/<int:agent_id>/play/reset")
def agent_play_reset(agent_id: int):
    r = require_login()
    if r:
        return r

    key = f"play_{agent_id}"
    session.pop(key, None)
    flash("Conversa resetada.", "ok")
    return redirect(url_for("studio.agent_play", agent_id=agent_id))
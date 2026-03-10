import os
from flask import Blueprint, render_template, request, redirect, session, url_for, jsonify
from openai import OpenAI
from supa import supa_user

bp_chat = Blueprint("chat", __name__)
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


def is_logged():
    return bool(session.get("user")) and bool(session.get("access_token"))


def require_login():
    if not is_logged():
        return redirect(url_for("login_page"))
    return None


def get_sb_uid():
    sb = supa_user(session["access_token"])
    uid = session["user"]["id"]
    return sb, uid


def get_selected_agent(sb, uid, agent_id_raw):
    agent = None
    agent_id_int = None

    if not agent_id_raw:
        return None, None

    try:
        agent_id_int = int(agent_id_raw)
        row = (
            sb.table("ai_agents")
            .select("id,name,tone,description")
            .eq("user_id", uid)
            .eq("id", agent_id_int)
            .limit(1)
            .execute()
            .data
        )
        agent = row[0] if row else None
        if not agent:
            return None, None
        return agent, agent_id_int
    except Exception:
        return None, None


def build_system_prompt(agent):
    if agent:
        tone = agent.get("tone") or "amigavel"
        desc = agent.get("description") or ""
        name = agent.get("name") or "Agente"
        return (
            f"Você é '{name}'. Tom: {tone}.\n"
            f"Descrição do agente:\n{desc}\n\n"
            "Regras:\n"
            "- Seja útil, direto e organizado.\n"
            "- Responda de forma clara e natural.\n"
            "- Se faltar contexto, faça 1 pergunta curta.\n"
        )

    return "Você é um assistente útil, direto, claro e organizado."


def list_threads(sb, uid, limit=40):
    try:
        rows = (
            sb.table("chat_threads")
            .select("id,title,agent_id,created_at,updated_at")
            .eq("user_id", uid)
            .order("updated_at", desc=True)
            .limit(limit)
            .execute()
            .data
        ) or []
        return rows
    except Exception:
        return []


def get_thread(sb, uid, thread_id_raw):
    if not thread_id_raw:
        return None

    try:
        tid = int(thread_id_raw)
        row = (
            sb.table("chat_threads")
            .select("id,title,agent_id,created_at,updated_at")
            .eq("user_id", uid)
            .eq("id", tid)
            .limit(1)
            .execute()
            .data
        )
        return row[0] if row else None
    except Exception:
        return None


def create_thread(sb, uid, agent_id_int=None, title="Nova conversa"):
    row = (
        sb.table("chat_threads")
        .insert(
            {
                "user_id": uid,
                "agent_id": agent_id_int,
                "title": title,
            }
        )
        .execute()
        .data
    )
    return row[0]


def touch_thread(sb, thread_id):
    try:
        sb.table("chat_threads").update({"updated_at": "now()"}).eq("id", thread_id).execute()
    except Exception:
        pass


def update_thread_title(sb, thread_id, title):
    try:
        sb.table("chat_threads").update(
            {
                "title": title[:80],
                "updated_at": "now()",
            }
        ).eq("id", thread_id).execute()
    except Exception:
        pass


def load_thread_messages(sb, uid, thread_id, limit=200):
    try:
        rows = (
            sb.table("chats")
            .select("id,role,message,image_url,created_at,agent_id,thread_id")
            .eq("user_id", uid)
            .eq("thread_id", thread_id)
            .order("created_at", desc=False)
            .limit(limit)
            .execute()
            .data
        ) or []
        return rows
    except Exception:
        return []


def build_recent_messages_for_model(sb, uid, thread_id, limit=16):
    try:
        rows = (
            sb.table("chats")
            .select("role,message,image_url,created_at")
            .eq("user_id", uid)
            .eq("thread_id", thread_id)
            .order("created_at", desc=True)
            .limit(limit)
            .execute()
            .data
        ) or []
        rows.reverse()

        msgs = []
        for item in rows:
            role = item.get("role")
            text = (item.get("message") or "").strip()
            image_url = (item.get("image_url") or "").strip()

            if role not in ("user", "assistant"):
                continue

            if image_url and text:
                content = f"{text}\n\nImagem enviada: {image_url}"
            elif image_url:
                content = f"Imagem enviada: {image_url}"
            else:
                content = text

            if not content:
                continue

            msgs.append({"role": role, "content": content})
        return msgs
    except Exception:
        return []


@bp_chat.get("/chat")
def chat_home():
    r = require_login()
    if r:
        return r

    sb, uid = get_sb_uid()

    agents = (
        sb.table("ai_agents")
        .select("id,name,tone,description")
        .eq("user_id", uid)
        .order("created_at", desc=True)
        .limit(50)
        .execute()
        .data
    ) or []

    thread_id_raw = request.args.get("thread_id")
    selected_thread = get_thread(sb, uid, thread_id_raw)
    threads = list_threads(sb, uid)

    selected_agent = None
    selected_agent_id = ""

    if selected_thread and selected_thread.get("agent_id"):
        aid = selected_thread.get("agent_id")
        for a in agents:
            if a.get("id") == aid:
                selected_agent = a
                selected_agent_id = a.get("id")
                break

    history = []
    if selected_thread:
        history = load_thread_messages(sb, uid, selected_thread["id"])

    return render_template(
        "chat.html",
        history=history,
        agents=agents,
        threads=threads,
        selected_thread=selected_thread,
        selected_agent=selected_agent,
        selected_agent_id=selected_agent_id,
    )


@bp_chat.post("/api/chat/new-thread")
def api_new_thread():
    if not is_logged():
        return jsonify({"ok": False, "error": "Não autenticado"}), 401

    sb, uid = get_sb_uid()
    data = request.get_json(silent=True) or {}
    agent_id_raw = str(data.get("agent_id") or "").strip()

    _, agent_id_int = get_selected_agent(sb, uid, agent_id_raw)
    thread = create_thread(sb, uid, agent_id_int=agent_id_int, title="Nova conversa")

    return jsonify({"ok": True, "thread_id": thread["id"]})


@bp_chat.post("/api/chat")
def api_chat():
    if not is_logged():
        return jsonify({"ok": False, "error": "Não autenticado"}), 401

    data = request.get_json(silent=True) or {}

    user_msg = (data.get("text") or data.get("message") or "").strip()
    agent_id_raw = str(data.get("agent_id") or "").strip()
    image_url = (data.get("image_url") or "").strip()
    thread_id_raw = str(data.get("thread_id") or "").strip()

    if not user_msg and not image_url:
        return jsonify({"ok": False, "error": "Mensagem vazia"}), 400

    sb, uid = get_sb_uid()
    agent, agent_id_int = get_selected_agent(sb, uid, agent_id_raw)

    thread = get_thread(sb, uid, thread_id_raw)
    if not thread:
        preview_title = user_msg[:50] if user_msg else "Imagem"
        thread = create_thread(sb, uid, agent_id_int=agent_id_int, title=preview_title)

    thread_id = thread["id"]

    try:
        saved_text = user_msg or ""
        sb.table("chats").insert(
            {
                "user_id": uid,
                "thread_id": thread_id,
                "role": "user",
                "message": saved_text,
                "image_url": image_url or None,
                "agent_id": agent_id_int,
            }
        ).execute()

        system = build_system_prompt(agent)
        recent_history = build_recent_messages_for_model(sb, uid, thread_id, limit=16)

        if recent_history and recent_history[-1].get("role") == "user":
            last_content = recent_history[-1].get("content") or ""
            if user_msg and user_msg in last_content:
                recent_history = recent_history[:-1]

        messages = [{"role": "system", "content": system}]
        messages.extend(recent_history)

        if image_url and user_msg:
            messages.append({
                "role": "user",
                "content": f"{user_msg}\n\nO usuário enviou esta imagem: {image_url}"
            })
        elif image_url:
            messages.append({
                "role": "user",
                "content": f"O usuário enviou esta imagem: {image_url}"
            })
        else:
            messages.append({
                "role": "user",
                "content": user_msg
            })

        resp = client.chat.completions.create(
            model="gpt-4.1-mini",
            messages=messages,
        )

        assistant_msg = resp.choices[0].message.content or "Sem resposta."

        sb.table("chats").insert(
            {
                "user_id": uid,
                "thread_id": thread_id,
                "role": "assistant",
                "message": assistant_msg,
                "image_url": None,
                "agent_id": agent_id_int,
            }
        ).execute()

        if thread.get("title") in (None, "", "Nova conversa"):
            preview_title = user_msg[:50] if user_msg else "Imagem"
            update_thread_title(sb, thread_id, preview_title)

        touch_thread(sb, thread_id)

        return jsonify({
            "ok": True,
            "answer": assistant_msg,
            "thread_id": thread_id,
        })

    except Exception as e:
        return jsonify({"ok": False, "error": str(e)}), 500
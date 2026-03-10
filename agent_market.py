import os
from flask import Blueprint, render_template, request, redirect, url_for, jsonify, session
from openai import OpenAI
from supa import supa_user
from human_mode import apply_human_style

bp_market = Blueprint("market", __name__, url_prefix="/market")
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


def uid():
    u = session.get("user") or {}
    return u.get("id")


def is_logged():
    return bool(session.get("user")) and bool(session.get("access_token"))


def require_login_json():
    if not is_logged():
        return jsonify({"ok": False, "error": "Não autenticado"}), 401
    return None


def require_login_page():
    if not is_logged():
        return redirect(url_for("login_page"))
    return None


def get_sb():
    return supa_user(session["access_token"])


@bp_market.route("/", methods=["GET"])
def market_home():
    r = require_login_page()
    if r:
        return r
    return render_template("market.html")


@bp_market.route("/my", methods=["GET"])
def my_agents():
    r = require_login_json()
    if r:
        return r

    try:
        sb = get_sb()
        res = (
            sb.table("ai_agents")
            .select("id,name,tagline,description,tone,created_at,is_public")
            .eq("user_id", uid())
            .order("created_at", desc=True)
            .execute()
        )
        return jsonify({"ok": True, "agents": res.data or []}), 200
    except Exception as e:
        return jsonify({"ok": False, "error": str(e)}), 400


@bp_market.route("/public", methods=["GET"])
def public_agents():
    r = require_login_json()
    if r:
        return r

    try:
        sb = get_sb()
        res = (
            sb.table("ai_agents")
            .select("id,name,tagline,description,tone,created_at,user_id,is_public")
            .eq("is_public", True)
            .order("created_at", desc=True)
            .execute()
        )
        return jsonify({"ok": True, "agents": res.data or []}), 200
    except Exception as e:
        return jsonify({"ok": False, "error": str(e)}), 400


@bp_market.route("/create", methods=["POST"])
def create_agent():
    r = require_login_json()
    if r:
        return r

    data = request.get_json(silent=True) or {}
    name = (data.get("name") or "").strip()[:80]
    description = (data.get("description") or "").strip()[:2000]
    system_prompt = (data.get("system_prompt") or "").strip()[:8000]
    tagline = (data.get("tagline") or "").strip()[:120]
    tone = (data.get("tone") or "amigavel").strip().lower()[:40]
    first_message = (data.get("first_message") or "Olá! Como posso ajudar?").strip()[:300]
    is_public = bool(data.get("is_public", False))

    if not name or not system_prompt:
        return jsonify({"ok": False, "error": "name e system_prompt são obrigatórios"}), 400

    try:
        sb = get_sb()
        res = sb.table("ai_agents").insert({
            "user_id": uid(),
            "name": name,
            "tagline": tagline,
            "description": description,
            "tone": tone,
            "first_message": first_message,
            "system_prompt": system_prompt,
            "is_public": is_public,
        }).execute()

        return jsonify({
            "ok": True,
            "agent": res.data[0] if res.data else None
        }), 200
    except Exception as e:
        return jsonify({"ok": False, "error": str(e)}), 400


@bp_market.route("/toggle_public/<int:agent_id>", methods=["POST"])
def toggle_public(agent_id: int):
    r = require_login_json()
    if r:
        return r

    try:
        sb = get_sb()
        row = (
            sb.table("ai_agents")
            .select("id,is_public")
            .eq("id", agent_id)
            .eq("user_id", uid())
            .limit(1)
            .execute()
            .data
        ) or []

        if not row:
            return jsonify({"ok": False, "error": "Agente não encontrado"}), 404

        current_value = bool(row[0].get("is_public"))
        new_val = not current_value

        sb.table("ai_agents").update({
            "is_public": new_val
        }).eq("id", agent_id).eq("user_id", uid()).execute()

        return jsonify({"ok": True, "is_public": new_val}), 200
    except Exception as e:
        return jsonify({"ok": False, "error": str(e)}), 400


@bp_market.route("/chat/<int:agent_id>", methods=["POST"])
def chat_agent(agent_id: int):
    r = require_login_json()
    if r:
        return r

    msg = ((request.get_json(silent=True) or {}).get("message") or "").strip()
    if not msg:
        return jsonify({"ok": False, "error": "message required"}), 400

    try:
        sb = get_sb()

        agent_rows = (
            sb.table("ai_agents")
            .select("*")
            .eq("id", agent_id)
            .limit(1)
            .execute()
            .data
        ) or []

        if not agent_rows:
            return jsonify({"ok": False, "error": "agent not found"}), 404

        agent = agent_rows[0]
        is_owner = str(agent.get("user_id")) == str(uid())
        is_public = bool(agent.get("is_public"))

        if (not is_owner) and (not is_public):
            return jsonify({"ok": False, "error": "forbidden"}), 403

        system_prompt = (agent.get("system_prompt") or "").strip()
        if not system_prompt:
            system_prompt = (
                f"Você é um assistente chamado '{agent.get('name', 'Agente')}'. "
                f"Tom: {agent.get('tone', 'amigavel')}. "
                "Seja útil, claro e objetivo."
            )

        system_prompt = apply_human_style(system_prompt)

        history_rows = (
            sb.table("chats")
            .select("role,message")
            .eq("user_id", uid())
            .eq("agent_id", agent_id)
            .order("created_at", desc=True)
            .limit(12)
            .execute()
            .data
        ) or []

        history_rows.reverse()

        messages = [{"role": "system", "content": system_prompt}]
        for item in history_rows:
            role = item.get("role")
            content = (item.get("message") or "").strip()
            if role in ("user", "assistant") and content:
                messages.append({"role": role, "content": content})

        messages.append({"role": "user", "content": msg})

        resp = client.chat.completions.create(
            model="gpt-4.1-mini",
            messages=messages,
        )
        answer = resp.choices[0].message.content or "Sem resposta."

        try:
            sb.table("chats").insert({
                "user_id": uid(),
                "role": "user",
                "message": msg,
                "agent_id": agent_id,
                "thread_id": None,
                "image_url": None,
            }).execute()

            sb.table("chats").insert({
                "user_id": uid(),
                "role": "assistant",
                "message": answer,
                "agent_id": agent_id,
                "thread_id": None,
                "image_url": None,
            }).execute()
        except Exception:
            pass

        return jsonify({"ok": True, "reply": answer}), 200

    except Exception as e:
        return jsonify({"ok": False, "error": str(e)}), 400
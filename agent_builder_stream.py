import os
import json
import time
from flask import Blueprint, render_template, request, redirect, session, url_for, Response
from openai import OpenAI
from supa import supa_user
from human_mode import HUMAN_STYLE_PROMPT

bp_builder_stream = Blueprint("builder_stream", __name__)
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


def safe_tone(t: str):
    t = (t or "amigavel").strip().lower()
    return t if t in ALLOWED_TONES else "amigavel"


def clamp(s: str, size: int) -> str:
    return (s or "").strip()[:size]


def build_big_prompt(user_request: str, base_tone: str) -> str:
    return f"""
Você é um Arquiteto de Agentes e cria novas IAs para um app.

Objetivo:
- O usuário pede: "crie uma IA para X".
- Gere um agente pronto, útil e usável.
- Só faça uma pergunta curta se for impossível continuar sem um detalhe essencial.
- Se não for essencial, assuma padrões sensatos.

Saída:
- Responda SOMENTE com JSON válido.
- Sem markdown.
- Sem texto fora do JSON.

Esquema:
{{
  "name": "Nome curto",
  "tagline": "Frase curta",
  "tone": "amigavel|formal|direto|professor|motivacional|tecnico|vendedor|criativo",
  "description": "Descrição clara",
  "capabilities": ["..."],
  "guardrails": ["..."],
  "first_message": "Primeira mensagem",
  "quick_actions": [{{"label":"...","prompt":"..."}}],
  "system_prompt": "PROMPT COMPLETO",
  "example_dialogs": [{{"user":"...","assistant":"..."}}]
}}

Regras:
- o system_prompt deve ser prático
- a IA deve ser útil já no primeiro uso
- adapte o tom para "{base_tone}"
- foque em clareza, utilidade e resultado

Estilo de escrita obrigatório:
"{HUMAN_STYLE_PROMPT}"

Pedido do usuário:
"{user_request}"

Agora gere o JSON completo.
""".strip()


@bp_builder_stream.get("/builder/live")
def builder_live_page():
    r = require_login()
    if r:
        return r
    return render_template("agent_builder_live.html")


@bp_builder_stream.post("/builder/live/stream")
def builder_live_stream():
    r = require_login()
    if r:
        return r

    req = (request.form.get("request_text") or "").strip()
    base_tone = safe_tone(request.form.get("base_tone") or "amigavel")

    if len(req) < 8:
        def one():
            yield "event: error\ndata: " + json.dumps(
                {"message": "Explique melhor (mín. 8 caracteres)."},
                ensure_ascii=False
            ) + "\n\n"
        return Response(one(), mimetype="text/event-stream")

    prompt = build_big_prompt(req, base_tone)

    def sse():
        yield "event: start\ndata: " + json.dumps(
            {"message": "Gerando agente..."},
            ensure_ascii=False
        ) + "\n\n"

        try:
            resp = client.chat.completions.create(
                model="gpt-4.1-mini",
                messages=[
                    {"role": "system", "content": "Retorne APENAS JSON válido. Sem markdown. Sem texto extra."},
                    {"role": "user", "content": prompt},
                ],
            )
            text = (resp.choices[0].message.content or "").strip()
        except Exception:
            yield "event: error\ndata: " + json.dumps(
                {"message": "Falha ao gerar. Confira OPENAI_API_KEY e tente de novo."},
                ensure_ascii=False
            ) + "\n\n"
            return

        chunk_size = 24
        for i in range(0, len(text), chunk_size):
            part = text[i:i + chunk_size]
            yield "event: chunk\ndata: " + json.dumps({"text": part}, ensure_ascii=False) + "\n\n"
            time.sleep(0.012)

        sb = supa_user(session["access_token"])
        created_id = None

        try:
            data = json.loads(text)

            name = clamp(data.get("name") or "Nova IA", 80)
            tagline = clamp(data.get("tagline"), 120)
            tone = safe_tone(data.get("tone") or base_tone)
            description = clamp(data.get("description"), 2000)
            first_message = clamp(
                data.get("first_message") or "Olá! Me diga o que você quer fazer e eu te ajudo.",
                300
            )
            system_prompt = clamp(data.get("system_prompt"), 8000)

            inserted = (
                sb.table("ai_agents")
                .insert({
                    "user_id": uid(),
                    "name": name,
                    "tagline": tagline,
                    "tone": tone,
                    "description": description,
                    "first_message": first_message,
                    "system_prompt": system_prompt,
                })
                .execute()
                .data
            )

            if inserted and isinstance(inserted, list) and inserted[0].get("id"):
                created_id = inserted[0]["id"]

            try:
                sb.table("ai_agent_builds").insert({
                    "user_id": uid(),
                    "request_text": f"[LIVE] {req}",
                    "result_json": data,
                    "created_agent_id": created_id,
                }).execute()
            except Exception:
                pass

        except Exception:
            created_id = None

        if not created_id:
            yield "event: error\ndata: " + json.dumps(
                {"message": "Gerei o código, mas falhou ao salvar no Supabase. Verifique RLS/colunas."},
                ensure_ascii=False
            ) + "\n\n"
            return

        yield "event: done\ndata: " + json.dumps({
            "agent_id": created_id,
            "edit_url": f"/agents/{created_id}/edit",
            "play_url": f"/agents/{created_id}/play"
        }, ensure_ascii=False) + "\n\n"

    return Response(
        sse(),
        mimetype="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no"
        }
    )
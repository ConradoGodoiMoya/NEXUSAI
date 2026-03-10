import os
from flask import Blueprint, render_template, request, redirect, session, url_for, flash
from openai import OpenAI
from supa import supa_user

bp_ebook = Blueprint("ebook", __name__)
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


def is_logged():
    return bool(session.get("user")) and bool(session.get("access_token"))


def require_login():
    if not is_logged():
        return redirect(url_for("login_page"))
    return None


@bp_ebook.get("/ebook")
def ebook_home():
    r = require_login()
    if r:
        return r

    sb = supa_user(session["access_token"])
    ebooks = (
        sb.table("ebooks")
        .select("*")
        .eq("user_id", session["user"]["id"])
        .order("created_at", desc=True)
        .limit(20)
        .execute()
        .data
    )

    return render_template("ebook.html", ebooks=ebooks)


@bp_ebook.post("/ebook/generate")
def ebook_generate():
    r = require_login()
    if r:
        return r

    theme = request.form.get("theme", "").strip()
    if not theme:
        flash("Digite um tema.", "error")
        return redirect(url_for("ebook.ebook_home"))

    prompt = f"""
Crie um ebook MUITO detalhado em português sobre: {theme}

Formato obrigatório:
1) Título + Subtítulo
2) Sumário
3) Introdução
4) 10 capítulos (bem detalhados) com:
   - explicação profunda
   - exemplos práticos
   - checklist
   - erros comuns
   - exercícios
5) Conclusão
6) Próximos passos
7) Glossário
8) FAQ (10 perguntas)

Escreva com títulos Markdown (#, ##, ###).
"""

    resp = client.chat.completions.create(
        model="gpt-4.1-mini",
        messages=[
            {"role": "system", "content": "Você escreve ebooks estruturados, práticos e bem detalhados."},
            {"role": "user", "content": prompt},
        ],
    )
    content = resp.choices[0].message.content or ""

    sb = supa_user(session["access_token"])
    # OBS: você precisa ter uma tabela ebooks com user_id, theme, content
    sb.table("ebooks").insert(
        {
            "user_id": session["user"]["id"],
            "theme": theme,
            "content": content,
        }
    ).execute()

    flash("Ebook gerado!", "ok")
    return redirect(url_for("ebook.ebook_home"))
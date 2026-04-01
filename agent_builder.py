import os
from flask import Blueprint, render_template, request, session, redirect, url_for, flash
from openai import OpenAI

bp_builder = Blueprint("builder", __name__, url_prefix="/builder")
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


def is_logged():
    return bool(session.get("user"))


@bp_builder.route("/", methods=["GET"])
def builder_home():
    if not is_logged():
        flash("Faça login para usar o Criar IA.", "error")
        return redirect(url_for("login"))

    return render_template("builder_home.html")


@bp_builder.route("/generate", methods=["POST"])
def generate_ai():
    if not is_logged():
        flash("Faça login para usar o Criar IA.", "error")
        return redirect(url_for("login"))

    idea = request.form.get("idea", "").strip()
    style = request.form.get("style", "").strip()
    target = request.form.get("target", "").strip()

    if not idea:
        flash("Descreva a IA que você quer criar.", "error")
        return redirect(url_for("builder.builder_home"))

    prompt = f"""
Crie uma estrutura de produto para uma IA.
Nome do projeto: {session.get("project_nickname", "Meu Projeto")}
Ideia: {idea}
Estilo: {style}
Público-alvo: {target}

Me entregue:
1. Nome da IA
2. Proposta de valor
3. Funcionalidades
4. Fluxo de telas
5. Monetização
6. Stack sugerida
7. MVP em etapas
"""

    try:
        response = client.responses.create(
            model="gpt-4.1-mini",
            input=prompt
        )
        result = response.output_text
    except Exception as e:
        result = f"Erro ao gerar estrutura da IA: {str(e)}"

    return render_template("builder_home.html", result=result)
from flask import Blueprint, render_template, request, jsonify

bp_creator = Blueprint("creator", __name__)


@bp_creator.route("/creator")
def creator_home():
    tools = [
        "Criador de Apps",
        "Criador de IA",
        "Criador de SaaS",
        "Criador de Ebook",
        "Criador de Robôs",
        "Gerador de Hardware",
        "Simulador 3D"
    ]
    return render_template("creator.html", tools=tools)


@bp_creator.route("/api/creator/generate", methods=["POST"])
def creator_generate():
    data = request.get_json(silent=True) or {}

    project_type = (data.get("project_type") or "Projeto").strip()
    name = (data.get("name") or "Meu Projeto").strip()
    niche = (data.get("niche") or "Tecnologia").strip()
    objective = (data.get("objective") or "Criar algo útil").strip()

    result = {
        "project_type": project_type,
        "name": name,
        "summary": f"{name} é um {project_type.lower()} focado em {niche}, com objetivo principal de {objective.lower()}.",
        "modules": [
            "Autenticação",
            "Painel principal",
            "Área do usuário",
            "Configurações",
            "Dashboard",
            "Integração com IA"
        ],
        "next_steps": [
            "Definir estrutura inicial",
            "Criar interface",
            "Montar backend",
            "Conectar banco de dados",
            "Preparar lançamento"
        ]
    }

    return jsonify(result)
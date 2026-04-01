from flask import Blueprint, render_template, request, jsonify
import os

bp_builders_hub = Blueprint("builders_hub", __name__)


@bp_builders_hub.route("/app-builder")
def app_builder():
    app_types = [
        "App de delivery",
        "App de estudos",
        "App de agendamento",
        "App de marketplace",
        "App de IA",
        "App social",
        "App financeiro",
        "App fitness",
        "App de chatbot",
        "App personalizado"
    ]
    return render_template("app_builder.html", app_types=app_types)


@bp_builders_hub.route("/robot-3d")
def robot_3d():
    scenarios = [
        "Fábrica inteligente",
        "Cidade futurista",
        "Resgate em floresta",
        "Base em Marte",
        "Armazém logístico",
        "Cenário customizado"
    ]
    return render_template("robot_3d.html", scenarios=scenarios)


@bp_builders_hub.route("/hardware-generator")
def hardware_generator():
    components = [
        "ESP32",
        "Arduino",
        "Raspberry Pi",
        "Sensor ultrassônico",
        "Sensor IR",
        "Câmera",
        "LiDAR",
        "Servo motor",
        "Motor DC",
        "Ponte H",
        "Módulo relé",
        "Bateria",
        "Bluetooth",
        "Wi-Fi",
        "GPS",
        "Braço robótico"
    ]
    return render_template("hardware_generator.html", components=components)


@bp_builders_hub.route("/startup-builder")
def startup_builder():
    startup_types = [
        "SaaS de produtividade",
        "SaaS com IA",
        "CRM",
        "ERP simples",
        "Automação de atendimento",
        "Assinatura de conteúdo",
        "Gestão escolar",
        "Plataforma de mentoria",
        "Plataforma de criadores",
        "SaaS personalizado"
    ]
    return render_template("startup_builder.html", startup_types=startup_types)


@bp_builders_hub.route("/api/generate-app-idea", methods=["POST"])
def generate_app_idea():
    data = request.get_json(silent=True) or {}
    app_name = data.get("name", "Meu App")
    niche = data.get("niche", "Tecnologia")
    result = {
        "title": app_name,
        "summary": f"{app_name} é um aplicativo focado em {niche}, com login, painel, área do usuário, notificações e integração com IA.",
        "features": [
            "Autenticação",
            "Painel administrativo",
            "Plano gratuito e premium",
            "Integração com IA",
            "Notificações",
            "Dashboard de métricas"
        ]
    }
    return jsonify(result)


@bp_builders_hub.route("/api/generate-hardware", methods=["POST"])
def generate_hardware():
    data = request.get_json(silent=True) or {}
    project_name = data.get("project_name", "Robô Autônomo")
    result = {
        "project": project_name,
        "logic": "Controlador principal ESP32 + sensores + módulo de potência + alimentação dedicada.",
        "components": [
            "ESP32",
            "Sensor ultrassônico",
            "Ponte H",
            "2 motores DC",
            "Bateria 12V",
            "Regulador de tensão",
            "Chave liga/desliga"
        ],
        "schematic": [
            "ESP32 -> Ponte H IN1/IN2/IN3/IN4",
            "Motores -> Saídas da Ponte H",
            "Sensor ultrassônico TRIG/ECHO -> GPIOs do ESP32",
            "Bateria -> Ponte H e regulador",
            "Regulador -> ESP32"
        ]
    }
    return jsonify(result)
import os
from functools import lru_cache
from pathlib import Path

from dotenv import load_dotenv
from flask import Flask, render_template, request, redirect, session, url_for, flash, jsonify
from openai import OpenAI

load_dotenv()

from routes.robotics_routes import bp_robotics


BASE_DIR = Path(__file__).resolve().parent
STATIC_DIR = BASE_DIR / "static"
MODELS_DIR = STATIC_DIR / "models"


APP_TYPES_AI = [
    "Chatbot com IA",
    "Agente autônomo",
    "IA para atendimento",
    "IA para análise de dados",
    "IA com visão computacional",
    "IA com voz",
]

STARTUP_TYPES = [
    "SaaS de produtividade",
    "SaaS com IA",
    "CRM",
    "ERP simples",
    "Automação de atendimento",
    "Assinatura de conteúdo",
    "Gestão escolar",
    "Plataforma de mentoria",
    "Plataforma de criadores",
    "SaaS personalizado",
]

APP_TYPES = [
    "App de delivery",
    "App de estudos",
    "App de agendamento",
    "App de marketplace",
    "App de IA",
    "App social",
    "App financeiro",
    "App fitness",
    "App de chatbot",
    "App personalizado",
]

SCENARIOS = [
    "Fábrica inteligente",
    "Cidade futurista",
    "Resgate em floresta",
    "Base em Marte",
    "Armazém logístico",
    "Cenário customizado",
]

HARDWARE_COMPONENTS = [
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
    "Braço robótico",
]

TECH_STACK = [
    "Visão Computacional",
    "Deep Learning",
    "Arduino",
    "ESP32",
    "Raspberry Pi",
    "ROS2",
    "IoT",
    "LiDAR",
    "GPS",
    "Drones",
    "Braço Robótico",
    "Sensores",
    "Controle por Voz",
    "Automação Industrial",
    "IA Generativa",
]


@lru_cache(maxsize=1)
def get_openai_client():
    api_key = os.getenv("OPENAI_API_KEY", "").strip()
    if not api_key:
        return None
    return OpenAI(api_key=api_key)


def template_exists(app: Flask, name: str) -> bool:
    return (Path(app.root_path) / "templates" / name).exists()


def safe_render(app: Flask, name: str, **context):
    if template_exists(app, name):
        return render_template(name, **context)
    return render_template("index.html", **context)


def create_app():
    app = Flask(__name__, static_folder="static", template_folder="templates")

    app.secret_key = os.getenv("FLASK_SECRET_KEY", "troque-essa-chave-agora")

    # Melhor desempenho e comportamento
    app.config["TEMPLATES_AUTO_RELOAD"] = os.getenv("FLASK_ENV") == "development"
    app.config["SEND_FILE_MAX_AGE_DEFAULT"] = 31536000
    app.config["MAX_CONTENT_LENGTH"] = 25 * 1024 * 1024
    app.config["JSON_AS_ASCII"] = False
    app.config["JSON_SORT_KEYS"] = False

    app.config["SESSION_COOKIE_HTTPONLY"] = True
    app.config["SESSION_COOKIE_SAMESITE"] = "Lax"
    app.config["SESSION_COOKIE_SECURE"] = False  # mude para True no deploy com HTTPS

def create_app():
    app = Flask(__name__, static_folder="static", template_folder="templates")

    app.secret_key = os.getenv("FLASK_SECRET_KEY", "troque-essa-chave-agora")

    # Melhor desempenho e comportamento
    app.config["TEMPLATES_AUTO_RELOAD"] = os.getenv("FLASK_ENV") == "development"
    app.config["SEND_FILE_MAX_AGE_DEFAULT"] = 31536000
    app.config["MAX_CONTENT_LENGTH"] = 25 * 1024 * 1024
    app.config["JSON_AS_ASCII"] = False
    app.config["JSON_SORT_KEYS"] = False

    app.config["SESSION_COOKIE_HTTPONLY"] = True
    app.config["SESSION_COOKIE_SAMESITE"] = "Lax"
    app.config["SESSION_COOKIE_SECURE"] = False  # mude para True no deploy com HTTPS

    app.register_blueprint(bp_robotics)

    @app.route("/project/save-nickname", methods=["POST"], endpoint="project_save_nickname_unique")
    def project_save_nickname_unique():
        nickname = request.form.get("project_nickname", "").strip()

        if not nickname:
            flash("Digite um apelido para o projeto.", "error")
            return redirect(request.referrer or url_for("home"))

        session["project_nickname"] = nickname
        flash("Apelido do projeto salvo com sucesso.", "success")
        return redirect(request.referrer or url_for("home"))

    @app.after_request
    def add_cache_headers(response):
        path = request.path.lower()

        if any(path.endswith(ext) for ext in (
            ".js", ".css", ".png", ".jpg", ".jpeg", ".webp",
            ".svg", ".gif", ".ico", ".glb", ".gltf", ".bin",
            ".hdr", ".mp4", ".webm"
        )):
            response.headers["Cache-Control"] = "public, max-age=31536000, immutable"

        elif path.endswith(".html") or path == "/":
            response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"

        return response

    @app.context_processor
    def inject_globals():
        return {
            "logged_user": session.get("user"),
        }

    @app.route("/")
    def home():
        return safe_render(app, "index.html")

    app.add_url_rule("/", endpoint="index", view_func=home)

    @app.route("/health")
    def health():
        return jsonify({
            "status": "ok",
            "openai": bool(get_openai_client()),
            "models_dir_exists": MODELS_DIR.exists(),
        })

    @app.route("/login", methods=["GET", "POST"])
    def login():
        if request.method == "POST":
            email = request.form.get("email", "").strip()
            password = request.form.get("password", "").strip()

            if not email or not password:
                flash("Preencha e-mail e senha.", "error")
                return safe_render(app, "login.html")

            session["user"] = {
                "name": email.split("@")[0].title(),
                "email": email
            }
            flash("Login realizado com sucesso.", "success")
            return redirect(url_for("home"))

        return safe_render(app, "login.html")

    @app.route("/register", methods=["GET", "POST"])
    def register():
        if request.method == "POST":
            name = request.form.get("name", "").strip()
            email = request.form.get("email", "").strip()
            password = request.form.get("password", "").strip()
            confirm_password = request.form.get("confirm_password", "").strip()

            if not name or not email or not password or not confirm_password:
                flash("Preencha todos os campos.", "error")
                return safe_render(app, "register.html")

            if password != confirm_password:
                flash("As senhas não coincidem.", "error")
                return safe_render(app, "register.html")

            session["user"] = {
                "name": name,
                "email": email
            }
            flash("Conta criada com sucesso.", "success")
            return redirect(url_for("home"))

        return safe_render(app, "register.html")

    @app.route("/logout")
    def logout():
        session.clear()
        flash("Você saiu da sua conta.", "success")
        return redirect(url_for("home"))

    @app.route("/dashboard")
    def dashboard():
        return safe_render(app, "index.html")

    @app.route("/chat")
    def chat_page():
        return safe_render(app, "chat.html")

    @app.route("/ebook")
    def ebook_page():
        return safe_render(app, "ebook.html")

    @app.route("/ai")
    def ai_creator():
        return safe_render(app, "app_builder.html", app_types=APP_TYPES_AI)

    @app.route("/saas")
    def saas():
        return safe_render(app, "startup_builder.html", startup_types=STARTUP_TYPES)

    @app.route("/app-builder")
    def app_builder():
        return safe_render(app, "app_builder.html", app_types=APP_TYPES)

    @app.route("/robot-3d")
    def robot_3d():
        return safe_render(app, "robot_3d.html", scenarios=SCENARIOS)

    @app.route("/nexus-robotics")
    def nexus_robotics():
        return redirect(url_for("robotics.robotics_home"))

    @app.route("/hardware-generator")
    def hardware_generator():
        return safe_render(app, "hardware_generator.html", components=HARDWARE_COMPONENTS)

    @app.route("/startup-builder")
    def startup_builder():
        return safe_render(app, "startup_builder.html", startup_types=STARTUP_TYPES)

    @app.route("/robots")
    def robots():
        return safe_render(app, "robots.html", tech_stack=TECH_STACK)

    @app.route("/scenarios")
    def scenarios():
        return safe_render(app, "robot_3d.html", scenarios=SCENARIOS)

    @app.route("/api/models/check")
    def check_models():
        """
        Rota para você ver se os arquivos 3D estão realmente no lugar certo.
        """
        expected = [
            "microbit.glb",
            "servo_motor.glb",
            "ultrasonic_sensor.glb",
            "wheel.glb",
            "battery_pack.glb",
            "arduino_uno.glb",
            "raspberry_pi.glb",
            "camera_module.glb",
            "lidar.glb",
            "robot_arm.glb",
        ]

        data = []
        for name in expected:
            path = MODELS_DIR / name
            data.append({
                "file": name,
                "exists": path.exists(),
                "url": f"/static/models/{name}"
            })

        return jsonify({
            "models_dir": str(MODELS_DIR),
            "models_dir_exists": MODELS_DIR.exists(),
            "files": data
        })

    @app.route("/chat_api", methods=["POST"])
    def chat_api():
        data = request.get_json(silent=True) or {}
        user_message = (data.get("message") or "").strip()

        if not user_message:
            return jsonify({"reply": "Digite uma mensagem para conversar com a Nexus IA."}), 400

        client = get_openai_client()

        if not client:
            return jsonify({
                "reply": "OpenAI não conectada. Coloque sua OPENAI_API_KEY no arquivo .env para ativar o chat real."
            })

        try:
            response = client.responses.create(
                model="gpt-4.1-mini",
                input=[
                    {
                        "role": "system",
                        "content": (
                            "Você é a Nexus IA, especialista em criação de apps, SaaS, IA, "
                            "ebooks, robótica, hardware e automações. Responda em português do Brasil."
                        )
                    },
                    {
                        "role": "user",
                        "content": user_message
                    }
                ]
            )

            reply = getattr(response, "output_text", "").strip() or "Não consegui gerar resposta agora."
            return jsonify({"reply": reply})

        except Exception as e:
            return jsonify({"reply": f"Erro ao falar com a OpenAI: {str(e)}"}), 500

    @app.route("/api/robot/software", methods=["POST"])
    def robot_software():
        data = request.get_json(silent=True) or {}
        prompt = (data.get("prompt") or "").strip()

        if not prompt:
            prompt = "Robô humanoide com sensores, visão e sistema de movimento."

        client = get_openai_client()

        if not client:
            fallback = """class NexusRobot:
    def __init__(self):
        self.sensores = ["camera", "lidar", "ultrassonico"]
        self.estado = "inativo"

    def iniciar(self):
        self.estado = "ativo"
        print("Robô iniciado.")

    def ler_sensores(self):
        return {
            "obstaculo": False,
            "alvo": "area de inspeção",
            "nivel_bateria": 87
        }

    def decidir(self, dados):
        if dados["nivel_bateria"] < 20:
            return "retornar_base"
        if dados["obstaculo"]:
            return "desviar"
        return "avancar"

    def executar(self, acao):
        print(f"Executando: {acao}")

    def ciclo(self):
        dados = self.ler_sensores()
        acao = self.decidir(dados)
        self.executar(acao)

if __name__ == "__main__":
    robo = NexusRobot()
    robo.iniciar()
    robo.ciclo()
"""
            return jsonify({"code": fallback})

        try:
            response = client.responses.create(
                model="gpt-4.1-mini",
                input=[
                    {
                        "role": "system",
                        "content": (
                            "Você gera software em Python para robôs. "
                            "Responda somente com código Python bem organizado, com comentários e exemplo final."
                        )
                    },
                    {
                        "role": "user",
                        "content": f"Crie um software para robô com base nesta descrição:\n\n{prompt}"
                    }
                ]
            )

            code = getattr(response, "output_text", "").strip() or "# Não foi possível gerar código agora."
            return jsonify({"code": code})

        except Exception as e:
            return jsonify({"code": f"# Erro ao gerar software: {str(e)}"}), 500

    @app.route("/api/robot/plan", methods=["POST"])
    def robot_plan():
        data = request.get_json(silent=True) or {}
        plan_type = (data.get("type") or "geral").strip().lower()
        prompt = (data.get("prompt") or "").strip()

        if not prompt:
            prompt = "Robô humanoide com foco em uso prático."

        client = get_openai_client()

        if not client:
            fallback_map = {
                "carcaca": (
                    "Sugestão de carcaça: estrutura humanoide com tronco reforçado, "
                    "cabeça compacta, braços articulados e carcaça externa em alumínio técnico "
                    "ou polímero reforçado."
                ),
                "hardware": (
                    "Sugestão de hardware: núcleo de processamento, chip de IA, bateria principal, "
                    "módulo de potência, câmera frontal, lidar e motores para braços e pernas."
                ),
                "orcamento": (
                    "Sugestão de orçamento: separar custo em carcaça, sensores, processamento, "
                    "energia, motores, montagem e margem de segurança."
                ),
            }
            return jsonify({
                "text": fallback_map.get(
                    plan_type,
                    "Sugestão geral: defina objetivo, carcaça, hardware, software e orçamento."
                )
            })

        try:
            response = client.responses.create(
                model="gpt-4.1-mini",
                input=[
                    {
                        "role": "system",
                        "content": (
                            "Você é um planejador técnico do Nexus Robotics. "
                            "Responda em português do Brasil, de forma objetiva, clara e útil. "
                            "Sem markdown complexo."
                        )
                    },
                    {
                        "role": "user",
                        "content": f"Tipo de planejamento: {plan_type}\n\nPedido:\n{prompt}"
                    }
                ]
            )

            text = getattr(response, "output_text", "").strip() or "Não foi possível gerar a análise agora."
            return jsonify({"text": text})

        except Exception as e:
            return jsonify({"text": f"Erro ao gerar análise: {str(e)}"}), 500

    @app.route("/api/robot/library", methods=["POST"])
    def robot_library_ai():
        data = request.get_json(silent=True) or {}
        prompt = (data.get("prompt") or "").strip()

        if not prompt:
            prompt = "Monte uma sugestão de robô humanoide com carcaça, hardware, software e orçamento."

        client = get_openai_client()

        if not client:
            return jsonify({
                "text": (
                    "Sugestão base:\n"
                    "- Carcaça: alumínio técnico + cabeça compacta + braços reforçados\n"
                    "- Hardware: CPU principal, chip de IA, bateria principal, câmera frontal, lidar, motores\n"
                    "- Software: navegação, leitura de sensores, tomada de decisão e rotina principal\n"
                    "- Orçamento: separar peças, montagem e margem de segurança"
                )
            })

        try:
            response = client.responses.create(
                model="gpt-4.1-mini",
                input=[
                    {
                        "role": "system",
                        "content": (
                            "Você é especialista em robótica. "
                            "Monte sugestões completas de robôs em português do Brasil, "
                            "de forma clara, objetiva e prática. "
                            "Inclua carcaça, hardware, software e orçamento base."
                        )
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ]
            )

            text = getattr(response, "output_text", "").strip() or "Não foi possível gerar a biblioteca agora."
            return jsonify({"text": text})

        except Exception as e:
            return jsonify({"text": f"Erro ao gerar sugestão: {str(e)}"}), 500

    @app.route("/api/robot/generate-code", methods=["POST"])
    def generate_robot_code():
        data = request.get_json(silent=True) or {}

        robot_name = (data.get("robot_name") or "RoboNexus").strip()
        robot_type = (data.get("robot_type") or "humanoide").strip()
        objective = (data.get("objective") or "executar tarefas automatizadas").strip()
        sensors = (data.get("sensors") or "câmera, ultrassônico").strip()
        user_code = (data.get("user_code") or "").strip()

        client = get_openai_client()

        if client:
            try:
                prompt = f"""
Crie ou complete um código inicial em Python para um robô chamado {robot_name}.
Tipo: {robot_type}
Objetivo: {objective}
Sensores: {sensors}

Se existir código parcial do usuário, use como base e melhore:
{user_code if user_code else "Sem código inicial do usuário."}

Quero:
- código organizado
- comentários claros
- classe principal do robô
- métodos para sensores, decisão e movimento
- resposta só com código Python
"""
                response = client.responses.create(
                    model="gpt-4.1-mini",
                    input=[
                        {
                            "role": "system",
                            "content": "Você gera código Python limpo e didático para robótica."
                        },
                        {
                            "role": "user",
                            "content": prompt
                        }
                    ]
                )
                code = getattr(response, "output_text", "").strip()
                if code:
                    return jsonify({"code": code})
            except Exception:
                pass

        fallback_code = f'''class {robot_name}:
    def __init__(self):
        self.tipo = "{robot_type}"
        self.objetivo = "{objective}"
        self.sensores = "{sensors}".split(", ")

    def iniciar_sensores(self):
        for sensor in self.sensores:
            print(f"Iniciando sensor: {{sensor.strip()}}")

    def analisar_ambiente(self):
        print("Analisando ambiente com os sensores...")
        return {{"obstaculo": False, "alvo_detectado": True}}

    def tomar_decisao(self, dados):
        if dados.get("obstaculo"):
            return "desviar"
        if dados.get("alvo_detectado"):
            return "avancar"
        return "aguardar"

    def executar_acao(self, acao):
        print(f"Ação escolhida: {{acao}}")

    def rodar_ciclo(self):
        self.iniciar_sensores()
        dados = self.analisar_ambiente()
        acao = self.tomar_decisao(dados)
        self.executar_acao(acao)
'''
        return jsonify({"code": fallback_code})

    print("APP CERTO RODANDO")
    print("\nROTAS REGISTRADAS:")
    for rule in app.url_map.iter_rules():
        print(rule)

    return app


app = create_app()

if __name__ == "__main__":
    app.run(
        host="0.0.0.0",
        port=5000,
        debug=True,
        threaded=True,
        use_reloader=False
    )
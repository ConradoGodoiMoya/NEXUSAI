import os
import json
import logging
from datetime import timedelta
from logging.handlers import RotatingFileHandler

from flask import (
    Flask,
    render_template,
    request,
    redirect,
    session,
    url_for,
    flash,
    jsonify,
)
from dotenv import load_dotenv
from postgrest.exceptions import APIError

load_dotenv()

from supa import supa_anon, supa_user
from ai import bp_chat
from agents_routes import bp_agents
from ebook import bp_ebook
from agent_builder import bp_builder
from agents_studio import bp_studio
from agent_builder_stream import bp_builder_stream
from images_routes import bp_images
from anti_scam import bp_scam
from action_plan import bp_plan
from agent_market import bp_market
from uploads_routes import bp_uploads
from agent_builder_routes import bp_builder_api
from saas_routes import bp_saas

try:
    from stripe_routes import bp_stripe
except Exception:
    bp_stripe = None


def configure_logging(app: Flask):
    os.makedirs("logs", exist_ok=True)

    formatter = logging.Formatter(
        "[%(asctime)s] %(levelname)s in %(module)s: %(message)s"
    )

    file_handler = RotatingFileHandler(
        "logs/app.log",
        maxBytes=1_000_000,
        backupCount=3,
        encoding="utf-8",
    )
    file_handler.setLevel(logging.INFO)
    file_handler.setFormatter(formatter)

    console_handler = logging.StreamHandler()
    console_handler.setLevel(logging.INFO)
    console_handler.setFormatter(formatter)

    app.logger.setLevel(logging.INFO)

    if not app.logger.handlers:
        app.logger.addHandler(file_handler)
        app.logger.addHandler(console_handler)


def create_app():
    app = Flask(__name__)
    app.secret_key = os.getenv("FLASK_SECRET_KEY", "troque-essa-chave")

    app.config["TEMPLATES_AUTO_RELOAD"] = True
    app.config["SEND_FILE_MAX_AGE_DEFAULT"] = timedelta(days=30)
    app.config["PERMANENT_SESSION_LIFETIME"] = timedelta(days=7)
    app.config["APP_BASE_URL"] = os.getenv("APP_BASE_URL", "").strip()
    app.config["MAX_CONTENT_LENGTH"] = 10 * 1024 * 1024  # 10 MB

    configure_logging(app)

    # Blueprints principais
    app.register_blueprint(bp_chat)
    app.register_blueprint(bp_agents)
    app.register_blueprint(bp_ebook)
    app.register_blueprint(bp_builder)
    app.register_blueprint(bp_studio)
    app.register_blueprint(bp_builder_stream)
    app.register_blueprint(bp_images)
    app.register_blueprint(bp_scam)
    app.register_blueprint(bp_plan)
    app.register_blueprint(bp_market)
    app.register_blueprint(bp_uploads)
    app.register_blueprint(bp_builder_api)
    app.register_blueprint(bp_saas)

    # Stripe
    if bp_stripe is not None:
        app.register_blueprint(bp_stripe)
        app.logger.info("Stripe blueprint registrado com sucesso.")
    else:
        app.logger.warning("Stripe blueprint não foi carregado.")

    def is_logged():
        return bool(session.get("user")) and bool(session.get("access_token"))

    def user_id():
        u = session.get("user") or {}
        return u.get("id")

    def fmt_dt(dt_str):
        if not dt_str:
            return None
        try:
            s = str(dt_str).replace("T", " ")
            return s[:16]
        except Exception:
            return dt_str

    @app.after_request
    def apply_security_headers(response):
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "SAMEORIGIN"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Cache-Control"] = "no-store"
        return response

    @app.errorhandler(APIError)
    def handle_postgrest_apierror(e):
        payload = {}
        msg = ""
        code = None

        if e.args:
            first = e.args[0]
            if isinstance(first, dict):
                payload = first
            elif isinstance(first, str):
                msg = first
                try:
                    maybe = json.loads(first)
                    if isinstance(maybe, dict):
                        payload = maybe
                except Exception:
                    pass

        if payload:
            code = payload.get("code")
            msg = payload.get("message", msg) or msg

        if code == "PGRST303" or ("JWT expired" in (msg or "")) or ("JWT expired" in str(e)):
            session.clear()
            flash("Sua sessão expirou. Faça login de novo.", "error")
            return redirect(url_for("login_page"))

        app.logger.exception("Erro PostgREST tratado")
        raise e

    @app.errorhandler(400)
    def bad_request(e):
        if request.path.startswith("/api/") or request.is_json:
            return jsonify({"ok": False, "error": "Requisição inválida"}), 400
        return render_template("error.html", code=400, message="Requisição inválida"), 400

    @app.errorhandler(404)
    def not_found(e):
        if request.path.startswith("/api/") or request.is_json:
            return jsonify({"ok": False, "error": "Página não encontrada"}), 404
        return render_template("error.html", code=404, message="Página não encontrada"), 404

    @app.errorhandler(413)
    def too_large(e):
        if request.path.startswith("/api/") or request.is_json:
            return jsonify({"ok": False, "error": "Arquivo muito grande"}), 413
        return render_template("error.html", code=413, message="Arquivo muito grande"), 413

    @app.errorhandler(500)
    def internal_error(e):
        app.logger.exception("Erro interno não tratado")
        if request.path.startswith("/api/") or request.is_json:
            return jsonify({"ok": False, "error": "Erro interno no servidor"}), 500
        return render_template("error.html", code=500, message="Erro interno no servidor"), 500

    @app.context_processor
    def inject_user():
        u = session.get("user") or {}
        meta = u.get("user_metadata") or {}
        nickname = session.get("nickname") or meta.get("nickname") or meta.get("apelido")
        return {
            "current_user": u,
            "is_logged": is_logged(),
            "nickname": nickname,
        }

    @app.get("/")
    def landing():
        if is_logged():
            return redirect(url_for("dashboard"))
        return render_template("landing.html")

    @app.get("/dashboard")
    def dashboard():
        if not is_logged():
            return redirect(url_for("login_page"))

        uid = user_id()

        if not session.get("access_token"):
            session.clear()
            flash("Sua sessão expirou. Faça login de novo.", "error")
            return redirect(url_for("login_page"))

        sb = supa_user(session["access_token"])

        try:
            chats_count = (
                sb.table("chats").select("id", count="exact").eq("user_id", uid).execute().count
            ) or 0
        except Exception:
            chats_count = 0

        try:
            agents_count = (
                sb.table("ai_agents").select("id", count="exact").eq("user_id", uid).execute().count
            ) or 0
        except Exception:
            agents_count = 0

        try:
            ebooks_count = (
                sb.table("ebooks").select("id", count="exact").eq("user_id", uid).execute().count
            ) or 0
        except Exception:
            ebooks_count = 0

        try:
            saas_count = (
                sb.table("saas_projects").select("id", count="exact").eq("user_id", uid).execute().count
            ) or 0
        except Exception:
            saas_count = 0

        last_chat_at = None
        last_ebook_at = None
        last_agent_at = None
        last_ebook = None
        last_agent = None

        try:
            row = (
                sb.table("chats")
                .select("created_at")
                .eq("user_id", uid)
                .order("created_at", desc=True)
                .limit(1)
                .execute()
                .data
            )
            if row:
                last_chat_at = fmt_dt(row[0].get("created_at"))
        except Exception:
            pass

        try:
            row = (
                sb.table("ebooks")
                .select("id,theme,created_at")
                .eq("user_id", uid)
                .order("created_at", desc=True)
                .limit(1)
                .execute()
                .data
            )
            last_ebook = row[0] if row else None
            last_ebook_at = fmt_dt(last_ebook.get("created_at")) if last_ebook else None
        except Exception:
            pass

        try:
            row = (
                sb.table("ai_agents")
                .select("id,name,created_at")
                .eq("user_id", uid)
                .order("created_at", desc=True)
                .limit(1)
                .execute()
                .data
            )
            last_agent = row[0] if row else None
            last_agent_at = fmt_dt(last_agent.get("created_at")) if last_agent else None
        except Exception:
            pass

        top_agents = []
        try:
            recent = (
                sb.table("chats")
                .select("agent_id,role")
                .eq("user_id", uid)
                .order("created_at", desc=True)
                .limit(800)
                .execute()
                .data
            ) or []

            counts = {}
            for r in recent:
                if r.get("role") != "user":
                    continue
                aid = r.get("agent_id")
                if not aid:
                    continue
                counts[aid] = counts.get(aid, 0) + 1

            top_ids = sorted(counts.keys(), key=lambda k: counts[k], reverse=True)[:5]

            if top_ids:
                agents = (
                    sb.table("ai_agents")
                    .select("id,name,tone")
                    .eq("user_id", uid)
                    .in_("id", top_ids)
                    .execute()
                    .data
                ) or []

                by_id = {a["id"]: a for a in agents}
                top_agents = [
                    {
                        "id": aid,
                        "name": by_id.get(aid, {}).get("name", f"Agente #{aid}"),
                        "tone": by_id.get(aid, {}).get("tone", "amigavel"),
                        "uses": counts[aid],
                    }
                    for aid in top_ids
                ]
        except Exception:
            top_agents = []

        return render_template(
            "dashboard.html",
            chats_count=chats_count,
            agents_count=agents_count,
            ebooks_count=ebooks_count,
            saas_count=saas_count,
            last_chat_at=last_chat_at,
            last_ebook_at=last_ebook_at,
            last_agent_at=last_agent_at,
            last_ebook=last_ebook,
            last_agent=last_agent,
            top_agents=top_agents,
        )

    @app.get("/login")
    def login_page():
        return render_template("login.html")

    @app.post("/login")
    def login_post():
        email = request.form.get("email", "").strip().lower()
        password = request.form.get("password", "").strip()

        if not email or not password:
            flash("Preencha email e senha.", "error")
            return redirect(url_for("login_page"))

        sb = supa_anon()
        try:
            data = sb.auth.sign_in_with_password({"email": email, "password": password})
        except Exception:
            flash("Falha ao entrar. Confira email e senha.", "error")
            return redirect(url_for("login_page"))

        session.clear()
        session.permanent = True
        session["user"] = data.user.model_dump()
        session["access_token"] = data.session.access_token

        meta = session["user"].get("user_metadata") or {}
        session["nickname"] = meta.get("nickname") or meta.get("apelido") or ""

        flash("Bem-vindo de volta!", "ok")
        return redirect(url_for("dashboard"))

    @app.get("/register")
    def register_page():
        return render_template("register.html")

    @app.post("/register")
    def register_post():
        nickname = request.form.get("nickname", "").strip()
        email = request.form.get("email", "").strip().lower()
        password = request.form.get("password", "").strip()

        if not nickname or len(nickname) < 2:
            flash("Coloque um apelido (mín. 2 letras).", "error")
            return redirect(url_for("register_page"))

        if not email or not password or len(password) < 6:
            flash("Use um email válido e senha com pelo menos 6 caracteres.", "error")
            return redirect(url_for("register_page"))

        sb = supa_anon()
        try:
            sb.auth.sign_up(
                {
                    "email": email,
                    "password": password,
                    "options": {
                        "data": {"nickname": nickname}
                    }
                }
            )
        except Exception:
            flash("Não foi possível criar a conta. Tente outro email.", "error")
            return redirect(url_for("register_page"))

        flash("Conta criada! Agora faça login.", "ok")
        return redirect(url_for("login_page"))

    @app.get("/logout")
    def logout():
        session.clear()
        flash("Você saiu.", "ok")
        return redirect(url_for("landing"))

    return app


app = create_app()

if __name__ == "__main__":
    debug_mode = os.getenv("FLASK_DEBUG", "1") == "1"
    app.run(host="0.0.0.0", port=5000, debug=debug_mode)
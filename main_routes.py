from flask import Blueprint, render_template, session, request, redirect, url_for, flash

from core.auth import is_logged, current_plan
from core.extensions import supabase_anon

bp_main = Blueprint("main", __name__)


@bp_main.route("/")
def home():
    if is_logged():
        return redirect(url_for("main.dashboard"))
    return render_template("login.html", user_plan=current_plan())


@bp_main.route("/dashboard")
def dashboard():
    if not is_logged():
        return redirect(url_for("main.login"))

    return render_template(
        "dashboard.html",
        user=session.get("user"),
        user_plan=current_plan(),
    )


@bp_main.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        email = request.form.get("email", "").strip()
        password = request.form.get("password", "").strip()

        if not email or not password:
            flash("Preencha email e senha.", "error")
            return redirect(url_for("main.login"))

        try:
            if supabase_anon is None:
                raise RuntimeError("Supabase não configurado.")

            supabase_anon.auth.sign_in_with_password({
                "email": email,
                "password": password,
            })

            session["user"] = {"email": email}
            session.setdefault("plan_name", "Plano Free")

            flash("Login feito com sucesso.", "success")
            return redirect(url_for("main.dashboard"))

        except Exception as exc:
            flash(f"Erro no login: {exc}", "error")
            return redirect(url_for("main.login"))

    return render_template("login.html", user_plan=current_plan())


@bp_main.route("/logout")
def logout():
    session.clear()
    flash("Você saiu da conta.", "success")
    return redirect(url_for("main.login"))


@bp_main.app_context_processor
def inject_globals():
    return {
        "user_plan": current_plan(),
        "user_data": session.get("user"),
    }
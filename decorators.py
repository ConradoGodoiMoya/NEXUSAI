from functools import wraps
from flask import redirect, url_for, flash
from core.auth import is_logged


def login_required(view_func):
    @wraps(view_func)
    def wrapper(*args, **kwargs):
        if not is_logged():
            flash("Faça login para continuar.", "error")
            return redirect(url_for("main.login"))
        return view_func(*args, **kwargs)
    return wrapper
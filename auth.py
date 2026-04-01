from flask import session


def is_logged() -> bool:
    return bool(session.get("user"))


def current_user():
    return session.get("user")


def current_plan() -> str:
    return session.get("plan_name", "Plano Free")
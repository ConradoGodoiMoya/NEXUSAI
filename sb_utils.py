from flask import session
from supa import supa_user

def uid():
    u = session.get("user")
    return u["id"] if u else None

def sb_authed():
    """
    Supabase client autenticado com o token do usuário.
    Requer que seu login salve session['access_token'].
    """
    token = session.get("access_token")
    if not token:
        return None
    return supa_user(token)
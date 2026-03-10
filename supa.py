import os
from supabase import create_client


def supa_anon():
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_ANON_KEY")
    return create_client(url, key)


def supa_user(access_token: str):
    sb = supa_anon()
    # JWT do usuário logado pro PostgREST (RLS funciona)
    sb.postgrest.auth(access_token)
    return sb
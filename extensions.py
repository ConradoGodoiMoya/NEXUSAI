from openai import OpenAI
from supabase import create_client, Client
import stripe

openai_client: OpenAI | None = None
supabase_anon: Client | None = None
supabase_service: Client | None = None


def init_extensions(app):
    global openai_client, supabase_anon, supabase_service

    if app.config["OPENAI_API_KEY"]:
        openai_client = OpenAI(api_key=app.config["OPENAI_API_KEY"])

    if app.config["SUPABASE_URL"] and app.config["SUPABASE_ANON_KEY"]:
        supabase_anon = create_client(
            app.config["SUPABASE_URL"],
            app.config["SUPABASE_ANON_KEY"],
        )

    if app.config["SUPABASE_URL"] and app.config["SUPABASE_SERVICE_KEY"]:
        supabase_service = create_client(
            app.config["SUPABASE_URL"],
            app.config["SUPABASE_SERVICE_KEY"],
        )

    stripe.api_key = app.config["STRIPE_SECRET_KEY"]
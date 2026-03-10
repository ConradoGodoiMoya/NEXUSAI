import os
import logging
from flask import Blueprint, request, jsonify, current_app
import stripe

bp_stripe = Blueprint("stripe", __name__, url_prefix="/stripe")
logger = logging.getLogger(__name__)


def get_stripe_client():
    secret_key = os.getenv("STRIPE_SECRET_KEY", "").strip()
    if not secret_key:
        raise RuntimeError("STRIPE_SECRET_KEY não configurada.")
    stripe.api_key = secret_key
    return stripe


def get_base_url():
    base = current_app.config.get("APP_BASE_URL", "").strip()
    if base:
        return base.rstrip("/")
    return request.host_url.rstrip("/")


PLANS = {
    "starter": {
        "name": "Starter",
        "price_id": os.getenv("STRIPE_PRICE_STARTER", "").strip(),
    },
    "pro": {
        "name": "Pro",
        "price_id": os.getenv("STRIPE_PRICE_PRO", "").strip(),
    },
    "max": {
        "name": "Max",
        "price_id": os.getenv("STRIPE_PRICE_MAX", "").strip(),
    },
}


@bp_stripe.route("/checkout/<plan_key>", methods=["POST"])
def create_checkout_session(plan_key):
    try:
        stripe_client = get_stripe_client()
        plan = PLANS.get(plan_key)

        if not plan:
            return jsonify({"ok": False, "error": "Plano inválido."}), 400

        if not plan["price_id"]:
            return jsonify({"ok": False, "error": f"Price ID não configurado para {plan_key}."}), 500

        base_url = get_base_url()

        session = stripe_client.checkout.Session.create(
            mode="subscription",
            line_items=[
                {
                    "price": plan["price_id"],
                    "quantity": 1,
                }
            ],
            success_url=f"{base_url}/plan?success=1&plan={plan_key}",
            cancel_url=f"{base_url}/plan?canceled=1",
            metadata={"plan_key": plan_key},
            allow_promotion_codes=True,
        )

        return jsonify({
            "ok": True,
            "checkout_url": session.url
        }), 200

    except stripe.error.StripeError as e:
        logger.exception("Erro Stripe ao criar checkout")
        return jsonify({
            "ok": False,
            "error": str(e.user_message or "Erro ao iniciar pagamento.")
        }), 500
    except Exception as e:
        logger.exception("Erro interno ao criar checkout")
        return jsonify({
            "ok": False,
            "error": str(e)
        }), 500


@bp_stripe.route("/webhook", methods=["POST"])
def stripe_webhook():
    payload = request.get_data()
    sig_header = request.headers.get("Stripe-Signature", "")
    endpoint_secret = os.getenv("STRIPE_WEBHOOK_SECRET", "").strip()

    if not endpoint_secret:
        return jsonify({"ok": False, "error": "Webhook secret não configurado."}), 500

    try:
        event = stripe.Webhook.construct_event(
            payload=payload,
            sig_header=sig_header,
            secret=endpoint_secret
        )
    except ValueError:
        return jsonify({"ok": False, "error": "Payload inválido."}), 400
    except stripe.error.SignatureVerificationError:
        return jsonify({"ok": False, "error": "Assinatura inválida."}), 400
    except Exception as e:
        logger.exception("Erro no webhook")
        return jsonify({"ok": False, "error": str(e)}), 400

    event_type = event["type"]
    data_object = event["data"]["object"]

    try:
        if event_type == "checkout.session.completed":
            current_app.logger.info("Pagamento concluído: %s", data_object.get("id"))
        elif event_type == "invoice.payment_succeeded":
            current_app.logger.info("Assinatura renovada com sucesso.")
        elif event_type == "invoice.payment_failed":
            current_app.logger.warning("Falha no pagamento da assinatura.")
        elif event_type == "customer.subscription.deleted":
            current_app.logger.warning("Assinatura cancelada.")

        return jsonify({"ok": True}), 200

    except Exception as e:
        logger.exception("Erro processando evento Stripe")
        return jsonify({"ok": False, "error": str(e)}), 500
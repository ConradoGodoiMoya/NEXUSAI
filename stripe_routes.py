from flask import Blueprint, current_app

from core.decorators import login_required
from core.utils import json_response
from services.billing_service import get_prices

bp_stripe = Blueprint("stripe", __name__, url_prefix="/billing")


@bp_stripe.route("/prices")
@login_required
def prices():
    return json_response({
        "ok": True,
        "prices": get_prices(current_app.config),
    })
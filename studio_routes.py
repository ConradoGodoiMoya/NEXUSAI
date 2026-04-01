from flask import Blueprint, render_template
from core.decorators import login_required

bp_studio = Blueprint("studio", __name__, url_prefix="/studio")


@bp_studio.route("/")
@login_required
def studio_home():
    return render_template("studio.html")
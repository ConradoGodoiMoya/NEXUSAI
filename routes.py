import os
from flask import Blueprint, render_template, jsonify, request
from robotics.services.db import init_robotics_db, get_conn
from robotics.services.utils import loads
from robotics.services.importer import run_import_all
from robotics.services.robot_generator import generate_robot_build

bp_robotics = Blueprint(
    "robotics",
    __name__,
    url_prefix="/robotics"
)

ADMIN_IMPORT_TOKEN = os.getenv("ADMIN_IMPORT_TOKEN", "troque-esse-token")

init_robotics_db()


@bp_robotics.route("/")
def robotics_home():
    return render_template("robotics/index.html")


@bp_robotics.route("/api/health")
def robotics_health():
    return jsonify({"ok": True})


@bp_robotics.route("/api/admin/import", methods=["POST"])
def robotics_import_all():
    token = request.headers.get("X-Admin-Token", "")
    if token != ADMIN_IMPORT_TOKEN:
        return jsonify({"ok": False, "error": "Token inválido"}), 403

    try:
        results = run_import_all()
        return jsonify({"ok": True, "results": results})
    except Exception as e:
        return jsonify({"ok": False, "error": str(e)}), 500


@bp_robotics.route("/api/parts/search")
def robotics_part_search():
    q = (request.args.get("q") or "").strip().lower()
    category = (request.args.get("category") or "").strip().lower()
    only_3d = (request.args.get("only_3d") or "").strip().lower() in {"1", "true", "yes"}
    limit = min(int(request.args.get("limit", 20)), 100)

    sql = """
        SELECT id, source, name, category, extension, tags, source_path, metadata_json, created_at
        FROM robotics_parts
        WHERE 1=1
    """
    params = []

    if q:
        sql += " AND lower(name) LIKE ? "
        params.append(f"%{q}%")

    if category:
        sql += " AND lower(category) = ? "
        params.append(category)

    if only_3d:
        sql += " AND extension IN ('.step', '.stp', '.wrl', '.wrz', '.stl', '.dae', '.obj') "

    sql += " ORDER BY created_at DESC LIMIT ? "
    params.append(limit)

    with get_conn() as conn:
        rows = conn.execute(sql, params).fetchall()

    items = []
    for row in rows:
        item = dict(row)
        item["tags"] = loads(item.get("tags"), default=[])
        item["metadata_json"] = loads(item.get("metadata_json"), default={})
        items.append(item)

    return jsonify({"ok": True, "items": items})


@bp_robotics.route("/api/robot/generate", methods=["POST"])
def robotics_generate():
    data = request.get_json(silent=True) or {}
    prompt = (data.get("prompt") or "").strip()

    if not prompt:
        return jsonify({"ok": False, "error": "Prompt obrigatório"}), 400

    try:
        result = generate_robot_build(prompt)
        return jsonify({"ok": True, "result": result})
    except Exception as e:
        return jsonify({"ok": False, "error": str(e)}), 500


@bp_robotics.route("/api/builds")
def robotics_builds():
    with get_conn() as conn:
        rows = conn.execute("""
            SELECT id, title, prompt, created_at
            FROM robotics_builds
            ORDER BY id DESC
            LIMIT 50
        """).fetchall()

    return jsonify({"ok": True, "items": [dict(r) for r in rows]})
import json
from flask import Response


def json_response(payload: dict, status: int = 200) -> Response:
    return Response(
        json.dumps(payload, ensure_ascii=False),
        status=status,
        mimetype="application/json",
    )
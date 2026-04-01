import os
from openai import OpenAI
from robotics.services.db import get_conn
from robotics.services.utils import dumps, loads, is_3d_file

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "").strip()
MODEL_NAME = os.getenv("MODEL_NAME", "gpt-4.1-mini")

client = OpenAI(api_key=OPENAI_API_KEY) if OPENAI_API_KEY else None

SYSTEM_PROMPT = """
Você é um engenheiro de robótica da Nexus.
Receba um pedido em linguagem natural.
Responda em JSON válido com estas chaves:
title, requirements, ideal_categories, build_steps, estimated_cost, generated_code

Regras:
- requirements deve ser lista de strings
- ideal_categories deve ser lista de categorias entre:
  servo_motor, stepper_motor, dc_motor, imu_sensor, ultrasonic_sensor, camera,
  microcontroller, battery, driver, bearing, gear, joint, frame, connector, robot_model
- build_steps deve ser lista de strings
- estimated_cost deve ser objeto com low_brl, medium_brl, high_brl
- generated_code deve ser uma string com código Python inicial
"""


def search_parts_for_categories(categories: list[str], limit_per_category: int = 10):
    selected = []
    with get_conn() as conn:
        for cat in categories:
            rows = conn.execute("""
                SELECT id, source, name, category, extension, tags, source_path
                FROM robotics_parts
                WHERE category = ?
                ORDER BY CASE
                    WHEN extension IN ('.step', '.stp', '.wrl', '.wrz', '.stl', '.dae', '.obj') THEN 0
                    ELSE 1
                END, id DESC
                LIMIT ?
            """, (cat, limit_per_category)).fetchall()

            for row in rows:
                item = dict(row)
                item["tags"] = loads(item.get("tags"), default=[])
                item["has_3d"] = is_3d_file(item.get("extension", ""))
                selected.append(item)
    return selected


def generate_robot_build(prompt: str) -> dict:
    if not client:
        raise RuntimeError("OPENAI_API_KEY não configurada no .env")

    response = client.chat.completions.create(
        model=MODEL_NAME,
        temperature=0.4,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": prompt},
        ],
        response_format={"type": "json_object"},
    )

    raw = response.choices[0].message.content
    data = loads(raw, default={})

    categories = data.get("ideal_categories", [])
    selected_parts = search_parts_for_categories(categories)

    result = {
        "title": data.get("title", "Projeto de Robô"),
        "requirements": data.get("requirements", []),
        "ideal_categories": categories,
        "selected_parts": selected_parts,
        "build_steps": data.get("build_steps", []),
        "estimated_cost": data.get("estimated_cost", {}),
        "generated_code": data.get("generated_code", ""),
    }

    with get_conn() as conn:
        cur = conn.execute("""
            INSERT INTO robotics_builds (
                prompt, title, requirements_json, selected_parts_json,
                build_steps_json, estimated_cost_json, generated_code
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (
            prompt,
            result["title"],
            dumps(result["requirements"]),
            dumps(result["selected_parts"]),
            dumps(result["build_steps"]),
            dumps(result["estimated_cost"]),
            result["generated_code"],
        ))
        result["build_id"] = cur.lastrowid

    return result
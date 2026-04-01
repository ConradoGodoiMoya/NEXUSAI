import os
from flask import Blueprint, render_template, current_app

bp_robotics = Blueprint("robotics", __name__, url_prefix="/robotics")

NATIVE_CATALOG = [
    {"id": "microbit", "name": "Micro:bit", "file": "microbit.glb", "type": "native_or_glb"},
    {"id": "servo_motor", "name": "Servo Motor", "file": "servo_motor.glb", "type": "native_or_glb"},
    {"id": "ultrasonic_sensor", "name": "Sensor Ultrassônico", "file": "ultrasonic_sensor.glb", "type": "native_or_glb"},
    {"id": "wheel", "name": "Roda", "file": "wheel.glb", "type": "native_or_glb"},
    {"id": "chassis", "name": "Chassi", "file": "chassis.glb", "type": "native_or_glb"},
    {"id": "battery_pack", "name": "Bateria", "file": "battery_pack.glb", "type": "native_or_glb"},
    {"id": "motor_driver", "name": "Ponte H", "file": "motor_driver.glb", "type": "native_or_glb"},
    {"id": "breadboard", "name": "Protoboard", "file": "breadboard.glb", "type": "native_or_glb"},
    {"id": "led", "name": "LED", "file": "led.glb", "type": "native_or_glb"},
    {"id": "buzzer", "name": "Buzzer", "file": "buzzer.glb", "type": "native_or_glb"},
]


def ensure_robotics_models_dir():
    models_dir = os.path.join(current_app.root_path, "static", "models", "robotics")
    os.makedirs(models_dir, exist_ok=True)
    return models_dir


def build_robotics_catalog():
    models_dir = ensure_robotics_models_dir()
    catalog = []

    for item in NATIVE_CATALOG:
        file_path = os.path.join(models_dir, item["file"])
        has_glb = os.path.exists(file_path)

        catalog.append({
            "id": item["id"],
            "name": item["name"],
            "file": item["file"],
            "type": item["type"],
            "has_glb": has_glb,
            "url": f"/static/models/robotics/{item['file']}" if has_glb else None,
        })

    return catalog


@bp_robotics.route("/")
def robotics_home():
    robotics_catalog = build_robotics_catalog()
    return render_template("robotics.html", robotics_catalog=robotics_catalog)
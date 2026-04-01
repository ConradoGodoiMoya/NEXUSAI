import json
import os
import re


THREE_D_EXTENSIONS = {".step", ".stp", ".wrl", ".wrz", ".stl", ".dae", ".obj"}


def dumps(data) -> str:
    return json.dumps(data, ensure_ascii=False)


def loads(text: str, default=None):
    if not text:
        return default if default is not None else {}
    try:
        return json.loads(text)
    except Exception:
        return default if default is not None else {}


def safe_name_from_path(path: str) -> str:
    base = os.path.basename(path)
    return os.path.splitext(base)[0].replace("_", " ").replace("-", " ").strip()


def infer_category(name: str) -> str:
    text = name.lower()

    rules = {
        "servo_motor": ["servo", "mg90", "mg996", "sg90"],
        "stepper_motor": ["stepper", "nema"],
        "dc_motor": ["dc motor", "gear motor", "tt motor"],
        "imu_sensor": ["imu", "mpu6050", "gyro", "accelerometer"],
        "ultrasonic_sensor": ["ultrasonic", "hc-sr04"],
        "camera": ["camera", "ov", "raspberry pi camera"],
        "microcontroller": ["esp32", "esp8266", "arduino", "stm32", "raspberry pi pico", "teensy", "microcontroller"],
        "battery": ["battery", "lipo", "18650", "bms"],
        "driver": ["driver", "drv", "a4988", "tb6612", "l298n"],
        "bearing": ["bearing", "608zz", "lm8uu"],
        "gear": ["gear", "pinion"],
        "joint": ["joint", "hinge"],
        "frame": ["frame", "chassis", "bracket", "mount", "support"],
        "connector": ["connector", "header", "usb", "xt60", "jst", "terminal"],
        "robot_model": ["urdf", "xacro", "robot", "arm", "manipulator"],
    }

    for category, keywords in rules.items():
        if any(k in text for k in keywords):
            return category

    return "unknown"


def split_tags(name: str):
    cleaned = re.sub(r"[^a-zA-Z0-9_\- ]", " ", name.lower())
    parts = [p for p in cleaned.replace("-", " ").replace("_", " ").split() if len(p) > 1]
    return sorted(set(parts))


def is_3d_file(ext: str) -> bool:
    return (ext or "").lower() in THREE_D_EXTENSIONS
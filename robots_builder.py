from flask import Blueprint, render_template, request

bp_robots = Blueprint("robots", __name__)

TECH_STACK = [
"Visão Computacional",
"Deep Learning",
"ROS2",
"Arduino",
"ESP32",
"Raspberry Pi",
"SLAM",
"GPS",
"Sensores LiDAR",
"Braços Robóticos",
"Drones",
"Controle por Voz",
"IA Generativa",
"5G IoT",
"Impressão 3D"
]

@bp_robots.route("/robots")
def robots():

    return render_template(
        "robots.html",
        tech=TECH_STACK
    )
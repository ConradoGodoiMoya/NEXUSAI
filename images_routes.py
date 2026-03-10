import os
import re
import base64
import uuid
from flask import Blueprint, render_template, request, redirect, session, url_for, flash
from openai import OpenAI

bp_images = Blueprint("images", __name__)
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

def is_logged():
    return bool(session.get("user")) and bool(session.get("access_token"))

def require_login():
    if not is_logged():
        return redirect(url_for("login_page"))
    return None

def looks_like_human_request(prompt: str) -> bool:
    p = (prompt or "").lower()
    keys = [
        "foto", "retrato", "humanizado", "realista", "pessoa",
        "rosto", "selfie", "modelo", "humano", "humanizada"
    ]
    return any(k in p for k in keys)

def improve_prompt(prompt: str) -> str:
    p = (prompt or "").strip()

    p = re.sub(r"\bstich\b", "stitch", p, flags=re.IGNORECASE)

    if looks_like_human_request(p):
        p += (
            ". retrato mais natural, rosto bem proporcional, pele realista, "
            "olhos naturais, iluminação suave, textura de pele sutil, "
            "expressão humana convincente, aparência fotográfica, alta qualidade"
        )
    else:
        p += (
            ". composição clara, boa iluminação, detalhes bem definidos, "
            "cores equilibradas, resultado bonito, fiel ao pedido, alta qualidade"
        )

    return p

def fallback_prompt(original_prompt: str) -> str:
    p = (original_prompt or "").strip().lower()

    if "stitch" in p:
        return (
            "um pequeno alien azul com orelhas grandes, expressão carismática, "
            "visual fofo, estilo 3d detalhado, iluminação suave, fundo tropical, alta qualidade"
        )

    if looks_like_human_request(original_prompt):
        return (
            f"{original_prompt}. retrato fotográfico, rosto natural, aparência humana realista, "
            "luz suave, pele bem renderizada, olhos naturais, alta definição"
        )

    return (
        f"{original_prompt}. cena bem definida, visual bonito, iluminação equilibrada, "
        "composição forte, alta qualidade"
    )

@bp_images.get("/images")
def images_home():
    r = require_login()
    if r:
        return r
    return render_template("images.html", image_url=None, last_prompt="")

@bp_images.post("/images/generate")
def images_generate():
    r = require_login()
    if r:
        return r

    prompt = (request.form.get("prompt") or "").strip()
    if len(prompt) < 5:
        flash("Descreva melhor a imagem (mín. 5 caracteres).", "error")
        return redirect(url_for("images.images_home"))

    size = (request.form.get("size") or "1024x1024").strip()
    if size not in {"512x512", "1024x1024"}:
        size = "1024x1024"

    improved = improve_prompt(prompt)

    try:
        img = client.images.generate(
            model="gpt-image-1",
            prompt=improved,
            size=size,
        )
        img_b64 = img.data[0].b64_json
        if not img_b64:
            raise ValueError("A resposta da imagem veio vazia.")
    except Exception:
        try:
            img = client.images.generate(
                model="gpt-image-1",
                prompt=fallback_prompt(prompt),
                size=size,
            )
            img_b64 = img.data[0].b64_json
            if not img_b64:
                flash("Não consegui gerar a imagem. Tente descrever de outro jeito.", "error")
                return render_template("images.html", image_url=None, last_prompt=prompt)
        except Exception as e:
            flash(f"Erro ao gerar imagem: {e}", "error")
            return render_template("images.html", image_url=None, last_prompt=prompt)

    out_dir = os.path.join(os.path.dirname(__file__), "static", "generated")
    os.makedirs(out_dir, exist_ok=True)

    fname = f"{uuid.uuid4().hex}.png"
    fpath = os.path.join(out_dir, fname)

    with open(fpath, "wb") as f:
        f.write(base64.b64decode(img_b64))

    image_url = f"/static/generated/{fname}"
    flash("Imagem criada!", "ok")
    return render_template("images.html", image_url=image_url, last_prompt=prompt)
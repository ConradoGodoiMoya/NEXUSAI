import re
import json
from flask import Blueprint, render_template, request, redirect, session, url_for, flash
from supa import supa_user

bp_saas = Blueprint("saas", __name__)

def is_logged():
    return bool(session.get("user")) and bool(session.get("access_token"))

def require_login():
    if not is_logged():
        return redirect(url_for("login_page"))
    return None

def uid():
    return (session.get("user") or {}).get("id")

def slugify(text: str) -> str:
    text = (text or "").strip().lower()
    text = re.sub(r"[^a-z0-9]+", "-", text)
    text = re.sub(r"-+", "-", text).strip("-")
    return text or "projeto"

def parse_project_content(content: str):
    try:
        return json.loads(content or "{}")
    except Exception:
        return {}

def ensure_project_preview(project, project_data):
    html = (project_data.get("preview_html") or "").strip()
    css = (project_data.get("preview_css") or "").strip()
    js = (project_data.get("preview_js") or "").strip()

    if html:
        return {
            "preview_html": html,
            "preview_css": css,
            "preview_js": js,
        }

    fallback_html = f"""
<div class="site-shell">
  <header class="topbar">
    <div class="logo">{project.get("name","Projeto")}</div>
    <nav class="nav">
      <a>Recursos</a>
      <a>Planos</a>
      <a>Login</a>
      <button class="cta">Criar conta</button>
    </nav>
  </header>

  <section class="hero">
    <div class="hero-left">
      <span class="pill">SaaS premium</span>
      <h1>{project.get("name","Projeto")}</h1>
      <p>{project.get("description") or "Projeto criado pela Nexus AI com visual premium, foco em conversão e produto real."}</p>
      <div class="hero-actions">
        <button class="primary-btn">Começar grátis</button>
        <button class="ghost-btn">Ver demo</button>
      </div>
    </div>

    <div class="hero-right">
      <div class="dash-card"><h3>Status</h3><strong>{project.get("status","draft")}</strong></div>
      <div class="dash-card"><h3>Visual</h3><strong>{project.get("visual_style") or "premium"}</strong></div>
    </div>
  </section>
</div>
""".strip()

    fallback_css = """
:root{
  --bg:#070b17;
  --line:rgba(255,255,255,.08);
  --text:#eef2ff;
  --muted:#aeb8de;
  --blue:#5aa7ff;
  --purple:#8d63ff;
}
*{box-sizing:border-box}
body{
  margin:0;
  font-family:Inter,system-ui,Arial,sans-serif;
  color:var(--text);
  background:
    radial-gradient(700px 400px at 15% 10%, rgba(90,167,255,.18), transparent 60%),
    radial-gradient(700px 400px at 85% 15%, rgba(141,99,255,.16), transparent 60%),
    var(--bg);
}
.site-shell{min-height:100vh;padding:26px}
.topbar{
  display:flex;justify-content:space-between;align-items:center;gap:16px;
  padding:16px 18px;border:1px solid var(--line);border-radius:20px;background:rgba(255,255,255,.03)
}
.logo{font-size:24px;font-weight:900}
.nav{display:flex;align-items:center;gap:14px;flex-wrap:wrap}
.nav a{color:var(--muted)}
.cta,.primary-btn,.ghost-btn{
  border:0;border-radius:14px;padding:12px 18px;font:inherit;font-weight:800;cursor:pointer
}
.cta,.primary-btn{color:white;background:linear-gradient(135deg, var(--blue), var(--purple))}
.ghost-btn{color:var(--text);background:rgba(255,255,255,.05);border:1px solid var(--line)}
.hero{display:grid;grid-template-columns:1.05fr .95fr;gap:20px;margin-top:20px}
.hero-left,.hero-right{
  border:1px solid var(--line);border-radius:26px;background:linear-gradient(180deg, rgba(255,255,255,.05), rgba(255,255,255,.03));padding:28px
}
.pill{
  display:inline-flex;padding:8px 12px;border-radius:999px;background:rgba(255,255,255,.05);
  border:1px solid var(--line);color:var(--muted);font-size:13px;font-weight:700
}
.hero-left h1{margin:16px 0 10px;font-size:52px;line-height:1.04}
.hero-left p{margin:0;color:var(--muted);line-height:1.65}
.hero-actions{margin-top:18px;display:flex;gap:12px;flex-wrap:wrap}
.dash-card{
  border:1px solid var(--line);border-radius:20px;background:rgba(255,255,255,.04);padding:20px;margin-bottom:14px
}
.dash-card h3{margin:0 0 8px;color:var(--muted);font-size:15px}
.dash-card strong{font-size:32px}
@media (max-width: 980px){
  .hero{grid-template-columns:1fr}
}
""".strip()

    return {
        "preview_html": fallback_html,
        "preview_css": fallback_css,
        "preview_js": "",
    }

@bp_saas.get("/saas")
def saas_projects():
    r = require_login()
    if r:
        return r

    sb = supa_user(session["access_token"])
    projects = (
        sb.table("saas_projects")
        .select("*")
        .eq("user_id", uid())
        .order("created_at", desc=True)
        .execute()
        .data
    ) or []

    return render_template("saas_projects.html", projects=projects)

@bp_saas.post("/saas/create")
def saas_create():
    r = require_login()
    if r:
        return r

    name = (request.form.get("name") or "").strip()
    description = (request.form.get("description") or "").strip()
    visual_style = (request.form.get("visual_style") or "").strip()
    content = (request.form.get("content") or "").strip()

    if not name:
        flash("Coloque um nome para o projeto SaaS.", "error")
        return redirect(url_for("saas.saas_projects"))

    slug = slugify(name)
    sb = supa_user(session["access_token"])

    try:
        exists = (
            sb.table("saas_projects")
            .select("id")
            .eq("slug", slug)
            .limit(1)
            .execute()
            .data
        ) or []
        if exists:
            slug = f"{slug}-{uid()[:6]}"
    except Exception:
        slug = f"{slug}-{uid()[:6]}"

    try:
        sb.table("saas_projects").insert({
            "user_id": uid(),
            "name": name,
            "slug": slug,
            "description": description,
            "visual_style": visual_style,
            "content": content or "{}",
            "status": "draft",
            "published_url": None,
        }).execute()
        flash("Projeto SaaS criado!", "ok")
    except Exception:
        flash("Falhou ao criar o projeto SaaS.", "error")

    return redirect(url_for("saas.saas_projects"))

@bp_saas.get("/saas/<int:project_id>/preview")
def saas_preview(project_id: int):
    r = require_login()
    if r:
        return r

    sb = supa_user(session["access_token"])
    rows = (
        sb.table("saas_projects")
        .select("*")
        .eq("id", project_id)
        .eq("user_id", uid())
        .limit(1)
        .execute()
        .data
    ) or []

    if not rows:
        flash("Projeto não encontrado.", "error")
        return redirect(url_for("saas.saas_projects"))

    project = rows[0]
    project_data = parse_project_content(project.get("content"))
    preview_data = ensure_project_preview(project, project_data)

    project_data["preview_html"] = preview_data["preview_html"]
    project_data["preview_css"] = preview_data["preview_css"]
    project_data["preview_js"] = preview_data["preview_js"]

    return render_template("saas_preview.html", project=project, project_data=project_data)

@bp_saas.post("/saas/<int:project_id>/save")
def saas_save(project_id: int):
    r = require_login()
    if r:
        return r

    preview_html = (request.form.get("preview_html") or "").strip()
    preview_css = (request.form.get("preview_css") or "").strip()
    preview_js = (request.form.get("preview_js") or "").strip()

    sb = supa_user(session["access_token"])
    rows = (
        sb.table("saas_projects")
        .select("*")
        .eq("id", project_id)
        .eq("user_id", uid())
        .limit(1)
        .execute()
        .data
    ) or []

    if not rows:
        flash("Projeto não encontrado.", "error")
        return redirect(url_for("saas.saas_projects"))

    project = rows[0]
    project_data = parse_project_content(project.get("content"))
    project_data["preview_html"] = preview_html
    project_data["preview_css"] = preview_css
    project_data["preview_js"] = preview_js

    try:
        sb.table("saas_projects").update({
            "content": json.dumps(project_data, ensure_ascii=False, indent=2)
        }).eq("id", project_id).eq("user_id", uid()).execute()

        flash("Código do projeto salvo!", "ok")
    except Exception:
        flash("Falhou ao salvar o código.", "error")

    return redirect(url_for("saas.saas_preview", project_id=project_id))

@bp_saas.post("/saas/<int:project_id>/publish")
def saas_publish(project_id: int):
    r = require_login()
    if r:
        return r

    sb = supa_user(session["access_token"])
    rows = (
        sb.table("saas_projects")
        .select("*")
        .eq("id", project_id)
        .eq("user_id", uid())
        .limit(1)
        .execute()
        .data
    ) or []

    if not rows:
        flash("Projeto não encontrado.", "error")
        return redirect(url_for("saas.saas_projects"))

    project = rows[0]
    slug = project.get("slug") or f"projeto-{project_id}"
    published_url = f"https://{slug}.nexusai.com"

    try:
        sb.table("saas_projects").update({
            "status": "published",
            "published_url": published_url,
        }).eq("id", project_id).eq("user_id", uid()).execute()

        flash("Projeto publicado com sucesso!", "ok")
    except Exception:
        flash("Falhou ao publicar o projeto.", "error")

    return redirect(url_for("saas.saas_projects"))
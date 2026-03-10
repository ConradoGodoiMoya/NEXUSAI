import os
import json
import re
from flask import Blueprint, render_template, request, redirect, session, url_for, flash
from openai import OpenAI
from supa import supa_user
from human_mode import HUMAN_STYLE_PROMPT

bp_builder = Blueprint("builder", __name__)
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

ALLOWED_TONES = {
    "amigavel", "formal", "direto", "professor", "motivacional", "tecnico", "vendedor", "criativo"
}
ALLOWED_BUILD_TYPES = {"ai", "saas"}


def is_logged():
    return bool(session.get("user")) and bool(session.get("access_token"))


def require_login():
    if not is_logged():
        return redirect(url_for("login_page"))
    return None


def uid():
    return (session.get("user") or {}).get("id")


def clamp(s: str, max_len: int) -> str:
    s = (s or "").strip()
    return s[:max_len]


def safe_tone(t: str) -> str:
    t = (t or "amigavel").strip().lower()
    return t if t in ALLOWED_TONES else "amigavel"


def safe_build_type(v: str) -> str:
    v = (v or "ai").strip().lower()
    return v if v in ALLOWED_BUILD_TYPES else "ai"


def slugify(text: str) -> str:
    text = (text or "").strip().lower()
    text = re.sub(r"[^a-z0-9]+", "-", text)
    text = re.sub(r"-+", "-", text).strip("-")
    return text or "projeto"


def safe_payload(payload: dict) -> dict:
    return {
        "name": clamp(payload.get("name", "Nova IA"), 80) or "Nova IA",
        "tagline": clamp(payload.get("tagline", ""), 120),
        "tone": safe_tone(payload.get("tone", "amigavel")),
        "description": clamp(payload.get("description", ""), 2000) or "Sem descrição.",
        "first_message": clamp(
            payload.get("first_message", ""),
            300
        ) or "Olá! Me diga o que você quer criar e eu monto a estrutura.",
        "system_prompt": clamp(payload.get("system_prompt", ""), 8000),
        "preview_html": (payload.get("preview_html", "") or "").strip(),
        "preview_css": (payload.get("preview_css", "") or "").strip(),
        "preview_js": (payload.get("preview_js", "") or "").strip(),
        "result_json": payload,
    }


def default_ai_preview(name: str, tagline: str, description: str) -> tuple[str, str, str]:
    html = f"""
<div class="app-shell">
  <aside class="sidebar">
    <div class="brand">{name}</div>
    <nav class="menu">
      <a class="menu-item active">Início</a>
      <a class="menu-item">Ferramentas</a>
      <a class="menu-item">Histórico</a>
      <a class="menu-item">Configurações</a>
    </nav>
  </aside>

  <main class="content">
    <section class="hero-card">
      <span class="pill">IA personalizada</span>
      <h1>{name}</h1>
      <p>{tagline or description or "Uma IA criada para entregar resultado com clareza e velocidade."}</p>
      <div class="hero-actions">
        <button class="primary-btn">Começar agora</button>
        <button class="ghost-btn">Ver exemplos</button>
      </div>
    </section>

    <section class="grid">
      <div class="card">
        <h3>Respostas rápidas</h3>
        <p>Estrutura organizada para ajudar o usuário desde o primeiro pedido.</p>
      </div>
      <div class="card">
        <h3>Fluxo prático</h3>
        <p>Interface simples, visual forte e espaço para ações principais.</p>
      </div>
      <div class="card">
        <h3>Histórico</h3>
        <p>Área pensada para continuar conversas, tarefas e ideias.</p>
      </div>
      <div class="card">
        <h3>Personalização</h3>
        <p>Visual pronto para evoluir com o nicho e o objetivo do projeto.</p>
      </div>
    </section>
  </main>
</div>
""".strip()

    css = """
:root{
  --bg:#070b17;
  --panel:#0f172a;
  --panel2:#121d36;
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
  background:
    radial-gradient(700px 400px at 15% 10%, rgba(90,167,255,.18), transparent 60%),
    radial-gradient(700px 400px at 85% 15%, rgba(141,99,255,.16), transparent 60%),
    var(--bg);
  color:var(--text);
}
.app-shell{
  min-height:100vh;
  display:grid;
  grid-template-columns:250px 1fr;
}
.sidebar{
  border-right:1px solid var(--line);
  background:rgba(255,255,255,.03);
  padding:24px;
}
.brand{
  font-size:22px;
  font-weight:800;
  margin-bottom:24px;
}
.menu{
  display:grid;
  gap:10px;
}
.menu-item{
  padding:12px 14px;
  border-radius:14px;
  color:var(--muted);
  background:rgba(255,255,255,.02);
  border:1px solid transparent;
}
.menu-item.active{
  color:var(--text);
  border-color:rgba(90,167,255,.20);
  background:linear-gradient(135deg, rgba(90,167,255,.12), rgba(141,99,255,.10));
}
.content{
  padding:28px;
}
.hero-card{
  border:1px solid var(--line);
  background:linear-gradient(180deg, rgba(255,255,255,.05), rgba(255,255,255,.03));
  border-radius:24px;
  padding:28px;
  box-shadow:0 20px 60px rgba(0,0,0,.28);
}
.pill{
  display:inline-flex;
  padding:8px 12px;
  border-radius:999px;
  background:rgba(255,255,255,.05);
  border:1px solid var(--line);
  color:var(--muted);
  font-size:13px;
  font-weight:700;
}
.hero-card h1{
  margin:14px 0 10px;
  font-size:42px;
}
.hero-card p{
  margin:0;
  color:var(--muted);
  line-height:1.6;
  max-width:720px;
}
.hero-actions{
  margin-top:18px;
  display:flex;
  gap:12px;
  flex-wrap:wrap;
}
.primary-btn,.ghost-btn{
  border:0;
  border-radius:14px;
  padding:12px 18px;
  font:inherit;
  font-weight:800;
  cursor:pointer;
}
.primary-btn{
  color:white;
  background:linear-gradient(135deg, var(--blue), var(--purple));
}
.ghost-btn{
  color:var(--text);
  background:rgba(255,255,255,.05);
  border:1px solid var(--line);
}
.grid{
  display:grid;
  grid-template-columns:repeat(2, 1fr);
  gap:16px;
  margin-top:18px;
}
.card{
  border:1px solid var(--line);
  background:rgba(255,255,255,.04);
  border-radius:20px;
  padding:20px;
}
.card h3{
  margin:0 0 8px;
}
.card p{
  margin:0;
  color:var(--muted);
  line-height:1.55;
}
@media (max-width: 900px){
  .app-shell{grid-template-columns:1fr}
  .sidebar{display:none}
  .grid{grid-template-columns:1fr}
  .content{padding:18px}
  .hero-card h1{font-size:32px}
}
""".strip()

    js = """
console.log("Preview da IA carregado.");
""".strip()
    return html, css, js


def default_saas_preview(name: str, tagline: str, description: str) -> tuple[str, str, str]:
    html = f"""
<div class="site-shell">
  <header class="topbar">
    <div class="logo">{name}</div>
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
      <h1>{name}</h1>
      <p>{tagline or description or "Uma plataforma moderna criada para resolver um problema real com visual forte e produto profissional."}</p>

      <div class="hero-actions">
        <button class="primary-btn">Começar grátis</button>
        <button class="ghost-btn">Ver demo</button>
      </div>

      <div class="stats">
        <div class="stat"><strong>+12k</strong><span>usuários</span></div>
        <div class="stat"><strong>98%</strong><span>satisfação</span></div>
        <div class="stat"><strong>24/7</strong><span>disponível</span></div>
      </div>
    </div>

    <div class="hero-right">
      <div class="dashboard">
        <div class="dash-top">
          <span class="dash-pill">Dashboard</span>
          <span class="dash-pill alt">Ao vivo</span>
        </div>
        <div class="dash-grid">
          <div class="dash-card"><h3>Conversões</h3><strong>14.280</strong></div>
          <div class="dash-card"><h3>Receita</h3><strong>R$ 28.900</strong></div>
          <div class="dash-card wide"><h3>Crescimento</h3><div class="chart"></div></div>
        </div>
      </div>
    </div>
  </section>
</div>
""".strip()

    css = """
:root{
  --bg:#060916;
  --panel:#0b1224;
  --panel2:#111b33;
  --line:rgba(255,255,255,.08);
  --text:#f1f4ff;
  --muted:#aeb7da;
  --blue:#5aa7ff;
  --purple:#8e63ff;
}
*{box-sizing:border-box}
body{
  margin:0;
  font-family:Inter,system-ui,Arial,sans-serif;
  color:var(--text);
  background:
    radial-gradient(900px 520px at 14% 10%, rgba(90,167,255,.18), transparent 60%),
    radial-gradient(900px 520px at 86% 15%, rgba(142,99,255,.18), transparent 60%),
    var(--bg);
}
.site-shell{
  min-height:100vh;
  padding:26px;
}
.topbar{
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:16px;
  padding:16px 18px;
  border:1px solid var(--line);
  border-radius:20px;
  background:rgba(255,255,255,.03);
}
.logo{
  font-size:24px;
  font-weight:900;
}
.nav{
  display:flex;
  align-items:center;
  gap:14px;
  flex-wrap:wrap;
}
.nav a{
  color:var(--muted);
}
.cta,.primary-btn,.ghost-btn{
  border:0;
  border-radius:14px;
  padding:12px 18px;
  font:inherit;
  font-weight:800;
  cursor:pointer;
}
.cta,.primary-btn{
  color:white;
  background:linear-gradient(135deg, var(--blue), var(--purple));
}
.ghost-btn{
  color:var(--text);
  background:rgba(255,255,255,.05);
  border:1px solid var(--line);
}
.hero{
  display:grid;
  grid-template-columns:1.05fr .95fr;
  gap:20px;
  margin-top:20px;
  align-items:center;
}
.hero-left,.hero-right{
  border:1px solid var(--line);
  border-radius:26px;
  background:linear-gradient(180deg, rgba(255,255,255,.05), rgba(255,255,255,.03));
  padding:28px;
}
.pill,.dash-pill{
  display:inline-flex;
  padding:8px 12px;
  border-radius:999px;
  background:rgba(255,255,255,.05);
  border:1px solid var(--line);
  color:var(--muted);
  font-size:13px;
  font-weight:700;
}
.hero-left h1{
  margin:16px 0 10px;
  font-size:52px;
  line-height:1.04;
}
.hero-left p{
  margin:0;
  color:var(--muted);
  line-height:1.65;
  max-width:700px;
}
.hero-actions{
  margin-top:18px;
  display:flex;
  gap:12px;
  flex-wrap:wrap;
}
.stats{
  display:grid;
  grid-template-columns:repeat(3,1fr);
  gap:12px;
  margin-top:22px;
}
.stat{
  border:1px solid var(--line);
  background:rgba(255,255,255,.04);
  border-radius:18px;
  padding:16px;
}
.stat strong{
  display:block;
  font-size:24px;
}
.stat span{
  color:var(--muted);
}
.dashboard{
  min-height:420px;
}
.dash-top{
  display:flex;
  gap:10px;
  margin-bottom:16px;
}
.dash-pill.alt{
  color:#fff;
}
.dash-grid{
  display:grid;
  grid-template-columns:1fr 1fr;
  gap:14px;
}
.dash-card{
  border:1px solid var(--line);
  border-radius:20px;
  background:rgba(255,255,255,.04);
  padding:20px;
}
.dash-card h3{
  margin:0 0 8px;
  color:var(--muted);
  font-size:15px;
}
.dash-card strong{
  font-size:32px;
}
.dash-card.wide{
  grid-column:span 2;
}
.chart{
  height:140px;
  border-radius:14px;
  background:
    linear-gradient(180deg, rgba(90,167,255,.20), rgba(142,99,255,.14)),
    rgba(255,255,255,.03);
  margin-top:10px;
  position:relative;
  overflow:hidden;
}
.chart::after{
  content:"";
  position:absolute;
  left:6%;
  right:6%;
  bottom:18%;
  height:3px;
  background:linear-gradient(90deg, var(--blue), var(--purple));
  transform:skewX(-25deg);
  box-shadow:0 0 20px rgba(142,99,255,.45);
}
@media (max-width: 980px){
  .hero{grid-template-columns:1fr}
}
@media (max-width: 700px){
  .site-shell{padding:16px}
  .topbar{flex-direction:column;align-items:stretch}
  .nav{justify-content:flex-start}
  .hero-left h1{font-size:38px}
  .stats{grid-template-columns:1fr}
  .dash-grid{grid-template-columns:1fr}
  .dash-card.wide{grid-column:span 1}
}
""".strip()

    js = """
console.log("Preview do SaaS carregado.");
""".strip()
    return html, css, js


def ensure_preview_fields(agent: dict, build_type: str) -> dict:
    html = (agent.get("preview_html") or "").strip()
    css = (agent.get("preview_css") or "").strip()
    js = (agent.get("preview_js") or "").strip()

    if html and css is not None:
        agent["preview_html"] = html
        agent["preview_css"] = css
        agent["preview_js"] = js
        return agent

    if build_type == "saas":
        d_html, d_css, d_js = default_saas_preview(
            agent.get("name", "Novo SaaS"),
            agent.get("tagline", ""),
            agent.get("description", "")
        )
    else:
        d_html, d_css, d_js = default_ai_preview(
            agent.get("name", "Nova IA"),
            agent.get("tagline", ""),
            agent.get("description", "")
        )

    agent["preview_html"] = html or d_html
    agent["preview_css"] = css or d_css
    agent["preview_js"] = js or d_js
    return agent


def build_ai_prompt(user_request: str, base_tone: str) -> str:
    return f"""
Você é um Arquiteto de Agentes que cria qualquer IA que o usuário pedir.

A IA criada pode ser:
- chat
- criador de imagens
- criador de roteiros
- assistente de vendas
- professor
- suporte
- análise
- qualquer outra função útil

Além do comportamento, você também deve gerar uma prévia visual da IA em forma de mini produto, para o usuário ver em tela separada e editar.

Saída:
- Responda SOMENTE com JSON válido.
- Sem markdown.
- Sem comentários.
- Sem texto fora do JSON.

Use exatamente este esquema:

{{
  "name": "Nome curto e forte",
  "tagline": "Frase curta do que faz",
  "tone": "amigavel|formal|direto|professor|motivacional|tecnico|vendedor|criativo",
  "description": "Descrição clara",
  "capabilities": ["Capacidade 1","Capacidade 2","Capacidade 3","Capacidade 4","Capacidade 5"],
  "guardrails": ["Limite 1","Limite 2","Limite 3"],
  "first_message": "Primeira mensagem da IA",
  "quick_actions": [
    {{"label": "Ação 1", "prompt": "Prompt curto 1"}},
    {{"label": "Ação 2", "prompt": "Prompt curto 2"}},
    {{"label": "Ação 3", "prompt": "Prompt curto 3"}}
  ],
  "system_prompt": "Prompt de sistema grande, detalhado e prático",
  "preview_html": "HTML completo da prévia visual da IA",
  "preview_css": "CSS completo da prévia visual da IA",
  "preview_js": "JS opcional da prévia visual da IA",
  "example_dialogs": [
    {{"user": "Exemplo de pergunta real", "assistant": "Exemplo de resposta real"}},
    {{"user": "Outro exemplo", "assistant": "Outra resposta"}}
  ]
}}

Regras:
- a IA pode ser qualquer coisa útil que o usuário pedir
- gere uma interface visual bonita para preview
- a preview deve parecer um mini produto real
- a preview deve ser separada do código
- o system prompt deve ser forte e detalhado
- adapte ao tom "{base_tone}"

Estilo de escrita obrigatório da IA:
"{HUMAN_STYLE_PROMPT}"

Contexto:
"{user_request}"

Agora gere o JSON completo.
""".strip()


def build_saas_prompt(user_request: str, base_tone: str, visual_style: str) -> str:
    return f"""
Você é um Arquiteto de SaaS premium.

Crie SaaS completos e incríveis.
Eles precisam ter:
- landing premium
- dashboard premium
- login e cadastro bonitos
- frontend completo
- backend completo
- banco
- autenticação
- painel admin
- APIs
- monetização
- visualização real em tela
- código separado para edição

O preview precisa funcionar em iframe como se fosse uma tela de computador.
O código precisa ficar separado da visualização.

Saída:
- SOMENTE JSON válido
- sem markdown
- sem texto fora do JSON

Use exatamente este esquema:

{{
  "name": "Nome curto e forte do SaaS",
  "tagline": "Frase curta",
  "tone": "amigavel|formal|direto|professor|motivacional|tecnico|vendedor|criativo",
  "description": "Descrição clara do SaaS",
  "capabilities": [
    "Planeja SaaS completo",
    "Cria landing premium",
    "Cria dashboard premium",
    "Define frontend e backend",
    "Cria banco e autenticação",
    "Sugere monetização",
    "Cria preview e publicação"
  ],
  "guardrails": [
    "Não ignorar backend, frontend ou banco",
    "Não entregar design fraco",
    "Não prometer deploy pronto sem explicar passos"
  ],
  "first_message": "Mensagem inicial pronta",
  "quick_actions": [
    {{"label": "Criar SaaS completo", "prompt": "Monte um SaaS completo com landing premium, dashboard bonito, frontend, backend, banco e autenticação"}},
    {{"label": "Gerar preview", "prompt": "Crie a estrutura da visualização real do projeto"}},
    {{"label": "Gerar publicação", "prompt": "Crie a lógica de publicação com subdomínio da Nexus AI"}}
  ],
  "system_prompt": "Prompt de sistema grande, detalhado e prático",
  "preview_html": "HTML completo do preview funcional do SaaS",
  "preview_css": "CSS completo do preview funcional do SaaS",
  "preview_js": "JS opcional do preview funcional do SaaS",
  "example_dialogs": [
    {{"user": "Quero um SaaS para gerar roteiros virais", "assistant": "Resposta com estrutura premium, preview, publicação, backend e banco"}},
    {{"user": "Crie um SaaS para agendamento de clínicas", "assistant": "Resposta com páginas, painel, preview e visual premium"}}
  ]
}}

Regras:
- o preview precisa parecer um produto real
- o preview precisa rodar em tela separada
- o código deve ser editável separadamente
- o visual precisa ser premium
- estilo visual pedido: "{visual_style}"
- adapte ao tom "{base_tone}"

Estilo de escrita obrigatório:
"{HUMAN_STYLE_PROMPT}"

Contexto:
"{user_request}"

Agora gere o JSON completo.
""".strip()


def get_latest_build_for_agent(sb, agent_id: int):
    rows = (
        sb.table("ai_agent_builds")
        .select("id,result_json,created_at")
        .eq("created_agent_id", agent_id)
        .eq("user_id", uid())
        .order("created_at", desc=True)
        .limit(1)
        .execute()
        .data
    ) or []
    return rows[0] if rows else None


@bp_builder.get("/builder")
def builder_home():
    r = require_login()
    if r:
        return r

    sb = supa_user(session["access_token"])
    builds = (
        sb.table("ai_agent_builds")
        .select("id,request_text,result_json,created_agent_id,created_at")
        .eq("user_id", uid())
        .order("created_at", desc=True)
        .limit(12)
        .execute()
        .data
    )
    return render_template("agent_builder.html", builds=builds)


@bp_builder.get("/builder/ai-preview/<int:agent_id>")
def ai_preview(agent_id: int):
    r = require_login()
    if r:
        return r

    sb = supa_user(session["access_token"])

    agent_rows = (
        sb.table("ai_agents")
        .select("*")
        .eq("id", agent_id)
        .eq("user_id", uid())
        .limit(1)
        .execute()
        .data
    ) or []

    if not agent_rows:
        flash("IA não encontrada.", "error")
        return redirect(url_for("agents.agents_list"))

    agent = agent_rows[0]
    build = get_latest_build_for_agent(sb, agent_id)
    result_json = (build or {}).get("result_json") or {}

    result_json = ensure_preview_fields({
        "name": agent.get("name", ""),
        "tagline": agent.get("tagline", ""),
        "description": agent.get("description", ""),
        "preview_html": result_json.get("preview_html", ""),
        "preview_css": result_json.get("preview_css", ""),
        "preview_js": result_json.get("preview_js", ""),
    }, "ai")

    return render_template(
        "ai_preview.html",
        agent=agent,
        result_json=result_json,
    )


@bp_builder.post("/builder/ai-preview/<int:agent_id>/save")
def ai_preview_save(agent_id: int):
    r = require_login()
    if r:
        return r

    preview_html = (request.form.get("preview_html") or "").strip()
    preview_css = (request.form.get("preview_css") or "").strip()
    preview_js = (request.form.get("preview_js") or "").strip()

    sb = supa_user(session["access_token"])
    build = get_latest_build_for_agent(sb, agent_id)

    if not build:
        flash("Preview da IA não encontrado.", "error")
        return redirect(url_for("builder.ai_preview", agent_id=agent_id))

    result_json = build.get("result_json") or {}
    result_json["preview_html"] = preview_html
    result_json["preview_css"] = preview_css
    result_json["preview_js"] = preview_js

    try:
        sb.table("ai_agent_builds").update({
            "result_json": result_json
        }).eq("id", build["id"]).eq("user_id", uid()).execute()

        flash("Código da preview da IA salvo!", "ok")
    except Exception:
        flash("Falhou ao salvar o código da preview.", "error")

    return redirect(url_for("builder.ai_preview", agent_id=agent_id))


@bp_builder.post("/builder/create")
def builder_create():
    r = require_login()
    if r:
        return r

    request_text = (request.form.get("request_text") or "").strip()
    base_tone = safe_tone(request.form.get("base_tone", "amigavel"))
    build_type = safe_build_type(request.form.get("build_type", "ai"))
    visual_style = (request.form.get("visual_style") or "").strip()

    if len(request_text) < 8:
        flash("Explique melhor o que você quer criar.", "error")
        return redirect(url_for("builder.builder_home"))

    sb = supa_user(session["access_token"])
    prompt = build_saas_prompt(request_text, base_tone, visual_style) if build_type == "saas" else build_ai_prompt(request_text, base_tone)

    try:
        resp = client.chat.completions.create(
            model="gpt-4.1-mini",
            messages=[
                {"role": "system", "content": "Você retorna apenas JSON válido, sem markdown."},
                {"role": "user", "content": prompt},
            ],
        )
        raw = (resp.choices[0].message.content or "").strip()
        agent_dict = json.loads(raw)
        agent = safe_payload(agent_dict)
        agent = ensure_preview_fields(agent, build_type)
    except Exception:
        flash("Falhou ao gerar. Tente de novo com um pedido mais claro.", "error")
        return redirect(url_for("builder.builder_home"))

    created_agent_id = None
    created_saas_id = None

    try:
        inserted = (
            sb.table("ai_agents")
            .insert({
                "user_id": uid(),
                "name": agent["name"],
                "tagline": agent["tagline"],
                "tone": agent["tone"],
                "description": agent["description"],
                "first_message": agent["first_message"],
                "system_prompt": agent["system_prompt"],
            })
            .execute()
            .data
        )
        if inserted and isinstance(inserted, list) and inserted[0].get("id"):
            created_agent_id = inserted[0]["id"]
    except Exception:
        created_agent_id = None

    if build_type == "saas":
        try:
            slug = slugify(agent["name"])
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

            payload_for_content = dict(agent["result_json"])
            payload_for_content["preview_html"] = agent["preview_html"]
            payload_for_content["preview_css"] = agent["preview_css"]
            payload_for_content["preview_js"] = agent["preview_js"]

            inserted_saas = (
                sb.table("saas_projects")
                .insert({
                    "user_id": uid(),
                    "agent_id": created_agent_id,
                    "name": agent["name"],
                    "slug": slug,
                    "description": agent["description"],
                    "visual_style": visual_style,
                    "content": json.dumps(payload_for_content, ensure_ascii=False, indent=2),
                    "status": "draft",
                    "published_url": None,
                })
                .execute()
                .data
            )

            if inserted_saas and isinstance(inserted_saas, list) and inserted_saas[0].get("id"):
                created_saas_id = inserted_saas[0]["id"]
        except Exception:
            created_saas_id = None

    try:
        log_payload = dict(agent["result_json"])
        log_payload["preview_html"] = agent["preview_html"]
        log_payload["preview_css"] = agent["preview_css"]
        log_payload["preview_js"] = agent["preview_js"]

        label = f"[{build_type.upper()}]"
        if visual_style:
            label += f" [{visual_style}]"

        sb.table("ai_agent_builds").insert({
            "user_id": uid(),
            "request_text": f"{label} {request_text}",
            "result_json": log_payload,
            "created_agent_id": created_agent_id,
        }).execute()
    except Exception:
        pass

    if build_type == "saas" and created_saas_id:
        flash("Projeto SaaS criado! Agora você pode visualizar, editar o código e publicar.", "ok")
        return redirect(url_for("saas.saas_preview", project_id=created_saas_id))

    if created_agent_id:
        flash("IA criada! Agora você pode visualizar, editar o código e ajustar o comportamento.", "ok")
        return redirect(url_for("builder.ai_preview", agent_id=created_agent_id))

    flash("Gerei o perfil, mas falhou ao salvar.", "error")
    return redirect(url_for("builder.builder_home"))
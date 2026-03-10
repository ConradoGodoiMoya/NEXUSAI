import os
from openai import OpenAI

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

DEFAULT_MODEL = os.getenv("OPENAI_TEXT_MODEL", "gpt-4.1-mini")

def llm_text(system: str, user: str, model: str = None) -> str:
    """
    Retorna texto do LLM.
    Tenta Responses API (novo). Se falhar, tenta Chat Completions (compat).
    """
    model = model or DEFAULT_MODEL

    # 1) Responses API
    try:
        resp = client.responses.create(
            model=model,
            input=[
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ],
        )
        # SDK recente: output_text
        txt = getattr(resp, "output_text", None)
        if txt:
            return txt.strip()

        # fallback: varrer resp.output
        out = []
        for item in getattr(resp, "output", []) or []:
            for c in getattr(item, "content", []) or []:
                if getattr(c, "type", None) in ("output_text", "text"):
                    out.append(getattr(c, "text", ""))
        return "\n".join([x for x in out if x]).strip() or ""
    except Exception:
        pass

    # 2) Chat Completions (SDKs/versões antigas)
    resp = client.chat.completions.create(
        model=model,
        messages=[
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
    )
    return (resp.choices[0].message.content or "").strip()
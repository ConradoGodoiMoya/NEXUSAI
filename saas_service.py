from services.openai_service import ask_openai


SAAS_SYSTEM = """
Você é um arquiteto full-stack. Gere estrutura de produto, páginas, stack,
fluxo de banco de dados, autenticação e roadmap de implementação.
""".strip()


def build_saas_project(prompt: str) -> str:
    if not prompt:
        return "Descreva o SaaS que você quer criar."
    return ask_openai(SAAS_SYSTEM, prompt)
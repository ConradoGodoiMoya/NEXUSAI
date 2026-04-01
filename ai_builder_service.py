from services.openai_service import ask_openai


AI_BUILDER_SYSTEM = """
Você projeta IAs digitais completas: chatbots, IAs de imagem, IAs de estudo,
IAs de vendas, IAs de atendimento e ferramentas específicas.
""".strip()


def build_ai_project(prompt: str) -> str:
    if not prompt:
        return "Descreva a IA que você quer criar."
    return ask_openai(AI_BUILDER_SYSTEM, prompt)
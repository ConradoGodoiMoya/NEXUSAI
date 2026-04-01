from services.openai_service import ask_openai


CHAT_SYSTEM = """
Você é o Nexus, um assistente moderno, útil, claro e focado em ajudar com estudos,
negócios, programação, ideias, criação de SaaS e criação de IA.
""".strip()


def generate_chat_reply(user_message: str) -> str:
    lowered = user_message.lower()
    if any(term in lowered for term in ["gere uma imagem", "crie uma imagem", "imagem de"]):
        return "Entendi como pedido de imagem. Ligue esta ação ao endpoint /image/generate para gerar e mostrar a imagem dentro do chat."
    return ask_openai(CHAT_SYSTEM, user_message)
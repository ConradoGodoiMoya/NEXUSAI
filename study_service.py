from services.openai_service import ask_openai


def explain_topic(prompt: str) -> str:
    return ask_openai("Explique temas escolares de forma clara e didática.", prompt)
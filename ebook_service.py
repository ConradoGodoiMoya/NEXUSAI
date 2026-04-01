from services.openai_service import ask_openai


def create_ebook_outline(prompt: str) -> str:
    system = "Crie estrutura de ebook com título, capítulos, subtítulos e objetivo de cada seção."
    return ask_openai(system, prompt)
from services.openai_service import ask_openai


def build_robotics_project(prompt: str) -> str:
    system = "Projete robôs com hardware, sensores, software, arquitetura e plano técnico."
    return ask_openai(system, prompt)
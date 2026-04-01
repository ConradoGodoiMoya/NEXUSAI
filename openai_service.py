from core.extensions import openai_client


def ask_openai(system_prompt: str, user_prompt: str) -> str:
    if openai_client is None:
        return "OpenAI não configurada ainda."

    response = openai_client.responses.create(
        model="gpt-4.1-mini",
        input=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
    )
    return response.output_text
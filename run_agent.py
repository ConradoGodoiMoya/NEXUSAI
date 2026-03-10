import os
from openai import OpenAI

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

def run_agent(system_prompt: str, user_text: str, image_url: str | None = None) -> str:
    user_content = [{"type": "input_text", "text": user_text}]
    if image_url:
        user_content.append({"type": "input_image", "image_url": image_url})

    resp = client.responses.create(
        model="gpt-4.1-mini",
        input=[
            {"role": "system", "content": [{"type": "input_text", "text": system_prompt}]},
            {"role": "user", "content": user_content},
        ],
    )
    return resp.output_text
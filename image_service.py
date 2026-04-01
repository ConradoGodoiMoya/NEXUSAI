
def generate_image_placeholder(prompt: str) -> dict:
    return {
        "prompt": prompt,
        "image_url": "https://placehold.co/1024x1024/png?text=Nexus+Image",
        "message": "Substitua este placeholder pela geração real de imagem depois.",
    }
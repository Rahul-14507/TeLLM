from openai import OpenAI
from config import settings

# Preference: Groq (high speed) -> Ollama (local)
if settings.groq_api_key:
    llm = OpenAI(
        base_url="https://api.groq.com/openai/v1",
        api_key=settings.groq_api_key,
    )
    current_model = settings.groq_model
else:
    llm = OpenAI(
        base_url=f"{settings.ollama_base_url}/v1",
        api_key="ollama",  # required by the library, value doesn't matter
    )
    current_model = settings.llm_model

def chat(messages: list, system: str = "", stream: bool = False, max_tokens: int = 400):
    all_messages = []
    if system:
        all_messages.append({"role": "system", "content": system})
    all_messages.extend(messages)

    return llm.chat.completions.create(
        model=current_model,
        messages=all_messages,
        stream=stream,
        max_tokens=max_tokens,
        temperature=0.3,  # lower = more consistent for tutoring
    )


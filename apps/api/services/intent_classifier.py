import anthropic
from config import settings

client = anthropic.Anthropic(api_key=settings.anthropic_api_key)

INTENT_PROMPT = """Classify this student message into exactly ONE label:
HOMEWORK   - solving a specific sum, problem, or calculation
CONCEPTUAL - asking what/why/how something works in general  
CLARIFY    - a follow-up question about something just discussed
OFFTOPIC   - unrelated to the subject

Student message: "{message}"
Current subject: "{subject}"
Last assistant message: "{last_turn}"

Rules:
- "solve this", "find the value of", "calculate", "what is the answer" → HOMEWORK
- "how does", "why does", "explain", "what is [concept]" → CONCEPTUAL
- "what do you mean", "can you repeat", "I don't understand that" → CLARIFY
- Anything unrelated to the subject → OFFTOPIC

Respond with ONLY the label. No punctuation. No explanation."""


def classify(message: str, history: list, subject: str) -> str:
    last_turn = history[-1]["content"] if history else ""
    response = client.messages.create(
        model=settings.llm_model,
        max_tokens=10,
        messages=[{"role": "user", "content": INTENT_PROMPT.format(
            message=message, subject=subject, last_turn=last_turn
        )}]
    )
    label = response.content[0].text.strip().upper()
    return label if label in ["HOMEWORK", "CONCEPTUAL", "CLARIFY", "OFFTOPIC"] else "CLARIFY"

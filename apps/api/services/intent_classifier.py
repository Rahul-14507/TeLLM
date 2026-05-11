from llm_client import chat

INTENT_PROMPT = """Classify this student message into exactly ONE label:
HOMEWORK   - solving a specific sum, problem, or calculation
CONCEPTUAL - asking what/why/how something works in general  
CLARIFY    - a follow-up question about something just discussed
OFFTOPIC   - unrelated to the subject

Student message: "{message}"
Current subject: "{subject}"
Last assistant message: "{last_turn}"

Respond with ONLY the label. No punctuation. No explanation."""


def classify(message: str, history: list, subject: str) -> str:
    last_turn = history[-1]["content"] if history else ""
    prompt = INTENT_PROMPT.format(
        message=message, subject=subject, last_turn=last_turn
    )
    response = chat(
        messages=[{"role": "user", "content": prompt}],
        max_tokens=10
    )
    label = response.choices[0].message.content.strip().upper()
    return label if label in ["HOMEWORK", "CONCEPTUAL", "CLARIFY", "OFFTOPIC"] else "CLARIFY"

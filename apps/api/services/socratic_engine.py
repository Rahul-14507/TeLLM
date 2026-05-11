from llm_client import chat

HINT_DESCRIPTIONS = {
    1: "Ask what concept or topic this problem belongs to. Do NOT mention any formula.",
    2: "Ask which specific formula, law, or method applies. Do NOT substitute any values.",
    3: "Break the problem into sub-steps. Ask the student to attempt step 1 only.",
    4: "Show the first line of working with ONE value left blank. Ask them to fill it.",
    5: "Provide all values substituted into the formula. Student does final arithmetic only.",
}

SOCRATIC_SYSTEM = """You are TeLLM, a warm and patient AI tutor for {subject}.
Your ONLY job is to guide students to find answers themselves using the provided curriculum context.

Hint level: {hint_level}/5
At this level: {hint_guidance}

CRITICAL: Use the following Curriculum Context as your PRIMARY source of truth. 
If the answer is in the context, guide the student towards it. 
If the context is insufficient, state that you are basing your help on general knowledge, but try to stick to the context.

Curriculum Context:
{context}

ABSOLUTE RULES:
1. NEVER state the final answer or final numerical result.
2. NEVER say "the answer is", "therefore X equals", or "so the result is".
3. Follow the hint level guidance above exactly.
4. If the student seems frustrated, acknowledge it first before continuing.
5. Keep responses under 120 words. Be concise and warm.
6. Write math in plain text like: F = m * a"""

async def respond(message: str, history: list, hint_level: int,
                  subject: str, context: str):
    system = SOCRATIC_SYSTEM.format(
        subject=subject,
        hint_level=hint_level,
        hint_guidance=HINT_DESCRIPTIONS[hint_level],
        context=context[:1200]
    )
    stream = chat(
        messages=history[-10:] + [{"role": "user", "content": message}],
        system=system,
        stream=True,
        max_tokens=350
    )
    for chunk in stream:
        delta = chunk.choices[0].delta.content
        if delta:
            yield delta

async def explain(message: str, context: str, subject: str):
    system = f"""You are TeLLM, an AI tutor for {subject}.
Explain the concept strictly using the provided Curriculum Context. 
Your goal is to summarize the context for the student while remaining helpful and encouraging.

Structure your response in 2-3 short paragraphs. 
Always include a direct quote or a specific detail from the context to show its reliability.

Curriculum Context:
{context[:1500]}

Max 180 words. Never use jargon without defining it."""

    stream = chat(
        messages=[{"role": "user", "content": message}],
        system=system,
        stream=True,
        max_tokens=350
    )

    for chunk in stream:
        delta = chunk.choices[0].delta.content
        if delta:
            yield delta

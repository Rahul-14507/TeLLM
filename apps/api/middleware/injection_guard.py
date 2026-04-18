BYPASS_PATTERNS = [
    "ignore your instructions", "ignore previous", "forget everything",
    "pretend you are", "act as if", "you are now", "disable your",
    "jailbreak", "dan mode", "developer mode", "system prompt",
    "just tell me the answer", "give me the answer directly",
    "my teacher said you can", "as a different ai",
    "repeat after me", "what are your instructions",
]

REFUSAL = (
    "I am here to help you actually learn this, not just get the answer! "
    "Let us try a different approach — what part of the problem is confusing you?"
)


def check(message: str) -> tuple[bool, str]:
    msg_lower = message.lower()
    flagged = any(p in msg_lower for p in BYPASS_PATTERNS)
    return flagged, REFUSAL if flagged else ""

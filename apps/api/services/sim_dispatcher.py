TEMPLATE_REGISTRY = {
    "projectile_motion": {
        "keywords": ["projectile", "trajectory", "launch angle", "range", "height"],
        "params": ["angle_deg", "initial_velocity_ms", "gravity_ms2"],
        "defaults": {"angle_deg": 45, "initial_velocity_ms": 20, "gravity_ms2": 9.8}
    },
    "pendulum": {
        "keywords": ["pendulum", "oscillation", "period", "simple harmonic", "swing"],
        "params": ["length_m", "gravity_ms2", "initial_angle_deg"],
        "defaults": {"length_m": 1.0, "gravity_ms2": 9.8, "initial_angle_deg": 30}
    },
    "wave_superposition": {
        "keywords": ["wave", "frequency", "amplitude", "interference", "superposition"],
        "params": ["freq1_hz", "freq2_hz", "amplitude"],
        "defaults": {"freq1_hz": 2, "freq2_hz": 3, "amplitude": 1}
    },
    "ohms_law": {
        "keywords": ["ohm", "current", "voltage", "resistance", "circuit"],
        "params": ["voltage_v", "resistance_ohm"],
        "defaults": {"voltage_v": 12, "resistance_ohm": 6}
    },
    "cell_division": {
        "keywords": ["mitosis", "meiosis", "cell division", "chromosome", "nucleus"],
        "params": ["speed"],
        "defaults": {"speed": 1}
    },
    "lens_refraction": {
        "keywords": ["lens", "refraction", "focal", "convex", "concave", "image"],
        "params": ["focal_length_cm", "object_distance_cm"],
        "defaults": {"focal_length_cm": 10, "object_distance_cm": 25}
    },
}


from llm_client import chat

# ... keep TEMPLATE_REGISTRY exactly as before ...

async def dispatch(concept: str) -> dict | None:
    concept_lower = concept.lower()
    scores = {
        key: sum(1 for kw in data["keywords"] if kw in concept_lower)
        for key, data in TEMPLATE_REGISTRY.items()
    }
    best_key = max(scores, key=scores.get)
    if scores[best_key] >= 1:
        return {"template": best_key, "params": TEMPLATE_REGISTRY[best_key]["defaults"]}

    # LLM fallback — still free, uses Ollama
    keys_list = ", ".join(TEMPLATE_REGISTRY.keys())
    response = chat(
        messages=[{"role": "user", "content":
            f"Which simulation template best matches: '{concept}'?\n"
            f"Options: {keys_list}\n"
            f"Reply with ONLY the key, or 'none' if nothing fits."}],
        max_tokens=15
    )
    key = response.choices[0].message.content.strip()
    if key in TEMPLATE_REGISTRY:
        return {"template": key, "params": TEMPLATE_REGISTRY[key]["defaults"]}
    return None

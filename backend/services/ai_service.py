"""Provider-independent local AI service for PrepMate AI.

Default provider is Ollama so the project can use a local LLM without paid API
credits. If the local model is unavailable, callers can use their deterministic
fallbacks and the application remains usable.
"""

import json
import os
import urllib.error
import urllib.request
from typing import Any, Optional

from dotenv import load_dotenv

load_dotenv()


AI_PROVIDER = os.getenv("AI_PROVIDER", "ollama").strip().lower()
AI_ENABLED = os.getenv("AI_ENABLED", "true").strip().lower() in {
    "1", "true", "yes", "on"
}
OLLAMA_URL = os.getenv("OLLAMA_URL", "http://127.0.0.1:11434/api/generate").strip()
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3.2:3b").strip()
AI_TIMEOUT = int(os.getenv("AI_TIMEOUT_SECONDS", "90"))


def _ollama(prompt: str, system: str = "") -> Optional[str]:
    if not AI_ENABLED or AI_PROVIDER != "ollama":
        return None

    payload = {
        "model": OLLAMA_MODEL,
        "prompt": prompt,
        "system": system,
        "stream": False,
        "format": "json",
        "options": {"temperature": 0.2},
    }

    request = urllib.request.Request(
        OLLAMA_URL,
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )

    try:
        with urllib.request.urlopen(request, timeout=AI_TIMEOUT) as response:
            body = json.loads(response.read().decode("utf-8"))
            value = body.get("response")
            return value.strip() if isinstance(value, str) else None
    except (urllib.error.URLError, urllib.error.HTTPError, TimeoutError, OSError, ValueError):
        return None


def generate_json(
    prompt: str,
    system: str = "You are a careful career-placement AI. Return only valid JSON.",
) -> Optional[dict[str, Any]]:
    raw = _ollama(prompt, system)
    if not raw:
        return None

    try:
        data = json.loads(raw)
    except json.JSONDecodeError:
        return None

    return data if isinstance(data, dict) else None


def generate_text(
    prompt: str,
    system: str = "You are a careful career-placement AI. Do not invent facts.",
) -> Optional[str]:
    if not AI_ENABLED or AI_PROVIDER != "ollama":
        return None

    # Ollama's JSON mode is intentionally not used for free-form text.
    payload = {
        "model": OLLAMA_MODEL,
        "prompt": prompt,
        "system": system,
        "stream": False,
        "options": {"temperature": 0.3},
    }

    request = urllib.request.Request(
        OLLAMA_URL,
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )

    try:
        with urllib.request.urlopen(request, timeout=AI_TIMEOUT) as response:
            body = json.loads(response.read().decode("utf-8"))
            value = body.get("response")
            return value.strip() if isinstance(value, str) else None
    except (urllib.error.URLError, urllib.error.HTTPError, TimeoutError, OSError, ValueError):
        return None


def provider_status() -> dict[str, Any]:
    return {
        "provider": AI_PROVIDER,
        "enabled": AI_ENABLED,
        "model": OLLAMA_MODEL if AI_PROVIDER == "ollama" else None,
        "mode": "local-llm" if AI_PROVIDER == "ollama" and AI_ENABLED else "fallback",
    }

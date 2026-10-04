"""Provider-independent AI service for PrepMate AI.

Local development:
    Ollama + llama3.2:3b

Production:
    Gemini API

If the configured AI provider is unavailable, callers can use their
deterministic fallbacks so the application remains usable.
"""

import json
import os
import urllib.error
import urllib.parse
import urllib.request
from typing import Any, Optional

from dotenv import load_dotenv

load_dotenv()


# ============================================================
# GENERAL AI SETTINGS
# ============================================================

AI_PROVIDER = os.getenv("AI_PROVIDER", "ollama").strip().lower()

AI_ENABLED = os.getenv("AI_ENABLED", "true").strip().lower() in {
    "1",
    "true",
    "yes",
    "on",
}

AI_TIMEOUT = int(os.getenv("AI_TIMEOUT_SECONDS", "90"))


# ============================================================
# OLLAMA SETTINGS
# ============================================================

OLLAMA_URL = os.getenv(
    "OLLAMA_URL",
    "http://127.0.0.1:11434/api/generate",
).strip()

OLLAMA_MODEL = os.getenv(
    "OLLAMA_MODEL",
    "llama3.2:3b",
).strip()


# ============================================================
# GEMINI SETTINGS
# ============================================================

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "").strip()

GEMINI_MODEL = os.getenv(
    "GEMINI_MODEL",
    "gemini-2.5-flash-lite",
).strip()

GEMINI_BASE_URL = (
    "https://generativelanguage.googleapis.com/v1beta/models"
)


# ============================================================
# COMMON HELPERS
# ============================================================

def _clean_text(value: Any) -> Optional[str]:
    """Return stripped text when value is a non-empty string."""

    if not isinstance(value, str):
        return None

    value = value.strip()

    return value if value else None


def _safe_json_loads(raw: str) -> Optional[dict[str, Any]]:
    """Safely parse a JSON object returned by an AI provider."""

    if not isinstance(raw, str):
        return None

    raw = raw.strip()

    if not raw:
        return None

    # First attempt: direct JSON.
    try:
        data = json.loads(raw)

        if isinstance(data, dict):
            return data

    except json.JSONDecodeError:
        pass

    # Second attempt: remove markdown code fences if a provider
    # accidentally returns them.
    cleaned = raw

    if cleaned.startswith("```"):
        lines = cleaned.splitlines()

        if lines and lines[0].strip().startswith("```"):
            lines = lines[1:]

        if lines and lines[-1].strip() == "```":
            lines = lines[:-1]

        cleaned = "\n".join(lines).strip()

        if cleaned.lower().startswith("json"):
            cleaned = cleaned[4:].strip()

    try:
        data = json.loads(cleaned)

        if isinstance(data, dict):
            return data

    except json.JSONDecodeError:
        return None

    return None


# ============================================================
# OLLAMA
# ============================================================

def _ollama(
    prompt: str,
    system: str = "",
    json_mode: bool = False,
) -> Optional[str]:
    """Generate a response using local Ollama."""

    if not AI_ENABLED or AI_PROVIDER != "ollama":
        return None

    payload: dict[str, Any] = {
        "model": OLLAMA_MODEL,
        "prompt": prompt,
        "system": system,
        "stream": False,
        "options": {
            "temperature": 0.2,
        },
    }

    if json_mode:
        payload["format"] = "json"

    request = urllib.request.Request(
        OLLAMA_URL,
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Content-Type": "application/json",
        },
        method="POST",
    )

    try:
        with urllib.request.urlopen(
            request,
            timeout=AI_TIMEOUT,
        ) as response:

            body = json.loads(
                response.read().decode("utf-8")
            )

            value = body.get("response")

            return _clean_text(value)

    except (
        urllib.error.URLError,
        urllib.error.HTTPError,
        TimeoutError,
        OSError,
        ValueError,
    ):
        return None


# ============================================================
# GEMINI
# ============================================================

def _gemini(
    prompt: str,
    system: str = "",
    json_mode: bool = False,
) -> Optional[str]:
    """Generate a response using the Google Gemini API."""

    if not AI_ENABLED or AI_PROVIDER != "gemini":
        return None

    if not GEMINI_API_KEY:
        return None

    model = urllib.parse.quote(
        GEMINI_MODEL,
        safe=".-_",
    )

    url = (
        f"{GEMINI_BASE_URL}/{model}:generateContent"
    )

    payload: dict[str, Any] = {
        "contents": [
            {
                "parts": [
                    {
                        "text": prompt,
                    }
                ]
            }
        ],
        "generationConfig": {
            "temperature": 0.2,
        },
    }

    if system:
        payload["systemInstruction"] = {
            "parts": [
                {
                    "text": system,
                }
            ]
        }

    if json_mode:
        payload["generationConfig"]["responseMimeType"] = (
            "application/json"
        )

    request = urllib.request.Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Content-Type": "application/json",
            "x-goog-api-key": GEMINI_API_KEY,
        },
        method="POST",
    )

    try:
        with urllib.request.urlopen(
            request,
            timeout=AI_TIMEOUT,
        ) as response:

            body = json.loads(
                response.read().decode("utf-8")
            )

            candidates = body.get("candidates", [])

            if not isinstance(candidates, list) or not candidates:
                return None

            first_candidate = candidates[0]

            content = first_candidate.get("content", {})

            parts = content.get("parts", [])

            if not isinstance(parts, list):
                return None

            texts: list[str] = []

            for part in parts:
                if not isinstance(part, dict):
                    continue

                text = part.get("text")

                if isinstance(text, str):
                    text = text.strip()

                    if text:
                        texts.append(text)

            if not texts:
                return None

            return "\n".join(texts).strip()

    except (
        urllib.error.URLError,
        urllib.error.HTTPError,
        TimeoutError,
        OSError,
        ValueError,
    ):
        return None


# ============================================================
# PROVIDER ROUTER
# ============================================================

def _generate(
    prompt: str,
    system: str = "",
    json_mode: bool = False,
) -> Optional[str]:
    """Route the request to the configured AI provider."""

    if not AI_ENABLED:
        return None

    if AI_PROVIDER == "ollama":
        return _ollama(
            prompt=prompt,
            system=system,
            json_mode=json_mode,
        )

    if AI_PROVIDER == "gemini":
        return _gemini(
            prompt=prompt,
            system=system,
            json_mode=json_mode,
        )

    return None


# ============================================================
# JSON GENERATION
# ============================================================

def generate_json(
    prompt: str,
    system: str = (
        "You are a careful career-placement AI. "
        "Return only valid JSON."
    ),
) -> Optional[dict[str, Any]]:
    """Generate and parse a JSON object from the configured provider."""

    raw = _generate(
        prompt=prompt,
        system=system,
        json_mode=True,
    )

    if not raw:
        return None

    return _safe_json_loads(raw)


# ============================================================
# TEXT GENERATION
# ============================================================

def generate_text(
    prompt: str,
    system: str = (
        "You are a careful career-placement AI. "
        "Do not invent facts."
    ),
) -> Optional[str]:
    """Generate free-form text from the configured provider."""

    return _generate(
        prompt=prompt,
        system=system,
        json_mode=False,
    )


# ============================================================
# PROVIDER STATUS
# ============================================================

def provider_status() -> dict[str, Any]:
    """Return safe provider information for diagnostics.

    Never expose API keys.
    """

    if AI_PROVIDER == "ollama":
        return {
            "provider": "ollama",
            "enabled": AI_ENABLED,
            "model": OLLAMA_MODEL,
            "mode": (
                "local-llm"
                if AI_ENABLED
                else "fallback"
            ),
        }

    if AI_PROVIDER == "gemini":
        return {
            "provider": "gemini",
            "enabled": AI_ENABLED,
            "model": GEMINI_MODEL,
            "configured": bool(GEMINI_API_KEY),
            "mode": (
                "hosted-llm"
                if AI_ENABLED and GEMINI_API_KEY
                else "fallback"
            ),
        }

    return {
        "provider": AI_PROVIDER,
        "enabled": AI_ENABLED,
        "model": None,
        "mode": "fallback",
    }
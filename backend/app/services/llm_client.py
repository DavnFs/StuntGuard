from __future__ import annotations

import json
import os
import urllib.error
import urllib.request
from typing import Any, Optional

from app import config as _config  # noqa: F401 - ensures .env files are loaded


MAX_OUTPUT_TOKENS = 300
SUPPORTED_PROVIDERS = {"gemini", "groq", "openai", "openrouter"}


def configured_provider() -> str:
    provider = os.getenv("LLM_PROVIDER", "gemini").strip().lower()
    return provider if provider in SUPPORTED_PROVIDERS else "gemini"


def _provider_api_key(provider: str) -> Optional[str]:
    keys = {
        "gemini": "GEMINI_API_KEY",
        "groq": "GROQ_API_KEY",
        "openai": "OPENAI_API_KEY",
        "openrouter": "OPENROUTER_API_KEY",
    }
    key_name = keys.get(provider)
    return os.getenv(key_name, "").strip() if key_name else None


def llm_available(provider: Optional[str] = None) -> bool:
    return bool(_provider_api_key(provider or configured_provider()))


def _post_json(url: str, body: dict[str, Any], headers: dict[str, str]) -> Optional[dict[str, Any]]:
    request = urllib.request.Request(
        url,
        data=json.dumps(body).encode("utf-8"),
        headers={**headers, "Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=20) as response:
            return json.loads(response.read().decode("utf-8"))
    except (urllib.error.URLError, TimeoutError, KeyError, json.JSONDecodeError, ValueError):
        return None


def _call_gemini(message: str, system_prompt: str) -> Optional[str]:
    api_key = _provider_api_key("gemini")
    if not api_key:
        return None

    model = os.getenv("GEMINI_MODEL", "gemini-2.0-flash-lite").strip() or "gemini-2.0-flash-lite"
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
    payload = {
        "systemInstruction": {"parts": [{"text": system_prompt}]},
        "contents": [{"role": "user", "parts": [{"text": message}]}],
        "generationConfig": {
            "temperature": 0.35,
            "maxOutputTokens": MAX_OUTPUT_TOKENS,
        },
    }
    data = _post_json(url, payload, {})
    if not data:
        return None

    parts = data.get("candidates", [{}])[0].get("content", {}).get("parts", [])
    text = "\n".join(str(part.get("text", "")).strip() for part in parts if part.get("text"))
    return text.strip() if text else None


def _openai_compatible_config(provider: str) -> tuple[str, str, str] | None:
    if provider == "groq":
        api_key = _provider_api_key("groq")
        model = os.getenv("GROQ_MODEL", "llama-3.1-8b-instant").strip() or "llama-3.1-8b-instant"
        url = "https://api.groq.com/openai/v1/chat/completions"
    elif provider == "openrouter":
        api_key = _provider_api_key("openrouter")
        model = (
            os.getenv("OPENROUTER_MODEL", "google/gemini-2.0-flash-lite-001").strip()
            or "google/gemini-2.0-flash-lite-001"
        )
        url = "https://openrouter.ai/api/v1/chat/completions"
    elif provider == "openai":
        api_key = _provider_api_key("openai")
        model = os.getenv("OPENAI_MODEL", "gpt-4.1-mini").strip() or "gpt-4.1-mini"
        url = "https://api.openai.com/v1/chat/completions"
    else:
        return None

    if not api_key:
        return None
    return url, api_key, model


def _call_openai_compatible(provider: str, message: str, system_prompt: str) -> Optional[str]:
    config = _openai_compatible_config(provider)
    if not config:
        return None

    url, api_key, model = config
    headers = {"Authorization": f"Bearer {api_key}"}
    if provider == "openrouter":
        headers["HTTP-Referer"] = "http://localhost:5173"
        headers["X-Title"] = "StuntGuard"

    payload = {
        "model": model,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": message},
        ],
        "temperature": 0.35,
        "max_tokens": MAX_OUTPUT_TOKENS,
    }
    data = _post_json(url, payload, headers)
    if not data:
        return None

    message_payload = data.get("choices", [{}])[0].get("message", {})
    text = message_payload.get("content")
    return str(text).strip() if text else None


def call_llm(message: str, system_prompt: str) -> Optional[str]:
    provider = configured_provider()
    if provider == "gemini":
        return _call_gemini(message, system_prompt)
    return _call_openai_compatible(provider, message, system_prompt)

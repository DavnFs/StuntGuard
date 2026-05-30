from __future__ import annotations

import json
import os
import urllib.error
import urllib.request
from typing import Any, Optional

from app import config as _config  # noqa: F401 - ensures .env files are loaded


SUPPORTED_PROVIDERS = {"chain", "gemini", "groq", "openai", "openrouter"}


def _env_int(name: str, default: int) -> int:
    try:
        return int(os.getenv(name, str(default)))
    except ValueError:
        return default


MAX_OUTPUT_TOKENS = _env_int("LLM_MAX_OUTPUT_TOKENS", 300)


def configured_provider() -> str:
    provider = os.getenv("LLM_PROVIDER", "chain").strip().lower()
    return provider if provider in SUPPORTED_PROVIDERS else "chain"


def _provider_api_key(provider: str) -> Optional[str]:
    keys = {
        "gemini": "GEMINI_API_KEY",
        "groq": "GROQ_API_KEY",
        "openai": "OPENAI_API_KEY",
        "openrouter": "OPENROUTER_API_KEY",
    }

    key_name = keys.get(provider)
    if not key_name:
        return None

    key = os.getenv(key_name, "").strip()
    return key or None


def llm_available(provider: Optional[str] = None) -> bool:
    selected = provider or configured_provider()

    if selected == "chain":
        return any(_provider_api_key(item[0]) for item in _fallback_chain())

    return bool(_provider_api_key(selected))


def _post_json(
    url: str,
    body: dict[str, Any],
    headers: dict[str, str],
) -> Optional[dict[str, Any]]:
    request = urllib.request.Request(
        url,
        data=json.dumps(body).encode("utf-8"),
        headers={**headers, "Content-Type": "application/json"},
        method="POST",
    )

    try:
        with urllib.request.urlopen(request, timeout=20) as response:
            return json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError:
        # 401, 403, 429, 500, etc. Return None so the fallback chain can
        # continue to the next model/provider.
        return None
    except (urllib.error.URLError, TimeoutError, KeyError, json.JSONDecodeError, ValueError):
        return None


def _call_gemini_with_model(
    message: str,
    system_prompt: str,
    model: str,
) -> Optional[str]:
    api_key = _provider_api_key("gemini")
    if not api_key:
        return None

    model = model.strip()
    if not model:
        return None

    url = (
        f"https://generativelanguage.googleapis.com/v1beta/models/"
        f"{model}:generateContent?key={api_key}"
    )

    payload = {
        "systemInstruction": {
            "parts": [{"text": system_prompt}],
        },
        "contents": [
            {
                "role": "user",
                "parts": [{"text": message}],
            }
        ],
        "generationConfig": {
            "temperature": 0.35,
            "maxOutputTokens": MAX_OUTPUT_TOKENS,
        },
    }

    data = _post_json(url, payload, {})
    if not data:
        return None

    parts = data.get("candidates", [{}])[0].get("content", {}).get("parts", [])
    text = "\n".join(
        str(part.get("text", "")).strip()
        for part in parts
        if part.get("text")
    )

    return text.strip() if text else None


def _openai_compatible_url(provider: str) -> Optional[str]:
    if provider == "groq":
        return "https://api.groq.com/openai/v1/chat/completions"

    if provider == "openrouter":
        return "https://openrouter.ai/api/v1/chat/completions"

    if provider == "openai":
        return "https://api.openai.com/v1/chat/completions"

    return None


def _call_openai_compatible_with_model(
    provider: str,
    message: str,
    system_prompt: str,
    model: str,
) -> Optional[str]:
    api_key = _provider_api_key(provider)
    url = _openai_compatible_url(provider)

    if not api_key or not url or not model:
        return None

    headers = {
        "Authorization": f"Bearer {api_key}",
    }

    if provider == "openrouter":
        headers["HTTP-Referer"] = os.getenv("OPENROUTER_SITE_URL", "http://localhost:5173")
        headers["X-Title"] = os.getenv("OPENROUTER_APP_NAME", "StuntGuard")

    payload = {
        "model": model,
        "messages": [
            {
                "role": "system",
                "content": system_prompt,
            },
            {
                "role": "user",
                "content": message,
            },
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


def _fallback_chain() -> list[tuple[str, str]]:
    """
    Env format:
    LLM_FALLBACK_CHAIN=gemini:gemini-2.5-flash-lite,gemini:gemini-2.0-flash-lite,groq:llama-3.1-8b-instant,openrouter:google/gemini-2.0-flash-lite-001

    Providers without API keys are skipped automatically.
    """
    raw = os.getenv("LLM_FALLBACK_CHAIN", "").strip()

    if not raw:
        raw = ",".join(
            [
                f"gemini:{os.getenv('GEMINI_MODEL', 'gemini-2.0-flash-lite')}",
                f"gemini:{os.getenv('GEMINI_FALLBACK_MODEL', 'gemini-1.5-flash')}",
                f"groq:{os.getenv('GROQ_MODEL', 'llama-3.1-8b-instant')}",
                f"openrouter:{os.getenv('OPENROUTER_MODEL', 'google/gemini-2.0-flash-lite-001')}",
                f"openai:{os.getenv('OPENAI_MODEL', 'gpt-4.1-mini')}",
            ]
        )

    chain: list[tuple[str, str]] = []

    for item in raw.split(","):
        item = item.strip()
        if not item or ":" not in item:
            continue

        provider, model = item.split(":", 1)
        provider = provider.strip().lower()
        model = model.strip()

        if provider not in {"gemini", "groq", "openai", "openrouter"}:
            continue

        if not model:
            continue

        chain.append((provider, model))

    return chain


def _call_provider_model(
    provider: str,
    model: str,
    message: str,
    system_prompt: str,
) -> Optional[str]:
    if not _provider_api_key(provider):
        return None

    if provider == "gemini":
        return _call_gemini_with_model(message, system_prompt, model)

    return _call_openai_compatible_with_model(provider, message, system_prompt, model)


def _call_chain(message: str, system_prompt: str) -> Optional[str]:
    for provider, model in _fallback_chain():
        text = _call_provider_model(provider, model, message, system_prompt)
        if text:
            return text

    return None


def call_llm(message: str, system_prompt: str) -> Optional[str]:
    provider = configured_provider()

    if provider == "chain":
        return _call_chain(message, system_prompt)

    if provider == "gemini":
        model = os.getenv("GEMINI_MODEL", "gemini-2.0-flash-lite").strip()
        return _call_gemini_with_model(message, system_prompt, model)

    if provider == "groq":
        model = os.getenv("GROQ_MODEL", "llama-3.1-8b-instant").strip()
        return _call_openai_compatible_with_model("groq", message, system_prompt, model)

    if provider == "openrouter":
        model = os.getenv("OPENROUTER_MODEL", "google/gemini-2.0-flash-lite-001").strip()
        return _call_openai_compatible_with_model("openrouter", message, system_prompt, model)

    if provider == "openai":
        model = os.getenv("OPENAI_MODEL", "gpt-4.1-mini").strip()
        return _call_openai_compatible_with_model("openai", message, system_prompt, model)

    return None

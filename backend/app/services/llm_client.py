from __future__ import annotations

import json
import os
import urllib.error
import urllib.request
from typing import Optional


def llm_available() -> bool:
    provider = os.getenv("LLM_PROVIDER", "openai").strip().lower()
    return provider == "openai" and bool(os.getenv("OPENAI_API_KEY"))


def call_llm(message: str, system_prompt: str) -> Optional[str]:
    provider = os.getenv("LLM_PROVIDER", "openai").strip().lower()
    api_key = os.getenv("OPENAI_API_KEY")
    if provider != "openai" or not api_key:
        return None

    model = os.getenv("OPENAI_MODEL", "gpt-4.1-mini")
    body = {
        "model": model,
        "input": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": message},
        ],
    }
    request = urllib.request.Request(
        "https://api.openai.com/v1/responses",
        data=json.dumps(body).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
        method="POST",
    )

    try:
        with urllib.request.urlopen(request, timeout=15) as response:
            payload = json.loads(response.read().decode("utf-8"))
    except (urllib.error.URLError, TimeoutError, KeyError, json.JSONDecodeError):
        return None

    text = payload.get("output_text")
    if text:
        return str(text).strip()

    chunks = []
    for item in payload.get("output", []):
        for content in item.get("content", []):
            if content.get("type") in {"output_text", "text"}:
                chunks.append(content.get("text", ""))
    text = "\n".join(chunk for chunk in chunks if chunk)
    return text.strip() if text else None

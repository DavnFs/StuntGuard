import os
import logging
import re
from typing import Optional
import httpx

from app import config as _config  # noqa: F401 - ensures .env files are loaded

logger = logging.getLogger("uvicorn.error")


def configured_provider() -> str:
    return "gemini"


def clean_llm_response(raw_text: str) -> str:
    # 1. Strip XML-like tags (e.g. <think>...)
    text = re.sub(r'<think>.*?</think>', '', raw_text, flags=re.DOTALL)
    
    # 2. Strip Markdown bold formatting asterisks (**) to prevent raw marker leaks in UI
    text = text.replace("**", "")
    
    # 3. Split into lines
    lines = text.splitlines()
    cleaned_lines = []
    
    planning_keywords = [
        "user's child", "user asks", "screening context", "untrusted data", 
        "anomalous", "physically impossible", "highly erroneous", 
        "system prompt", "tone:", "language:", "constraint:", "guidance:", 
        "safety note:", "step 1", "step 2", "step 3", "step 4", "step 5",
        "simple bahasa indonesia?", "calm/supportive?", "concise/under",
        "suggested local foods?", "recommended posyandu", "no medical diagnosis?",
        "parent/posyandu user", "is identified as", "treat screening context"
    ]
    
    for line in lines:
        stripped = line.strip()
        if not stripped:
            cleaned_lines.append("")
            continue
            
        # Detect and remove drafting labels at the start of the line
        stripped_draft = re.sub(
            r'^\s*[\*\-\d\.\s]*\s*[\*_]*(drafting\s+paragraph\s+\d+|acknowledgment|action|nutrition|safety\s*note|response|reply|text|note)[\*_]*:\s*',
            '',
            stripped,
            flags=re.IGNORECASE
        )
        
        # Strip remaining markdown italics or bold wrappers just in case
        stripped_draft = stripped_draft.strip("*_")
        
        # If the line was a planning line (mostly English bullet points or analysis), skip it.
        lower_stripped = stripped.lower()
        is_planning = False
        
        if any(kw in lower_stripped for kw in planning_keywords):
            is_planning = True
            
        # Also skip lines that are purely bullet points of planning checklist like "*   Name: StuntGuard AI Assistant."
        if (stripped.startswith('*') or stripped.startswith('-')) and any(kw in lower_stripped for kw in ["name:", "role:", "language:", "tone:", "constraint:", "guidance:"]):
            is_planning = True
            
        if is_planning:
            continue
            
        cleaned_lines.append(stripped_draft)
        
    # Reconstruct text and clean empty lines
    result = "\n".join(cleaned_lines)
    # Collapse multiple consecutive newlines into double newlines
    result = re.sub(r'\n\s*\n\s*\n+', '\n\n', result)
    return result.strip()


def call_llm(message: str, system_prompt: str) -> Optional[str]:
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        logger.error("[Chatbot] Kegagalan Sistem: GEMINI_API_KEY tidak ditemukan di environment variable (.env)!")
        return None

    model_name = os.getenv("GEMINI_MODEL", "gemma-2-27b-it")
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={api_key}"
    
    # Hardening instruction to prevent thought leakage
    strict_system = system_prompt + "\n\nCRITICAL INSTRUCTION: DO NOT output your internal thinking process, steps, or scratchpad. Output ONLY the final, direct response intended for the user."

    # Proper role separation
    payload = {
        "system_instruction": {
            "parts": [{"text": strict_system}]
        },
        "contents": [
            {
                "role": "user",
                "parts": [{"text": message}]
            }
        ]
    }

    try:
        with httpx.Client(timeout=60.0) as client:
            response = client.post(url, json=payload)
            response.raise_for_status() 
            
            res_data = response.json()
            raw_text = res_data["candidates"][0]["content"]["parts"][0]["text"]
            
            return clean_llm_response(raw_text)

    except httpx.HTTPStatusError as http_err:
        logger.error(f"[Chatbot] Google API Error: {http_err.response.status_code} - {http_err.response.text}")
        return None
    except Exception as err:
        logger.error("[Chatbot] Pengecualian tidak dikenal saat memanggil Gemini API", exc_info=True)
        return None

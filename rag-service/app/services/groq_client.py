from __future__ import annotations

import os
from pathlib import Path

from dotenv import load_dotenv
from groq import Groq


DOTENV_PATH = Path(__file__).resolve().parents[2] / ".env"


def get_groq_client() -> Groq:
    api_key = (os.environ.get("GROQ_API_KEY") or "").strip()
    if not api_key and DOTENV_PATH.exists():
        # Allow editing rag-service/.env without needing to restart the server.
        load_dotenv(dotenv_path=DOTENV_PATH, override=True)
        api_key = (os.environ.get("GROQ_API_KEY") or "").strip()
    if not api_key:
        raise RuntimeError("GROQ_API_KEY is not set")
    return Groq(api_key=api_key)


def groq_chat_completion(*, prompt: str) -> str:
    client = get_groq_client()
    model = (os.environ.get("GROQ_MODEL") or "llama-3.3-70b-versatile").strip()

    try:
        temperature = float(os.environ.get("GROQ_TEMPERATURE") or "0.2")
    except Exception:
        temperature = 0.2
    try:
        max_tokens = int(os.environ.get("GROQ_MAX_TOKENS") or "1800")
    except Exception:
        max_tokens = 1800

    completion = client.chat.completions.create(
        model=model,
        messages=[{"role": "user", "content": prompt}],
        temperature=temperature,
        max_tokens=max_tokens,
    )

    return (completion.choices[0].message.content or "").strip()

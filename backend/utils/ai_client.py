import os
import json
import asyncio
from typing import AsyncGenerator, Optional
import httpx
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), "..", "..", ".env"))

API_KEY = os.getenv("API_KEY", "")
API_URL = os.getenv("API_URL", "https://api.apiyi.com/v1/chat/completions")
MODEL = os.getenv("MODEL", "claude-sonnet-4-5-20250929")
MAX_TOKENS = int(os.getenv("MAX_TOKENS", "8000"))


def _inject_image(messages: list[dict], image: str) -> list[dict]:
    """Attach image_url block to the last user message."""
    msgs = [m.copy() for m in messages]
    for i in range(len(msgs) - 1, -1, -1):
        if msgs[i].get("role") == "user":
            text = msgs[i].get("content", "")
            if isinstance(text, str):
                msgs[i]["content"] = [
                    {"type": "text", "text": text},
                    {"type": "image_url", "image_url": {"url": image}},
                ]
            break
    return msgs


async def stream_ai(
    messages: list[dict],
    image: Optional[str] = None,
    max_tokens: int = MAX_TOKENS,
    timeout_seconds: int = 120,
) -> AsyncGenerator[str, None]:
    if image:
        messages = _inject_image(messages, image)

    payload = {
        "model": MODEL,
        "messages": messages,
        "stream": True,
        "max_tokens": max_tokens,
        "temperature": 0.7,
    }

    async with httpx.AsyncClient(timeout=timeout_seconds) as client:
        try:
            async with client.stream(
                "POST",
                API_URL,
                headers={
                    "Authorization": f"Bearer {API_KEY}",
                    "Content-Type": "application/json",
                },
                content=json.dumps(payload),
            ) as resp:
                if resp.status_code != 200:
                    body = await resp.aread()
                    try:
                        err = json.loads(body)
                        code = err.get("error", {}).get("code", "")
                        msg = err.get("error", {}).get("message", f"HTTP {resp.status_code}")
                    except Exception:
                        code, msg = "", f"HTTP {resp.status_code}"
                    yield f"__ERROR__{code}::{msg}"
                    return
                async for line in resp.aiter_lines():
                    if not line.startswith("data: "):
                        continue
                    chunk = line[6:]
                    if chunk == "[DONE]":
                        break
                    try:
                        obj = json.loads(chunk)
                        # Some providers return error in stream
                        if "error" in obj:
                            code = obj["error"].get("code", "")
                            msg = obj["error"].get("message", "unknown error")
                            yield f"__ERROR__{code}::{msg}"
                            return
                        content = obj["choices"][0]["delta"].get("content", "")
                        if content:
                            yield content
                    except Exception:
                        pass
        except httpx.TimeoutException:
            yield "__ERROR__timeout::请求超时，请重试"
        except Exception as e:
            yield f"__ERROR__network::{str(e)}"

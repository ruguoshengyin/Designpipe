"""
Low-level AI streaming client.
Talks to an OpenAI-compatible SSE endpoint (apiyi proxy or any compatible provider).
All configuration comes from backend.config.Settings.
"""
import json
import logging
from typing import AsyncGenerator, Optional

import httpx

from backend.config import get_settings

logger = logging.getLogger(__name__)


def _inject_image(messages: list[dict], image_url: str) -> list[dict]:
    """Attach an image_url block to the last user message (non-mutating)."""
    msgs = [m.copy() for m in messages]
    for i in range(len(msgs) - 1, -1, -1):
        if msgs[i].get("role") == "user":
            text = msgs[i].get("content", "")
            if isinstance(text, str):
                msgs[i]["content"] = [
                    {"type": "text", "text": text},
                    {"type": "image_url", "image_url": {"url": image_url}},
                ]
            break
    return msgs


async def stream_ai(
    messages: list[dict],
    image: Optional[str] = None,
    max_tokens: Optional[int] = None,
) -> AsyncGenerator[str, None]:
    """
    Stream text chunks from the AI provider.
    Yields plain text strings.
    On error yields a single "__ERROR__code::message" sentinel string.
    """
    cfg = get_settings()

    if image:
        messages = _inject_image(messages, image)

    payload = {
        "model": cfg.model,
        "messages": messages,
        "stream": True,
        "max_tokens": max_tokens or cfg.max_tokens,
        "temperature": cfg.temperature,
    }

    headers = {
        "Authorization": f"Bearer {cfg.api_key}",
        "Content-Type": "application/json",
    }

    logger.debug("AI request: model=%s max_tokens=%s", payload["model"], payload["max_tokens"])

    async with httpx.AsyncClient(timeout=cfg.request_timeout) as client:
        try:
            async with client.stream(
                "POST",
                cfg.api_url,
                headers=headers,
                content=json.dumps(payload),
            ) as resp:
                if resp.status_code != 200:
                    body = await resp.aread()
                    code, msg = _parse_error_body(body, resp.status_code)
                    logger.error("AI HTTP error %s: [%s] %s", resp.status_code, code, msg)
                    yield f"__ERROR__{code}::{msg}"
                    return

                async for line in resp.aiter_lines():
                    chunk = _parse_sse_line(line)
                    if chunk is None:
                        continue        # skip / [DONE]
                    if chunk.startswith("__ERROR__"):
                        logger.error("AI stream error: %s", chunk)
                        yield chunk
                        return
                    yield chunk

        except httpx.TimeoutException:
            logger.error("AI request timed out after %ss", cfg.request_timeout)
            yield "__ERROR__timeout::请求超时，请重试"
        except httpx.RequestError as exc:
            logger.error("AI network error: %s", exc)
            yield f"__ERROR__network::{exc}"
        except Exception as exc:
            logger.exception("Unexpected AI client error")
            yield f"__ERROR__unknown::{exc}"


# ── private helpers ───────────────────────────────────────────────────────────

def _parse_error_body(body: bytes, status_code: int) -> tuple[str, str]:
    try:
        err = json.loads(body)
        code = err.get("error", {}).get("code", "") or str(status_code)
        msg = err.get("error", {}).get("message", f"HTTP {status_code}")
    except Exception:
        code, msg = str(status_code), f"HTTP {status_code}"
    return code, msg


def _parse_sse_line(line: str) -> Optional[str]:
    """
    Parse one SSE line.
    Returns:
      - text content string if OK
      - None to skip (empty / non-data lines / [DONE])
      - "__ERROR__..." sentinel if the chunk contains an error
    """
    if not line.startswith("data: "):
        return None
    chunk = line[6:]
    if chunk.strip() == "[DONE]":
        return None
    try:
        obj = json.loads(chunk)
        # Provider-level error inside the stream
        if "error" in obj:
            code = obj["error"].get("code", "stream_error")
            msg = obj["error"].get("message", "unknown stream error")
            return f"__ERROR__{code}::{msg}"
        content = obj["choices"][0]["delta"].get("content", "")
        return content or None
    except Exception:
        return None

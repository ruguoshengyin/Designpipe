"""
AI orchestration service.

Responsibilities:
- Inject images into message lists
- Extract HTML from AI responses
- Provide typed wrappers around the low-level ai_client stream
"""
import re
from typing import AsyncGenerator, Optional

from backend.utils.ai_client import stream_ai as _stream_ai
from backend.utils.hifi_postprocess import postprocess_hifi


# ── Image injection ───────────────────────────────────────────────────────────

def inject_image(messages: list[dict], image_url: str) -> list[dict]:
    """
    Attach an image_url block to the last user message.
    Returns a new list (original is not mutated).
    """
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


# ── HTML extraction ───────────────────────────────────────────────────────────

def extract_html(text: str) -> str:
    """
    Try to pull a complete HTML document out of an AI response.
    Priority order:
      1. Fenced ```html ... ``` block
      2. Bare <!DOCTYPE ...> ... </html>
      3. Bare <html ...> ... </html>
      4. Truncated response — add closing tags
    Returns empty string if nothing found.
    """
    # 1. fenced block
    m = re.search(r"```html\s*([\s\S]*?)```", text, re.IGNORECASE)
    if m and len(m.group(1).strip()) > 200:
        return m.group(1).strip()

    # 2-3. bare full document
    m = re.search(r"<!DOCTYPE[\s\S]*?</html>", text, re.IGNORECASE) or \
        re.search(r"<html[\s\S]*?</html>", text, re.IGNORECASE)
    if m:
        return m.group(0).strip()

    # 4. truncated — find start, patch closing tags
    start = max(
        text.lower().find("<!doctype"),
        text.lower().find("<html"),
    )
    if start == -1:
        # maybe wrapped in a code fence without closing
        fence = text.lower().find("```html")
        if fence != -1:
            start = fence + 7

    if start != -1:
        html = text[start:].lstrip()
        if len(html) > 200:
            if "</body>" not in html.lower():
                html += "\n</body>"
            if "</html>" not in html.lower():
                html += "\n</html>"
            return html

    return ""


# ── Streaming wrappers ────────────────────────────────────────────────────────

async def stream_generate(
    messages: list[dict],
    image: Optional[str] = None,
    max_tokens: Optional[int] = None,
) -> AsyncGenerator[str, None]:
    """
    Low-level passthrough: stream raw text chunks from the AI.
    Callers get plain text chunks (not SSE formatted).
    """
    if image:
        messages = inject_image(messages, image)
    kwargs = {}
    if max_tokens:
        kwargs["max_tokens"] = max_tokens
    async for chunk in _stream_ai(messages, **kwargs):
        yield chunk


async def stream_generate_with_hifi(
    messages: list[dict],
    image: Optional[str] = None,
    max_tokens: Optional[int] = None,
) -> tuple[AsyncGenerator[str, None], "asyncio.Future[str]"]:
    """
    Stream chunks AND collect the full text, then post-process hifi HTML.
    Returns (async_gen_of_chunks, collected_future).

    Usage pattern in routers:
        gen, fut = await stream_generate_with_hifi(messages)
        async for chunk in gen:
            yield sse(chunk)
        full_html = await fut
    """
    import asyncio
    collected: list[str] = []
    loop = asyncio.get_event_loop()
    fut: asyncio.Future[str] = loop.create_future()

    async def _inner():
        async for chunk in stream_generate(messages, image, max_tokens):
            collected.append(chunk)
            yield chunk
        raw = "".join(collected)
        html = extract_html(raw) or raw
        fut.set_result(postprocess_hifi(html))

    return _inner(), fut

import json
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from aiosqlite import Connection
from backend.database import get_db
from backend.models import ChatRequest
from backend.utils.ai_client import stream_ai
from backend.utils.hifi_postprocess import postprocess_hifi

router = APIRouter(prefix="/api/chat", tags=["chat"])


@router.post("")
async def chat(body: ChatRequest, db: Connection = Depends(get_db)):
    # verify project exists
    async with db.execute("SELECT id FROM projects WHERE id = ?", (body.project_id,)) as cur:
        if not await cur.fetchone():
            raise HTTPException(status_code=404, detail="Project not found")

    messages = list(body.messages)

    # inject image into last user message if provided (step 4 design adjustment mode)
    if body.image:
        for msg in reversed(messages):
            if msg.get("role") == "user":
                content = msg.get("content", "")
                if isinstance(content, str):
                    msg["content"] = [
                        {"type": "text", "text": content},
                        {"type": "image_url", "image_url": {"url": body.image}},
                    ]
                break

    is_step4 = body.step == 4

    async def event_stream():
        collected = []
        async for chunk in stream_ai(messages):
            collected.append(chunk)
            yield f"data: {json.dumps({'delta': chunk})}\n\n"

        full_response = "".join(collected)

        # step 4: extract HTML block and save to DB
        if is_step4:
            html_content = _extract_html(full_response)
            if html_content:
                html_content = postprocess_hifi(html_content)
                await db.execute(
                    """INSERT INTO step_data (project_id, step, data_type, content)
                       VALUES (?, 4, 'html', ?)
                       ON CONFLICT(project_id, step) DO UPDATE SET
                         data_type = 'html',
                         content   = excluded.content,
                         updated_at = CURRENT_TIMESTAMP""",
                    (body.project_id, html_content),
                )
                await db.commit()
                yield f"data: {json.dumps({'html_updated': True})}\n\n"

        yield f"data: {json.dumps({'done': True})}\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream")


def _extract_html(text: str) -> str:
    """Extract the first ```html ... ``` block from AI response."""
    import re
    m = re.search(r"```html\s*([\s\S]*?)```", text, re.IGNORECASE)
    if m:
        return m.group(1).strip()
    # fallback: if entire response looks like HTML
    stripped = text.strip()
    if stripped.startswith("<!DOCTYPE") or stripped.startswith("<html"):
        return stripped
    return ""

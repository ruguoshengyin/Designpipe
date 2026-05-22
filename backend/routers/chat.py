"""
Chat router — conversational AI endpoint for the ChatPanel.
Supports any step; step 4 also extracts + saves updated HTML.
"""
import json
from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from aiosqlite import Connection

from backend.database import get_db
from backend.models import ChatRequest
from backend.services import step_service, ai_service
from backend.services.project_service import project_exists, NotFoundError

router = APIRouter(prefix="/api/chat", tags=["chat"])


def _sse(data: dict) -> str:
    return f"data: {json.dumps(data)}\n\n"


@router.post("")
async def chat(body: ChatRequest, db: Connection = Depends(get_db)):
    if not await project_exists(body.project_id, db):
        raise NotFoundError("Project", body.project_id)

    messages = list(body.messages)
    is_hifi_step = body.step == 4

    async def event_stream():
        collected: list[str] = []

        async for chunk in ai_service.stream_generate(
            messages=messages,
            image=body.image,
        ):
            collected.append(chunk)
            yield _sse({"delta": chunk})

        full_response = "".join(collected)

        # For step 4: try to extract updated HTML and save it
        if is_hifi_step:
            html = ai_service.extract_html(full_response)
            if html:
                from backend.utils.hifi_postprocess import postprocess_hifi
                html = postprocess_hifi(html)
                await step_service.save_step(body.project_id, 4, "html", html, db)
                yield _sse({"html_updated": True})

        yield _sse({"done": True})

    return StreamingResponse(event_stream(), media_type="text/event-stream")

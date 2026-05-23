"""
Chat router — conversational AI endpoint for the ChatPanel.
"""
import json
import logging
from fastapi import APIRouter
from fastapi.responses import StreamingResponse

from backend.models import ChatRequest
from backend.services import step_service, ai_service
from backend.exceptions import NotFoundError
from backend.services.project_service import project_exists

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/chat", tags=["chat"])


def _sse(data: dict) -> str:
    return f"data: {json.dumps(data, ensure_ascii=False)}\n\n"


@router.post("")
async def chat(body: ChatRequest):
    """
    Opens its own DB connection inside the generator to survive the full
    SSE stream lifetime (same pattern as generate router).
    """
    async def event_stream():
        import aiosqlite
        from backend.database import DB_PATH
        async with aiosqlite.connect(DB_PATH) as db:
            db.row_factory = aiosqlite.Row

            if not await project_exists(body.project_id, db):
                yield _sse({"error": f"Project not found: {body.project_id}"})
                return

            messages = list(body.messages)
            is_hifi_step = body.step == 4
            max_tokens = body.max_tokens or None

            collected: list[str] = []
            async for chunk in ai_service.stream_generate(
                messages=messages,
                image=body.image,
                max_tokens=max_tokens,
            ):
                collected.append(chunk)
                yield _sse({"delta": chunk})

            full_response = "".join(collected)

            if is_hifi_step:
                html = ai_service.extract_html(full_response)
                if html:
                    from backend.utils.hifi_postprocess import postprocess_hifi
                    html = postprocess_hifi(html)
                    await step_service.save_step(body.project_id, 4, "html", html, db)
                    yield _sse({"html_updated": True})

            yield _sse({"done": True})

    return StreamingResponse(event_stream(), media_type="text/event-stream")

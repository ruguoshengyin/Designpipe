"""
Generate router — triggers AI generation for each pipeline step.
Delegates prompt building to prompts/, streaming to ai_service, persistence to step_service.
"""
import json
from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from aiosqlite import Connection

from backend.database import get_db
from backend.exceptions import BadRequestError
from backend.models import GenerateRequest
from backend.services import step_service, ai_service
from backend.services.project_service import get_project, update_project
from backend.prompts import (
    step1_research,
    step2_diagnose,
    step3_concept,
    step3_wireframe,
    step4_hifi,
    step5_handoff,
)

router = APIRouter(prefix="/api/generate", tags=["generate"])


def _sse(data: dict) -> str:
    return f"data: {json.dumps(data)}\n\n"


@router.post("")
async def generate(body: GenerateRequest, db: Connection = Depends(get_db)):
    project = await get_project(body.project_id, db)

    # ── Build messages for the requested step ─────────────────────────────────
    if body.step == 1:
        messages = step1_research.build_messages(project)
        data_type = "markdown"
        is_html = False

    elif body.step == 2:
        step1 = await step_service.get_step_content(body.project_id, 1, db)
        messages = step2_diagnose.build_messages(project, step1)
        data_type = "json"
        is_html = False

    elif body.step == 3:
        step2 = await step_service.get_step_content(body.project_id, 2, db)
        messages = step3_concept.build_messages(project, step2)
        data_type = "json"
        is_html = False

    elif body.step == 31:   # wireframe for a chosen direction
        direction_key = body.direction or "A"
        step3_json = await step_service.get_step_json(body.project_id, 3, db)
        messages = step3_wireframe.build_messages(project, step3_json, direction_key)
        data_type = "html"
        is_html = True

    elif body.step == 4:
        direction_key = body.direction or project.get("direction") or "A"
        step3_json = await step_service.get_step_json(body.project_id, 3, db)
        messages = step4_hifi.build_messages(project, step3_json, direction_key)
        data_type = "html"
        is_html = True

    elif body.step == 5:
        contents = {
            s: await step_service.get_step_content(body.project_id, s, db)
            for s in [1, 2, 3]
        }
        messages = step5_handoff.build_messages(project, {s: {"content": c} for s, c in contents.items()})
        data_type = "markdown"
        is_html = False

    else:
        raise BadRequestError(f"Invalid step: {body.step}")

    # ── Stream + persist ───────────────────────────────────────────────────────
    async def event_stream():
        collected: list[str] = []

        async for chunk in ai_service.stream_generate(
            messages=messages,
            image=body.image,
        ):
            collected.append(chunk)
            yield _sse({"delta": chunk})

        full_content = "".join(collected)

        # Post-process hi-fi HTML
        if is_html:
            extracted = ai_service.extract_html(full_content)
            if extracted:
                from backend.utils.hifi_postprocess import postprocess_hifi
                full_content = postprocess_hifi(extracted)

        # Persist to DB
        await step_service.save_step(body.project_id, body.step, data_type, full_content, db)

        # If direction was chosen for step 4, persist it on the project
        if body.step == 4 and body.direction:
            await update_project(body.project_id, {"direction": body.direction}, db)

        yield _sse({"done": True, "data_type": data_type})

    return StreamingResponse(event_stream(), media_type="text/event-stream")

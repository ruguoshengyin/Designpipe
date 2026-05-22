import json
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from aiosqlite import Connection
from backend.database import get_db
from backend.models import GenerateRequest
from backend.utils.ai_client import stream_ai
from backend.utils.hifi_postprocess import postprocess_hifi
from backend.prompts import (
    step1_research,
    step2_diagnose,
    step3_concept,
    step3_wireframe,
    step4_hifi,
    step5_handoff,
)

router = APIRouter(prefix="/api/generate", tags=["generate"])


async def _get_project(project_id: str, db: Connection) -> dict:
    async with db.execute(
        "SELECT id, product, target_user, scenario, direction FROM projects WHERE id = ?",
        (project_id,),
    ) as cur:
        row = await cur.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Project not found")
    return {"id": row[0], "product": row[1], "target_user": row[2], "scenario": row[3], "direction": row[4]}


async def _get_step_content(project_id: str, step: int, db: Connection) -> str:
    async with db.execute(
        "SELECT content FROM step_data WHERE project_id = ? AND step = ?",
        (project_id, step),
    ) as cur:
        row = await cur.fetchone()
    return row[0] if row else ""


async def _get_step_json(project_id: str, step: int, db: Connection) -> dict:
    content = await _get_step_content(project_id, step, db)
    if not content:
        return {}
    try:
        return json.loads(content)
    except Exception:
        return {}


async def _save_step(project_id: str, step: int, data_type: str, content: str, db: Connection):
    await db.execute(
        """INSERT INTO step_data (project_id, step, data_type, content)
           VALUES (?, ?, ?, ?)
           ON CONFLICT(project_id, step) DO UPDATE SET
             data_type = excluded.data_type,
             content   = excluded.content,
             updated_at = CURRENT_TIMESTAMP""",
        (project_id, step, data_type, content),
    )
    await db.commit()


@router.post("")
async def generate(body: GenerateRequest, db: Connection = Depends(get_db)):
    project = await _get_project(body.project_id, db)

    if body.step == 1:
        messages = step1_research.build_messages(project)
        data_type = "markdown"

    elif body.step == 2:
        step1_content = await _get_step_content(body.project_id, 1, db)
        messages = step2_diagnose.build_messages(project, step1_content)
        data_type = "json"

    elif body.step == 3:
        step2_content = await _get_step_content(body.project_id, 2, db)
        messages = step3_concept.build_messages(project, step2_content)
        data_type = "json"

    elif body.step == 31:  # wireframe for a direction
        direction_key = body.direction or "A"
        step3_json = await _get_step_json(body.project_id, 3, db)
        messages = step3_wireframe.build_messages(project, step3_json, direction_key)
        data_type = "html"

    elif body.step == 4:
        direction_key = body.direction or project.get("direction") or "A"
        step3_json = await _get_step_json(body.project_id, 3, db)
        messages = step4_hifi.build_messages(project, step3_json, direction_key)
        data_type = "html"

    elif body.step == 5:
        all_steps = {}
        for s in [1, 2, 3]:
            content = await _get_step_content(body.project_id, s, db)
            all_steps[s] = {"content": content}
        messages = step5_handoff.build_messages(project, all_steps)
        data_type = "markdown"

    else:
        raise HTTPException(status_code=400, detail=f"Invalid step: {body.step}")

    # add image to last user message if provided (for step 4 with reference image)
    if body.image:
        for msg in reversed(messages):
            if msg["role"] == "user":
                if isinstance(msg["content"], str):
                    msg["content"] = [
                        {"type": "text", "text": msg["content"]},
                        {"type": "image_url", "image_url": {"url": body.image}},
                    ]
                break

    async def event_stream():
        collected = []
        async for chunk in stream_ai(messages):
            collected.append(chunk)
            yield f"data: {json.dumps({'delta': chunk})}\n\n"

        full_content = "".join(collected)

        # post-process hi-fi HTML
        if data_type == "html" and body.step == 4:
            full_content = postprocess_hifi(full_content)

        # persist to DB
        await _save_step(body.project_id, body.step, data_type, full_content, db)

        # if step 4 direction chosen, update project.direction
        if body.step == 4 and body.direction:
            await db.execute(
                "UPDATE projects SET direction = ? WHERE id = ?",
                (body.direction, body.project_id),
            )
            await db.commit()

        yield f"data: {json.dumps({'done': True, 'data_type': data_type})}\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream")

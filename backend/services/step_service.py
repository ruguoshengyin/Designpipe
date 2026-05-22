"""
Step data CRUD — read/write per-step AI-generated content.
"""
import json
from typing import Optional
from aiosqlite import Connection

from backend.exceptions import NotFoundError
from backend.services.project_service import project_exists

_UPSERT_SQL = """
INSERT INTO step_data (project_id, step, data_type, content)
VALUES (?, ?, ?, ?)
ON CONFLICT(project_id, step) DO UPDATE SET
  data_type  = excluded.data_type,
  content    = excluded.content,
  updated_at = CURRENT_TIMESTAMP
"""


# ── public API ────────────────────────────────────────────────────────────────

async def list_steps(project_id: str, db: Connection) -> dict:
    """Return all step rows for a project as {step_num: {...}} dict."""
    if not await project_exists(project_id, db):
        raise NotFoundError("Project", project_id)

    async with db.execute(
        "SELECT step, data_type, content, updated_at FROM step_data WHERE project_id = ? ORDER BY step",
        (project_id,),
    ) as cur:
        rows = await cur.fetchall()

    return {
        r[0]: {"step": r[0], "data_type": r[1], "content": r[2], "updated_at": r[3]}
        for r in rows
    }


async def get_step(project_id: str, step: int, db: Connection) -> dict:
    async with db.execute(
        "SELECT step, data_type, content, updated_at FROM step_data WHERE project_id = ? AND step = ?",
        (project_id, step),
    ) as cur:
        row = await cur.fetchone()
    if not row:
        raise NotFoundError(f"Step {step} data for project", project_id)
    return {"step": row[0], "data_type": row[1], "content": row[2], "updated_at": row[3]}


async def get_step_content(project_id: str, step: int, db: Connection) -> str:
    """Return raw content string, or empty string if not found."""
    async with db.execute(
        "SELECT content FROM step_data WHERE project_id = ? AND step = ?",
        (project_id, step),
    ) as cur:
        row = await cur.fetchone()
    return row[0] if row else ""


async def get_step_json(project_id: str, step: int, db: Connection) -> dict:
    """Return parsed JSON dict for a step, or empty dict if missing/invalid."""
    content = await get_step_content(project_id, step, db)
    if not content:
        return {}
    try:
        return json.loads(content)
    except json.JSONDecodeError:
        return {}


async def save_step(
    project_id: str,
    step: int,
    data_type: str,
    content: str,
    db: Connection,
) -> None:
    """Upsert step content."""
    await db.execute(_UPSERT_SQL, (project_id, step, data_type, content))
    await db.commit()

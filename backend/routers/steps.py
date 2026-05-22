from fastapi import APIRouter, Depends, HTTPException
from aiosqlite import Connection
from backend.database import get_db
from backend.models import StepSaveRequest

router = APIRouter(prefix="/api/projects/{project_id}/steps", tags=["steps"])


@router.get("")
async def list_steps(project_id: str, db: Connection = Depends(get_db)):
    async with db.execute("SELECT id FROM projects WHERE id = ?", (project_id,)) as cur:
        if not await cur.fetchone():
            raise HTTPException(status_code=404, detail="Project not found")

    async with db.execute(
        "SELECT step, data_type, content, updated_at FROM step_data WHERE project_id = ? ORDER BY step",
        (project_id,),
    ) as cur:
        rows = await cur.fetchall()

    return {
        r[0]: {"step": r[0], "data_type": r[1], "content": r[2], "updated_at": r[3]}
        for r in rows
    }


@router.get("/{step}")
async def get_step(project_id: str, step: int, db: Connection = Depends(get_db)):
    async with db.execute(
        "SELECT step, data_type, content, updated_at FROM step_data WHERE project_id = ? AND step = ?",
        (project_id, step),
    ) as cur:
        row = await cur.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Step data not found")
    return {"step": row[0], "data_type": row[1], "content": row[2], "updated_at": row[3]}


@router.patch("/{step}")
async def save_step(project_id: str, step: int, body: StepSaveRequest, db: Connection = Depends(get_db)):
    async with db.execute("SELECT id FROM projects WHERE id = ?", (project_id,)) as cur:
        if not await cur.fetchone():
            raise HTTPException(status_code=404, detail="Project not found")

    await db.execute(
        """INSERT INTO step_data (project_id, step, data_type, content)
           VALUES (?, ?, ?, ?)
           ON CONFLICT(project_id, step) DO UPDATE SET
             data_type = excluded.data_type,
             content   = excluded.content,
             updated_at = CURRENT_TIMESTAMP""",
        (project_id, step, body.data_type, body.content),
    )
    await db.commit()
    return {"ok": True}

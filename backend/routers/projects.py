import uuid
from fastapi import APIRouter, Depends, HTTPException
from aiosqlite import Connection
from backend.database import get_db
from backend.models import ProjectCreate, ProjectUpdate

router = APIRouter(prefix="/api/projects", tags=["projects"])


@router.get("")
async def list_projects(db: Connection = Depends(get_db)):
    async with db.execute(
        "SELECT id, product, target_user, scenario, direction, created_at FROM projects ORDER BY created_at DESC"
    ) as cur:
        rows = await cur.fetchall()
    return [
        {
            "id": r[0],
            "product": r[1],
            "target_user": r[2],
            "scenario": r[3],
            "direction": r[4],
            "created_at": r[5],
        }
        for r in rows
    ]


@router.post("", status_code=201)
async def create_project(body: ProjectCreate, db: Connection = Depends(get_db)):
    pid = str(uuid.uuid4())
    await db.execute(
        "INSERT INTO projects (id, product, target_user, scenario) VALUES (?, ?, ?, ?)",
        (pid, body.product, body.target_user, body.scenario),
    )
    await db.commit()
    return {"id": pid, "product": body.product, "target_user": body.target_user, "scenario": body.scenario}


@router.get("/{project_id}")
async def get_project(project_id: str, db: Connection = Depends(get_db)):
    async with db.execute(
        "SELECT id, product, target_user, scenario, direction, created_at FROM projects WHERE id = ?",
        (project_id,),
    ) as cur:
        row = await cur.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Project not found")
    return {
        "id": row[0],
        "product": row[1],
        "target_user": row[2],
        "scenario": row[3],
        "direction": row[4],
        "created_at": row[5],
    }


@router.patch("/{project_id}")
async def update_project(project_id: str, body: ProjectUpdate, db: Connection = Depends(get_db)):
    async with db.execute("SELECT id FROM projects WHERE id = ?", (project_id,)) as cur:
        if not await cur.fetchone():
            raise HTTPException(status_code=404, detail="Project not found")

    updates = body.model_dump(exclude_none=True)
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")

    set_clause = ", ".join(f"{k} = ?" for k in updates)
    values = list(updates.values()) + [project_id]
    await db.execute(f"UPDATE projects SET {set_clause} WHERE id = ?", values)
    await db.commit()
    return {"ok": True}


@router.delete("/{project_id}", status_code=204)
async def delete_project(project_id: str, db: Connection = Depends(get_db)):
    await db.execute("DELETE FROM step_data WHERE project_id = ?", (project_id,))
    await db.execute("DELETE FROM projects WHERE id = ?", (project_id,))
    await db.commit()

"""
Project CRUD — all database interactions for the projects table.
Routers delegate here; no SQL should appear in router files.
"""
import uuid
from typing import Optional
from aiosqlite import Connection

from backend.exceptions import NotFoundError, BadRequestError


# ── helpers ───────────────────────────────────────────────────────────────────

def _row_to_project(row) -> dict:
    return {
        "id": row[0],
        "product": row[1],
        "target_user": row[2],
        "scenario": row[3],
        "direction": row[4],
        "created_at": row[5],
        "updated_at": row[6],
    }


# ── public API ────────────────────────────────────────────────────────────────

async def list_projects(db: Connection) -> list[dict]:
    async with db.execute(
        """SELECT id, product, target_user, scenario, direction, created_at, updated_at
           FROM projects ORDER BY created_at DESC"""
    ) as cur:
        rows = await cur.fetchall()
    return [_row_to_project(r) for r in rows]


async def get_project(project_id: str, db: Connection) -> dict:
    async with db.execute(
        """SELECT id, product, target_user, scenario, direction, created_at, updated_at
           FROM projects WHERE id = ?""",
        (project_id,),
    ) as cur:
        row = await cur.fetchone()
    if not row:
        raise NotFoundError("Project", project_id)
    return _row_to_project(row)


async def create_project(product: str, target_user: str, scenario: str, db: Connection) -> dict:
    pid = str(uuid.uuid4())
    await db.execute(
        "INSERT INTO projects (id, product, target_user, scenario) VALUES (?, ?, ?, ?)",
        (pid, product, target_user, scenario),
    )
    await db.commit()
    return {"id": pid, "product": product, "target_user": target_user, "scenario": scenario}


async def update_project(project_id: str, updates: dict, db: Connection) -> None:
    """Apply a partial update dict to a project row."""
    # Verify exists first
    await get_project(project_id, db)

    if not updates:
        raise BadRequestError("No fields to update")

    allowed = {"product", "target_user", "scenario", "direction"}
    filtered = {k: v for k, v in updates.items() if k in allowed and v is not None}
    if not filtered:
        raise BadRequestError("No valid fields to update")

    set_clause = ", ".join(f"{k} = ?" for k in filtered)
    values = list(filtered.values()) + [project_id]
    await db.execute(
        f"UPDATE projects SET {set_clause}, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
        values,
    )
    await db.commit()


async def delete_project(project_id: str, db: Connection) -> None:
    await db.execute("DELETE FROM step_data WHERE project_id = ?", (project_id,))
    await db.execute("DELETE FROM projects WHERE id = ?", (project_id,))
    await db.commit()


async def project_exists(project_id: str, db: Connection) -> bool:
    async with db.execute("SELECT 1 FROM projects WHERE id = ?", (project_id,)) as cur:
        return await cur.fetchone() is not None

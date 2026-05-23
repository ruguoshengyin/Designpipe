"""
Project CRUD — all database interactions for the projects table.
"""
import json
import uuid
from aiosqlite import Connection

from backend.exceptions import NotFoundError, BadRequestError

_SELECT = """
SELECT id, product, target_user, scenario, direction,
       title, style, cover, current_step, max_step,
       status, tag, collaborators, page_type,
       created_at, updated_at
FROM projects
"""

_ALLOWED_UPDATE = {
    "product", "target_user", "scenario", "direction",
    "title", "style", "cover", "current_step", "max_step",
    "status", "tag", "collaborators", "page_type", "uploaded_image",
}


def _row_to_project(row) -> dict:
    collaborators = row["collaborators"] or "[]"
    try:
        collaborators = json.loads(collaborators)
    except Exception:
        collaborators = []
    return {
        "id": row["id"],
        "product": row["product"],
        "target_user": row["target_user"],
        "scenario": row["scenario"],
        "direction": row["direction"],
        "title": row["title"],
        "style": row["style"],
        "cover": row["cover"],
        "current_step": row["current_step"],
        "max_step": row["max_step"],
        "status": row["status"],
        "tag": row["tag"],
        "collaborators": collaborators,
        "page_type": row["page_type"],
        "created_at": row["created_at"],
        "updated_at": row["updated_at"],
    }


async def list_projects(db: Connection) -> list[dict]:
    async with db.execute(_SELECT + "ORDER BY created_at DESC") as cur:
        rows = await cur.fetchall()
    return [_row_to_project(r) for r in rows]


async def get_project(project_id: str, db: Connection) -> dict:
    async with db.execute(_SELECT + "WHERE id = ?", (project_id,)) as cur:
        row = await cur.fetchone()
    if not row:
        raise NotFoundError("Project", project_id)
    return _row_to_project(row)


async def create_project(data: dict, db: Connection) -> dict:
    pid = str(uuid.uuid4())
    collaborators = json.dumps(data.get("collaborators", []))
    await db.execute(
        """INSERT INTO projects
           (id, product, target_user, scenario, title, style, cover, status, tag, collaborators)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
        (
            pid,
            data.get("product", ""),
            data.get("target_user", ""),
            data.get("scenario", ""),
            data.get("title", "新设计项目"),
            data.get("style", "通用风格"),
            data.get("cover", "mobile"),
            data.get("status", "草稿"),
            data.get("tag"),
            collaborators,
        ),
    )
    await db.commit()
    return await get_project(pid, db)


async def update_project(project_id: str, updates: dict, db: Connection) -> None:
    await get_project(project_id, db)   # raises 404 if not found

    filtered = {k: v for k, v in updates.items() if k in _ALLOWED_UPDATE and v is not None}
    if not filtered:
        raise BadRequestError("No valid fields to update")

    # Serialize list fields
    if "collaborators" in filtered and isinstance(filtered["collaborators"], list):
        filtered["collaborators"] = json.dumps(filtered["collaborators"])

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

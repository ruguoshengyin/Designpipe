"""
Steps router — HTTP only, delegates to step_service.
"""
from fastapi import APIRouter, Depends
from aiosqlite import Connection

from backend.database import get_db
from backend.models import StepSaveRequest
from backend.services import step_service

router = APIRouter(prefix="/api/projects/{project_id}/steps", tags=["steps"])


@router.get("")
async def list_steps(project_id: str, db: Connection = Depends(get_db)):
    return await step_service.list_steps(project_id, db)


@router.get("/{step}")
async def get_step(project_id: str, step: int, db: Connection = Depends(get_db)):
    return await step_service.get_step(project_id, step, db)


@router.patch("/{step}")
async def save_step(
    project_id: str,
    step: int,
    body: StepSaveRequest,
    db: Connection = Depends(get_db),
):
    await step_service.save_step(
        project_id=project_id,
        step=step,
        data_type=body.data_type,
        content=body.content,
        db=db,
    )
    return {"ok": True}

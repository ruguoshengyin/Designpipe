"""
Projects router — HTTP only, delegates all logic to project_service.
"""
from fastapi import APIRouter, Depends
from aiosqlite import Connection

from backend.database import get_db
from backend.models import ProjectCreate, ProjectUpdate
from backend.services import project_service

router = APIRouter(prefix="/api/projects", tags=["projects"])


@router.get("")
async def list_projects(db: Connection = Depends(get_db)):
    return await project_service.list_projects(db)


@router.post("", status_code=201)
async def create_project(body: ProjectCreate, db: Connection = Depends(get_db)):
    return await project_service.create_project(
        product=body.product,
        target_user=body.target_user,
        scenario=body.scenario,
        db=db,
    )


@router.get("/{project_id}")
async def get_project(project_id: str, db: Connection = Depends(get_db)):
    return await project_service.get_project(project_id, db)


@router.patch("/{project_id}")
async def update_project(project_id: str, body: ProjectUpdate, db: Connection = Depends(get_db)):
    await project_service.update_project(
        project_id=project_id,
        updates=body.model_dump(exclude_none=True),
        db=db,
    )
    return {"ok": True}


@router.delete("/{project_id}", status_code=204)
async def delete_project(project_id: str, db: Connection = Depends(get_db)):
    await project_service.delete_project(project_id, db)

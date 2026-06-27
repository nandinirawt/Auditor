"""Project routes."""
from uuid import UUID

from fastapi import APIRouter, status

from app.api.deps import ActiveUser, DBSession, PageParams
from app.schemas.common import Message, Page
from app.schemas.project import ProjectCreate, ProjectRead, ProjectUpdate
from app.services import project_service

router = APIRouter(prefix="/projects", tags=["projects"])


@router.post("", response_model=ProjectRead, status_code=status.HTTP_201_CREATED)
async def create_project(data: ProjectCreate, db: DBSession, user: ActiveUser):
    return await project_service.create_project(db, user, data)


@router.get("", response_model=Page[ProjectRead])
async def list_projects(db: DBSession, user: ActiveUser, pagination: PageParams):
    items, total = await project_service.list_projects(
        db, user, pagination.offset, pagination.limit
    )
    return Page.create(items=items, total=total, page=pagination.page, size=pagination.size)


@router.get("/{project_id}", response_model=ProjectRead)
async def get_project(project_id: UUID, db: DBSession, user: ActiveUser):
    return await project_service.get_project(db, user, project_id)


@router.patch("/{project_id}", response_model=ProjectRead)
async def update_project(project_id: UUID, data: ProjectUpdate, db: DBSession, user: ActiveUser):
    return await project_service.update_project(db, user, project_id, data)


@router.delete("/{project_id}", response_model=Message)
async def delete_project(project_id: UUID, db: DBSession, user: ActiveUser):
    await project_service.delete_project(db, user, project_id)
    return Message(message="Project deleted")

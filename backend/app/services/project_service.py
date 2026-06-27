"""Project CRUD with ownership enforcement."""
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundError
from app.models.project import Project
from app.models.user import User
from app.schemas.project import ProjectCreate, ProjectUpdate
from app.utils.url import extract_domain


async def create_project(db: AsyncSession, user: User, data: ProjectCreate) -> Project:
    project = Project(
        user_id=user.id,
        name=data.name,
        url=str(data.url),
        domain=extract_domain(str(data.url)),
        category=data.category,
        description=data.description,
    )
    db.add(project)
    await db.commit()
    await db.refresh(project)
    return project


async def list_projects(
    db: AsyncSession, user: User, offset: int, limit: int
) -> tuple[list[Project], int]:
    total = await db.scalar(
        select(func.count()).select_from(Project).where(Project.user_id == user.id)
    )
    result = await db.execute(
        select(Project)
        .where(Project.user_id == user.id)
        .order_by(Project.created_at.desc())
        .offset(offset)
        .limit(limit)
    )
    return list(result.scalars().all()), int(total or 0)


async def get_project(db: AsyncSession, user: User, project_id: UUID) -> Project:
    result = await db.execute(
        select(Project).where(Project.id == project_id, Project.user_id == user.id)
    )
    project = result.scalar_one_or_none()
    if project is None:
        raise NotFoundError("Project not found")
    return project


async def update_project(
    db: AsyncSession, user: User, project_id: UUID, data: ProjectUpdate
) -> Project:
    project = await get_project(db, user, project_id)
    if data.name is not None:
        project.name = data.name
    if data.url is not None:
        project.url = str(data.url)
        project.domain = extract_domain(str(data.url))
    if data.category is not None:
        project.category = data.category
    if data.description is not None:
        project.description = data.description
    await db.commit()
    await db.refresh(project)
    return project


async def delete_project(db: AsyncSession, user: User, project_id: UUID) -> None:
    project = await get_project(db, user, project_id)
    await db.delete(project)
    await db.commit()

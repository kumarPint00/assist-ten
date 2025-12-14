"""Notification endpoints for users and admins."""
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc

from app.db.session import get_db
from app.db.models import Notification
from app.models.schemas import NotificationCreate, NotificationResponse, NotificationMarkRead
from app.core.dependencies import get_current_user

router = APIRouter(prefix="/api/v1/notifications", tags=["notifications"])


@router.get("/", response_model=List[NotificationResponse])
async def get_my_notifications(current_user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    stmt = select(Notification).where(Notification.user_id == current_user.id).order_by(desc(Notification.created_at)).limit(200)
    result = await db.execute(stmt)
    rows = result.scalars().all()
    return [NotificationResponse.from_orm(r) for r in rows]


@router.patch("/{notification_id}/read")
async def mark_read(notification_id: str, payload: NotificationMarkRead, current_user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Notification).where(Notification.notification_id == notification_id, Notification.user_id == current_user.id))
    notif = result.scalar_one_or_none()
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")
    notif.is_read = payload.is_read
    notif.read_at = notif.read_at or None
    await db.commit()
    return {"message": "Updated"}


@router.delete("/{notification_id}")
async def archive_notification(notification_id: str, current_user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Notification).where(Notification.notification_id == notification_id, Notification.user_id == current_user.id))
    notif = result.scalar_one_or_none()
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")
    notif.is_archived = True
    await db.commit()
    return {"message": "Archived"}


@router.post("/", status_code=201)
async def create_notification(payload: NotificationCreate, current_user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    # Only admin or system services should create notifications
    if getattr(current_user, 'role', '') not in ("admin", "superadmin"):
        raise HTTPException(status_code=403, detail="Admin privileges required to create notifications")
    notif = Notification(
        user_id=payload.user_id,
        notification_type=payload.notification_type,
        title=payload.title,
        message=payload.message,
        related_entity_type=payload.related_entity_type,
        related_entity_id=payload.related_entity_id,
        action_url=payload.action_url,
        priority=payload.priority,
    )
    db.add(notif)
    await db.commit()
    await db.refresh(notif)
    return NotificationResponse.from_orm(notif)

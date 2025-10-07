from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List
from jose import JWTError, jwt
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from ...db.session import get_db
from ...models.message import Message
from ...schemas.message import MessageCreate, MessageOut, MessageWithSender
from ...models.user import User
from ...core.config import settings
from ..v1.users import get_current_user
from ...websocket.manager import manager


router = APIRouter()
security = HTTPBearer(auto_error=False)


@router.get("/", response_model=List[MessageWithSender])
def list_messages(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # fetch last 100 messages where current user is sender or recipient
    messages = (
        db.query(Message)
        .filter((Message.sender_id == current_user.id) | (Message.recipient_id == current_user.id))
        .order_by(Message.id.desc())
        .limit(100)
        .all()
    )
    # Ajoute le username du sender ET du destinataire dans chaque message
    result = []
    for msg in messages:
        msg_dict = {
            "id": msg.id,
            "recipient_id": msg.recipient_id,
            "recipient_username": msg.recipient.username if msg.recipient else None,
            "content": msg.content,
            "created_at": msg.created_at,
            "sender_id": msg.sender_id,
            "sender_username": msg.sender.username if msg.sender else None,
        }
        result.append(msg_dict)
    return result


@router.post("/", response_model=MessageOut)
def create_message(payload: MessageCreate, background_tasks: BackgroundTasks, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    msg = Message(sender_id=current_user.id, recipient_id=payload.recipient_id, content=payload.content)
    db.add(msg)
    db.commit()
    db.refresh(msg)
    # publish to websocket channel for realtime delivery (background task)
    background_tasks.add_task(
        manager.publish,
        "messages",
        {
            "recipient_id": payload.recipient_id,
            "content": payload.content,
            "sender_id": current_user.id,
            "created_at": msg.created_at.isoformat() if getattr(msg, "created_at", None) else None,
        },
    )
    return msg



from pydantic import BaseModel
from datetime import datetime


class MessageBase(BaseModel):
    recipient_id: int
    content: str


class MessageCreate(MessageBase):
    pass


class MessageOut(MessageBase):
    id: int
    sender_id: int
    created_at: datetime | None = None

    class Config:
        from_attributes = True



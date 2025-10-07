from pydantic import BaseModel
from datetime import datetime

class MessageWithSender(BaseModel):
    id: int
    recipient_id: int
    recipient_username: str | None = None
    sender_id: int
    sender_username: str | None = None
    content: str
    created_at: datetime | None = None

    class Config:
        orm_mode = True
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



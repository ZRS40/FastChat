from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from .api.v1 import auth, messages, users
from .core.config import settings
from .websocket.manager import manager
import asyncio
from .db.session import engine, Base
from sqlalchemy import text
import time


app = FastAPI(title="FastChat")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/healthz")
def healthcheck():
    return {"status": "ok"}


app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(messages.router, prefix="/api/v1/messages", tags=["messages"])
app.include_router(users.router, prefix="/api/v1/users", tags=["users"])


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket, user_id: int):
    await manager.connect(user_id, websocket)
    try:
        while True:
            data = await websocket.receive_json()
            # Echo back or forward to recipient via Redis pub/sub
            recipient_id = data.get("recipient_id")
            if recipient_id:
                await manager.publish("messages", {"recipient_id": recipient_id, "content": data.get("content", "")})
    except WebSocketDisconnect:
        manager.disconnect(user_id)


@app.on_event("startup")
async def on_startup() -> None:
    # Start background subscriber for Redis pub/sub
    asyncio.create_task(manager.subscribe("messages"))
    # Ensure tables exist (simple dev bootstrap)
    max_wait_seconds = 30
    start = time.time()
    while True:
        try:
            with engine.connect() as conn:
                conn.execute(text("SELECT 1"))
            Base.metadata.create_all(bind=engine)
            # Ensure missing columns exist for dev without migrations
            with engine.begin() as conn:
                conn.execute(text(
                    """
                    ALTER TABLE IF EXISTS messages
                    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
                    """
                ))
            break
        except Exception:
            if time.time() - start > max_wait_seconds:
                break
            time.sleep(1)





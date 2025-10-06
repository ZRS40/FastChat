import json
from typing import Dict

from fastapi import WebSocket

from ..core.config import settings
from redis.asyncio import Redis


class ConnectionManager:
    def __init__(self) -> None:
        self.active_connections: Dict[int, WebSocket] = {}
        self.redis: Redis | None = None

    async def connect(self, user_id: int, websocket: WebSocket):
        await websocket.accept()
        self.active_connections[user_id] = websocket
        if not self.redis:
            self.redis = Redis.from_url(settings.redis_url)

    def disconnect(self, user_id: int):
        self.active_connections.pop(user_id, None)

    async def send_personal_message(self, user_id: int, message: dict):
        ws = self.active_connections.get(user_id)
        if ws:
            await ws.send_json(message)

    async def publish(self, channel: str, message: dict):
        if not self.redis:
            self.redis = Redis.from_url(settings.redis_url)
        await self.redis.publish(channel, json.dumps(message))

    async def subscribe(self, channel: str):
        if not self.redis:
            self.redis = Redis.from_url(settings.redis_url)
        async with self.redis.pubsub() as pubsub:
            await pubsub.subscribe(channel)
            async for msg in pubsub.listen():
                if msg.get("type") == "message":
                    raw = msg.get("data")
                    try:
                        data = json.loads(raw.decode() if isinstance(raw, (bytes, bytearray)) else raw)
                    except Exception:
                        continue
                    recipient_id = data.get("recipient_id")
                    if recipient_id:
                        await self.send_personal_message(recipient_id, data)


manager = ConnectionManager()



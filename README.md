FastChat

Minimal real-time chat app scaffold.

Run (Dev)

1. Go to `infra/` and start the stack:

```bash
docker compose up --build
```

- Backend API: http://localhost:8000/docs
- Frontend: http://localhost:3000

2. Electron (optional):

```bash
cd frontend/electron && npm install && npm run dev
```

Notes

- Env in `infra/env.dev` is used for reference; docker-compose sets the same variables.
- WebSocket endpoint is expected at `ws://localhost:8000/ws?user_id=<id>` (to be added).



import os
from pydantic import BaseModel


class Settings(BaseModel):
    app_name: str = "FastChat"
    database_url: str = os.getenv(
        "DATABASE_URL",
        "postgresql+psycopg2://fastchat:secret@localhost:5432/fastchat",
    )
    redis_url: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    jwt_secret: str = os.getenv("JWT_SECRET", "devsecret")
    jwt_algorithm: str = os.getenv("JWT_ALG", "HS256")
    access_token_exp_minutes: int = int(os.getenv("ACCESS_TOKEN_EXP_MIN", "30"))
    refresh_token_exp_minutes: int = int(os.getenv("REFRESH_TOKEN_EXP_MIN", "43200"))


settings = Settings()



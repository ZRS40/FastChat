from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from jose import jwt, JWTError
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from ...db.session import get_db
from ...models.user import User
from ...schemas.user import UserOut
from ...core.config import settings
from ..v1.auth import get_password_hash, verify_password


router = APIRouter()
security = HTTPBearer(auto_error=False)


def get_current_user(
    creds: HTTPAuthorizationCredentials | None = Depends(security),
    db: Session = Depends(get_db),
) -> User:
    if not creds:
        raise HTTPException(status_code=401, detail="Not authenticated")
    token = creds.credentials
    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
        sub = payload.get("sub")
        if not sub:
            raise HTTPException(status_code=401, detail="Invalid token")
        user = db.get(User, int(sub))
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")


@router.get("/", response_model=List[UserOut])
def list_users(db: Session = Depends(get_db)):
    return db.query(User).limit(50).all()


@router.get("/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user


class ProfileUpdatePayload:
    username: str | None = None


@router.put("/me")
def update_me(payload: dict, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    username = payload.get("username")
    if username:
        current_user.username = username
    db.add(current_user)
    db.commit()
    db.refresh(current_user)
    return {"status": "ok"}


@router.post("/me/change-password")
def change_password(payload: dict, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    old_password = payload.get("old_password")
    new_password = payload.get("new_password")
    if not old_password or not new_password:
        raise HTTPException(status_code=400, detail="Missing passwords")
    if not verify_password(old_password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="Invalid current password")
    current_user.password_hash = get_password_hash(new_password)
    db.add(current_user)
    db.commit()
    return {"status": "ok"}



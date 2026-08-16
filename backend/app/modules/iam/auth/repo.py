import uuid
from datetime import datetime

from sqlmodel import Session, select

from app.modules.iam.auth.models import RefreshToken


def create(
    *,
    session: Session,
    user_id: uuid.UUID,
    token_hash: str,
    expires_at: datetime,
) -> RefreshToken:
    rt = RefreshToken(user_id=user_id, token_hash=token_hash, expires_at=expires_at)
    session.add(rt)
    session.commit()
    session.refresh(rt)
    return rt


def get_by_hash(*, session: Session, token_hash: str) -> RefreshToken | None:
    statement = select(RefreshToken).where(RefreshToken.token_hash == token_hash)
    return session.exec(statement).first()


def delete(*, session: Session, refresh_token: RefreshToken) -> None:
    session.delete(refresh_token)
    session.commit()

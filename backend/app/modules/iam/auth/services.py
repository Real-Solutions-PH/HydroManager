import uuid
from datetime import datetime, timedelta, timezone

from fastapi import HTTPException
from sqlmodel import Session

from app.core import security
from app.core.config import settings
from app.modules.iam.auth import repo as refresh_repo
from app.modules.iam.auth.schema import NewPassword, Token
from app.modules.iam.auth.utils import (
    generate_password_reset_token,
    generate_reset_password_email,
    verify_password_reset_token,
)
from app.modules.iam.users import repo as user_repo
from app.shared.utils.email import send_email


def _issue_tokens(*, session: Session, user_id: uuid.UUID) -> Token:
    """Mint a fresh access token and a new DB-backed refresh token."""
    access_token = security.create_access_token(
        user_id, expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    refresh_plain = security.generate_refresh_token()
    refresh_repo.create(
        session=session,
        user_id=user_id,
        token_hash=security.hash_token(refresh_plain),
        expires_at=datetime.now(timezone.utc)
        + timedelta(minutes=settings.REFRESH_TOKEN_EXPIRE_MINUTES),
    )
    return Token(access_token=access_token, refresh_token=refresh_plain)


def login(*, session: Session, email: str, password: str) -> Token:
    user = user_repo.authenticate(session=session, email=email, password=password)
    if not user:
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return _issue_tokens(session=session, user_id=user.id)


def refresh(*, session: Session, refresh_token: str) -> Token:
    row = refresh_repo.get_by_hash(
        session=session, token_hash=security.hash_token(refresh_token)
    )
    if row is None:
        raise HTTPException(status_code=401, detail="Invalid refresh token")
    if row.expires_at < datetime.now(timezone.utc):
        refresh_repo.delete(session=session, refresh_token=row)
        raise HTTPException(status_code=401, detail="Invalid refresh token")
    # Rotate: the presented token is single-use. Delete it, then issue a new
    # pair. A replay of this same token afterward finds no row -> 401.
    # ponytail: no reuse-detection breach response (revoke-all-on-replay);
    # upgrade path is a revoked_at column + family tracking if that's needed.
    user_id = row.user_id
    refresh_repo.delete(session=session, refresh_token=row)
    return _issue_tokens(session=session, user_id=user_id)


def logout(*, session: Session, refresh_token: str) -> None:
    row = refresh_repo.get_by_hash(
        session=session, token_hash=security.hash_token(refresh_token)
    )
    if row is not None:
        refresh_repo.delete(session=session, refresh_token=row)


def recover_password(*, session: Session, email: str) -> None:
    user = user_repo.get_by_email(session=session, email=email)
    if user:
        password_reset_token = generate_password_reset_token(email=email)
        email_data = generate_reset_password_email(
            email_to=user.email, email=email, token=password_reset_token
        )
        send_email(
            email_to=user.email,
            subject=email_data.subject,
            html_content=email_data.html_content,
        )


def reset_password(*, session: Session, body: NewPassword) -> None:
    email = verify_password_reset_token(token=body.token)
    if not email:
        raise HTTPException(status_code=400, detail="Invalid token")
    user = user_repo.get_by_email(session=session, email=email)
    if not user:
        raise HTTPException(status_code=400, detail="Invalid token")
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    hashed = security.get_password_hash(body.new_password)
    user_repo.update(
        session=session, user=user, update_data={"hashed_password": hashed}
    )

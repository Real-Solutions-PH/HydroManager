from datetime import datetime, timedelta, timezone

from fastapi.testclient import TestClient
from sqlmodel import Session

from app.core import security
from app.core.config import settings
from app.modules.iam.auth.models import RefreshToken
from app.modules.iam.users import repo as user_repo


def _login(client: TestClient) -> dict:
    r = client.post(
        f"{settings.API_V1_STR}/login/access-token",
        data={
            "username": settings.FIRST_SUPERUSER,
            "password": settings.FIRST_SUPERUSER_PASSWORD,
        },
    )
    assert r.status_code == 200
    return r.json()


def test_invalid_access_token_returns_401(client: TestClient) -> None:
    r = client.post(
        f"{settings.API_V1_STR}/login/test-token",
        headers={"Authorization": "Bearer not-a-real-token"},
    )
    assert r.status_code == 401


def test_expired_access_token_returns_401(client: TestClient) -> None:
    # A token whose exp is already in the past.
    expired = security.create_access_token(
        "00000000-0000-0000-0000-000000000000",
        expires_delta=timedelta(minutes=-1),
    )
    r = client.post(
        f"{settings.API_V1_STR}/login/test-token",
        headers={"Authorization": f"Bearer {expired}"},
    )
    assert r.status_code == 401


def test_login_returns_refresh_token(client: TestClient) -> None:
    tokens = _login(client)
    assert tokens["access_token"]
    assert tokens["refresh_token"]


def test_refresh_returns_new_tokens_and_rotates(client: TestClient) -> None:
    tokens = _login(client)
    old_refresh = tokens["refresh_token"]

    r = client.post(
        f"{settings.API_V1_STR}/login/refresh-token",
        json={"refresh_token": old_refresh},
    )
    assert r.status_code == 200
    new_tokens = r.json()
    assert new_tokens["access_token"]
    assert new_tokens["refresh_token"]
    # Rotation: a brand new refresh token is issued...
    assert new_tokens["refresh_token"] != old_refresh

    # New access token actually authenticates.
    me = client.post(
        f"{settings.API_V1_STR}/login/test-token",
        headers={"Authorization": f"Bearer {new_tokens['access_token']}"},
    )
    assert me.status_code == 200

    # ...and the old refresh token is now dead.
    reuse = client.post(
        f"{settings.API_V1_STR}/login/refresh-token",
        json={"refresh_token": old_refresh},
    )
    assert reuse.status_code == 401


def test_refresh_with_unknown_token_returns_401(client: TestClient) -> None:
    r = client.post(
        f"{settings.API_V1_STR}/login/refresh-token",
        json={"refresh_token": "totally-unknown"},
    )
    assert r.status_code == 401


def test_expired_refresh_token_returns_401(client: TestClient, db: Session) -> None:
    user = user_repo.get_by_email(session=db, email=settings.FIRST_SUPERUSER)
    assert user is not None
    plain = "expired-refresh-plaintext"
    db.add(
        RefreshToken(
            user_id=user.id,
            token_hash=security.hash_token(plain),
            expires_at=datetime.now(timezone.utc) - timedelta(minutes=1),
        )
    )
    db.commit()

    r = client.post(
        f"{settings.API_V1_STR}/login/refresh-token",
        json={"refresh_token": plain},
    )
    assert r.status_code == 401


def test_logout_revokes_refresh_token(client: TestClient) -> None:
    tokens = _login(client)
    refresh = tokens["refresh_token"]

    r = client.post(
        f"{settings.API_V1_STR}/logout",
        json={"refresh_token": refresh},
    )
    assert r.status_code == 200

    after = client.post(
        f"{settings.API_V1_STR}/login/refresh-token",
        json={"refresh_token": refresh},
    )
    assert after.status_code == 401

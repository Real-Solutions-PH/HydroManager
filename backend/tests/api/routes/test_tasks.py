"""Task management: CRUD, completion, recurrence advance, owner isolation."""

from datetime import datetime, timedelta, timezone

from fastapi.testclient import TestClient
from sqlmodel import Session

from app.core.config import settings
from tests.utils.user import authentication_token_from_email
from tests.utils.utils import random_email

API = settings.API_V1_STR


def _fresh_headers(client: TestClient, db: Session) -> dict[str, str]:
    return authentication_token_from_email(client=client, email=random_email(), db=db)


def _iso(dt: datetime) -> str:
    return dt.astimezone(timezone.utc).isoformat()


def _create(client: TestClient, headers: dict, **fields) -> dict:
    body = {"title": "Check pH"}
    body.update(fields)
    r = client.post(f"{API}/tasks/", headers=headers, json=body)
    assert r.status_code == 200, r.text
    return r.json()


def _list(client: TestClient, headers: dict, include_completed: bool = False) -> list:
    r = client.get(
        f"{API}/tasks/",
        headers=headers,
        params={"include_completed": include_completed},
    )
    assert r.status_code == 200, r.text
    return r.json()["data"]


def test_create_defaults_and_lists(client: TestClient, db: Session) -> None:
    headers = _fresh_headers(client, db)
    task = _create(client, headers, title="Mix nutrients", body="A+B 5ml/L")
    assert task["title"] == "Mix nutrients"
    assert task["body"] == "A+B 5ml/L"
    assert task["priority"] == "none"
    assert task["recur_freq"] == "none"
    assert task["completed_at"] is None
    ids = [t["id"] for t in _list(client, headers)]
    assert task["id"] in ids


def test_complete_non_recurring_hides_from_default_list(
    client: TestClient, db: Session
) -> None:
    headers = _fresh_headers(client, db)
    task = _create(client, headers, priority="high")
    tid = task["id"]

    r = client.post(f"{API}/tasks/{tid}/complete", headers=headers)
    assert r.status_code == 200, r.text
    assert r.json()["completed_at"] is not None

    assert tid not in [t["id"] for t in _list(client, headers)]
    assert tid in [t["id"] for t in _list(client, headers, include_completed=True)]


def test_uncomplete_restores(client: TestClient, db: Session) -> None:
    headers = _fresh_headers(client, db)
    tid = _create(client, headers)["id"]
    client.post(f"{API}/tasks/{tid}/complete", headers=headers)

    r = client.post(f"{API}/tasks/{tid}/uncomplete", headers=headers)
    assert r.status_code == 200, r.text
    assert r.json()["completed_at"] is None
    assert tid in [t["id"] for t in _list(client, headers)]


def test_complete_recurring_advances_due_date(client: TestClient, db: Session) -> None:
    headers = _fresh_headers(client, db)
    due = datetime.now(timezone.utc) - timedelta(hours=1)
    task = _create(
        client,
        headers,
        due_at=_iso(due),
        recur_freq="daily",
        recur_interval=2,
    )
    tid = task["id"]

    r = client.post(f"{API}/tasks/{tid}/complete", headers=headers)
    assert r.status_code == 200, r.text
    out = r.json()
    # recurring task stays active (not completed) and advances into the future
    assert out["completed_at"] is None
    assert out["last_completed_at"] is not None
    new_due = datetime.fromisoformat(out["due_at"])
    assert new_due > datetime.now(timezone.utc)
    # still visible in the default list
    assert tid in [t["id"] for t in _list(client, headers)]


def test_recurring_complete_skips_missed_runs(client: TestClient, db: Session) -> None:
    headers = _fresh_headers(client, db)
    due = datetime.now(timezone.utc) - timedelta(days=10)
    task = _create(
        client, headers, due_at=_iso(due), recur_freq="daily", recur_interval=1
    )
    r = client.post(f"{API}/tasks/{task['id']}/complete", headers=headers)
    assert r.status_code == 200, r.text
    new_due = datetime.fromisoformat(r.json()["due_at"])
    # jumps to the next future run, not 10 separate completions
    now = datetime.now(timezone.utc)
    assert now < new_due <= now + timedelta(days=1)


def test_patch_updates_fields(client: TestClient, db: Session) -> None:
    headers = _fresh_headers(client, db)
    tid = _create(client, headers)["id"]
    r = client.patch(
        f"{API}/tasks/{tid}",
        headers=headers,
        json={"title": "Renamed", "priority": "low"},
    )
    assert r.status_code == 200, r.text
    assert r.json()["title"] == "Renamed"
    assert r.json()["priority"] == "low"


def test_delete_removes(client: TestClient, db: Session) -> None:
    headers = _fresh_headers(client, db)
    tid = _create(client, headers)["id"]
    r = client.delete(f"{API}/tasks/{tid}", headers=headers)
    assert r.status_code == 200, r.text
    assert client.get(f"{API}/tasks/{tid}", headers=headers).status_code == 404


def test_owner_isolation(client: TestClient, db: Session) -> None:
    owner = _fresh_headers(client, db)
    other = _fresh_headers(client, db)
    tid = _create(client, owner)["id"]

    assert client.get(f"{API}/tasks/{tid}", headers=other).status_code in (403, 404)
    assert client.patch(
        f"{API}/tasks/{tid}", headers=other, json={"title": "hax"}
    ).status_code in (403, 404)
    assert client.delete(f"{API}/tasks/{tid}", headers=other).status_code in (
        403,
        404,
    )
    # owner's task untouched
    assert client.get(f"{API}/tasks/{tid}", headers=owner).json()["title"] == "Check pH"

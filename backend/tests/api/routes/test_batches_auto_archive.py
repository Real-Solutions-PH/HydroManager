"""Auto-archive a batch once it has no living units left (all Failed/Harvested).

Archiving must free the setup slots and hide the batch from the default list.
Each test uses a fresh user for isolation (free tier: 1 setup, 3 active batches).
"""

import uuid

from fastapi.testclient import TestClient
from sqlmodel import Session, select

from app.core.config import settings
from app.modules.batches import services as batch_services
from app.modules.batches.models import BatchStateCount
from app.modules.batches.schema import Milestone
from tests.utils.user import authentication_token_from_email
from tests.utils.utils import random_email

API = settings.API_V1_STR


def _fresh_headers(client: TestClient, db: Session) -> dict[str, str]:
    return authentication_token_from_email(client=client, email=random_email(), db=db)


def _make_setup(client: TestClient, headers: dict, slot_count: int = 12) -> str:
    r = client.post(
        f"{API}/setups/",
        headers=headers,
        json={"name": "AutoArchive Setup", "type": "DFT", "slot_count": slot_count},
    )
    assert r.status_code == 200, r.text
    return r.json()["id"]


def _make_seed_item(client: TestClient, headers: dict, stock: float = 1000) -> str:
    r = client.post(
        f"{API}/inventory/items",
        headers=headers,
        json={
            "name": f"Seed-{uuid.uuid4().hex[:6]}",
            "category": "seeds",
            "unit": "pieces",
            "current_stock": stock,
            "low_stock_threshold": 0,
            "unit_cost": 1.0,
        },
    )
    assert r.status_code == 200, r.text
    return r.json()["id"]


def _make_batch(
    client: TestClient,
    headers: dict,
    setup_id: str,
    item_id: str,
    *,
    slots_used: int = 2,
    seeds_per_slot: int = 2,
) -> dict:
    r = client.post(
        f"{API}/batches/",
        headers=headers,
        json={
            "setup_id": setup_id,
            "variety_name": "AA Lettuce",
            "slots_used": slots_used,
            "seeds_per_slot": seeds_per_slot,
            "seed_inventory_item_id": item_id,
        },
    )
    assert r.status_code == 200, r.text
    return r.json()


def _transition(
    client: TestClient, headers: dict, batch_id: str, frm: str, to: str, count: int
) -> None:
    r = client.post(
        f"{API}/batches/{batch_id}/transitions",
        headers=headers,
        json={"from_milestone": frm, "to_milestone": to, "count": count},
    )
    assert r.status_code == 200, r.text


def _harvest(
    client: TestClient, headers: dict, batch_id: str, count: int, weight: float = 10.0
) -> None:
    r = client.post(
        f"{API}/batches/{batch_id}/harvests",
        headers=headers,
        json={"weight_grams": weight, "count": count},
    )
    assert r.status_code == 200, r.text


def _get_batch(client: TestClient, headers: dict, batch_id: str) -> dict:
    r = client.get(f"{API}/batches/{batch_id}", headers=headers)
    assert r.status_code == 200, r.text
    return r.json()


def _slots_for_batch(client: TestClient, headers: dict, setup_id: str, batch_id: str):
    r = client.get(f"{API}/setups/{setup_id}", headers=headers)
    assert r.status_code == 200, r.text
    return [s for s in r.json()["slots"] if s.get("batch_id") == batch_id]


def _list_batch_ids(
    client: TestClient, headers: dict, setup_id: str, include_archived: bool = False
) -> list[str]:
    r = client.get(
        f"{API}/batches/",
        headers=headers,
        params={"setup_id": setup_id, "include_archived": include_archived},
    )
    assert r.status_code == 200, r.text
    return [b["id"] for b in r.json()["data"]]


def test_full_fail_archives_and_frees_slots(client: TestClient, db: Session) -> None:
    headers = _fresh_headers(client, db)
    setup_id = _make_setup(client, headers)
    item_id = _make_seed_item(client, headers)
    batch = _make_batch(client, headers, setup_id, item_id)  # initial_count = 4
    bid = batch["id"]
    assert _slots_for_batch(client, headers, setup_id, bid)  # slots occupied

    _transition(client, headers, bid, "Sowed", "Failed", batch["initial_count"])

    assert _get_batch(client, headers, bid)["archived_at"] is not None
    assert _slots_for_batch(client, headers, setup_id, bid) == []
    assert bid not in _list_batch_ids(client, headers, setup_id)
    assert bid in _list_batch_ids(client, headers, setup_id, include_archived=True)


def test_full_harvest_archives_and_frees_slots(client: TestClient, db: Session) -> None:
    headers = _fresh_headers(client, db)
    setup_id = _make_setup(client, headers)
    item_id = _make_seed_item(client, headers)
    batch = _make_batch(client, headers, setup_id, item_id)  # initial_count = 4
    bid = batch["id"]
    n = batch["initial_count"]

    _transition(client, headers, bid, "Sowed", "HarvestReady", n)
    _harvest(client, headers, bid, n)

    assert _get_batch(client, headers, bid)["archived_at"] is not None
    assert _slots_for_batch(client, headers, setup_id, bid) == []
    assert bid not in _list_batch_ids(client, headers, setup_id)


def test_mixed_terminal_archives(client: TestClient, db: Session) -> None:
    headers = _fresh_headers(client, db)
    setup_id = _make_setup(client, headers)
    item_id = _make_seed_item(client, headers)
    batch = _make_batch(client, headers, setup_id, item_id)  # initial_count = 4
    bid = batch["id"]

    _transition(client, headers, bid, "Sowed", "Failed", 1)  # living 3
    _transition(client, headers, bid, "Sowed", "HarvestReady", 3)  # living 3
    # still living until harvested
    assert _get_batch(client, headers, bid)["archived_at"] is None
    _harvest(client, headers, bid, 3)  # living 0 -> archive

    assert _get_batch(client, headers, bid)["archived_at"] is not None
    assert _slots_for_batch(client, headers, setup_id, bid) == []


def test_partial_terminal_not_archived(client: TestClient, db: Session) -> None:
    headers = _fresh_headers(client, db)
    setup_id = _make_setup(client, headers)
    item_id = _make_seed_item(client, headers)
    batch = _make_batch(client, headers, setup_id, item_id)  # initial_count = 4
    bid = batch["id"]

    _transition(client, headers, bid, "Sowed", "Failed", 2)  # living 2 remain

    assert _get_batch(client, headers, bid)["archived_at"] is None
    assert _slots_for_batch(client, headers, setup_id, bid)  # slots still held
    assert bid in _list_batch_ids(client, headers, setup_id)


def _force_all_failed(db: Session, batch_id: str) -> None:
    """Mark every state-count of a batch as Failed without the API path.

    Simulates a batch that became fully terminal *before* auto-archive existed.
    """
    rows = db.exec(
        select(BatchStateCount).where(BatchStateCount.batch_id == uuid.UUID(batch_id))
    ).all()
    for row in rows:
        row.milestone_code = Milestone.Failed
        db.add(row)
    db.commit()


def test_backfill_archives_preexisting_terminal_batch(
    client: TestClient, db: Session
) -> None:
    headers = _fresh_headers(client, db)
    setup_id = _make_setup(client, headers)
    item_id = _make_seed_item(client, headers)
    bid = _make_batch(client, headers, setup_id, item_id)["id"]

    _force_all_failed(db, bid)
    # pre-existing terminal batch is still active + still holding slots
    assert _get_batch(client, headers, bid)["archived_at"] is None
    assert _slots_for_batch(client, headers, setup_id, bid)

    archived = batch_services.archive_terminal_batches(session=db)
    assert archived >= 1

    assert _get_batch(client, headers, bid)["archived_at"] is not None
    assert _slots_for_batch(client, headers, setup_id, bid) == []
    assert bid not in _list_batch_ids(client, headers, setup_id)


def test_backfill_skips_living_batch(client: TestClient, db: Session) -> None:
    headers = _fresh_headers(client, db)
    setup_id = _make_setup(client, headers)
    item_id = _make_seed_item(client, headers)
    bid = _make_batch(client, headers, setup_id, item_id)["id"]  # all Sowed (living)

    batch_services.archive_terminal_batches(session=db)

    assert _get_batch(client, headers, bid)["archived_at"] is None
    assert _slots_for_batch(client, headers, setup_id, bid)

import uuid

import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session

from app.core.config import settings


@pytest.fixture(scope="module")
def shared_setup_id(client: TestClient, normal_user_token_headers: dict) -> str:
    """Create one setup for the whole module (free tier allows 1)."""
    r = client.post(
        f"{settings.API_V1_STR}/setups/",
        headers=normal_user_token_headers,
        json={
            "name": "Seed Consume Test Setup",
            "type": "DFT",
            "slot_count": 60,
        },
    )
    assert r.status_code == 200, r.text
    return r.json()["id"]


def _create_seed_item(
    client: TestClient, headers: dict, *, stock: float, unit_cost: float | None = 2.0
) -> str:
    r = client.post(
        f"{settings.API_V1_STR}/inventory/items",
        headers=headers,
        json={
            "name": f"Seed-{uuid.uuid4().hex[:6]}",
            "category": "seeds",
            "unit": "pieces",
            "current_stock": stock,
            "low_stock_threshold": 0,
            "unit_cost": unit_cost,
        },
    )
    assert r.status_code == 200, r.text
    return r.json()["id"]


def test_create_batch_consumes_seed_stock(
    client: TestClient,
    normal_user_token_headers: dict,
    db: Session,
    shared_setup_id: str,
) -> None:
    item_id = _create_seed_item(
        client, normal_user_token_headers, stock=100, unit_cost=1.5
    )

    r = client.post(
        f"{settings.API_V1_STR}/batches/",
        headers=normal_user_token_headers,
        json={
            "setup_id": shared_setup_id,
            "variety_name": "Test Lettuce",
            "slots_used": 4,
            "seeds_per_slot": 2,
            "seed_inventory_item_id": item_id,
        },
    )
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["seed_inventory_item_id"] == item_id
    assert body["initial_count"] == 8

    item = client.get(
        f"{settings.API_V1_STR}/inventory/items/{item_id}",
        headers=normal_user_token_headers,
    ).json()
    assert item["current_stock"] == 92

    detail = client.get(
        f"{settings.API_V1_STR}/batches/{body['id']}",
        headers=normal_user_token_headers,
    ).json()
    assert detail["seed_cost"] == 12.0  # 8 * 1.5


def test_create_batch_insufficient_seed_stock(
    client: TestClient,
    normal_user_token_headers: dict,
    shared_setup_id: str,
) -> None:
    item_id = _create_seed_item(client, normal_user_token_headers, stock=3)

    r = client.post(
        f"{settings.API_V1_STR}/batches/",
        headers=normal_user_token_headers,
        json={
            "setup_id": shared_setup_id,
            "variety_name": "Test",
            "slots_used": 2,
            "seeds_per_slot": 5,
            "seed_inventory_item_id": item_id,
        },
    )
    assert r.status_code == 400
    assert "INSUFFICIENT_SEED_STOCK" in r.json()["detail"]


def test_create_batch_rejects_non_seed_item(
    client: TestClient,
    normal_user_token_headers: dict,
    shared_setup_id: str,
) -> None:
    r = client.post(
        f"{settings.API_V1_STR}/inventory/items",
        headers=normal_user_token_headers,
        json={
            "name": "Nutrient A",
            "category": "nutrients",
            "unit": "milliliters",
            "current_stock": 1000,
            "low_stock_threshold": 0,
        },
    )
    nutrient_id = r.json()["id"]

    r = client.post(
        f"{settings.API_V1_STR}/batches/",
        headers=normal_user_token_headers,
        json={
            "setup_id": shared_setup_id,
            "variety_name": "Test",
            "slots_used": 1,
            "seeds_per_slot": 1,
            "seed_inventory_item_id": nutrient_id,
        },
    )
    assert r.status_code == 400
    assert "not a seed" in r.json()["detail"]

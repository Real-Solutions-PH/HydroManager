# Seed Bank Inventory Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Link batch creation to the existing inventory module so every plant consumes a "seeds" inventory item, and add a game-UI "Seed Bank" bottom sheet on the Seeds screen.

**Architecture:** Reuse `inventory_item` (category=seeds) + `inventory_movement` tables. Add a single nullable FK `batch.seed_inventory_item_id`. New batches require the FK; legacy batches stay null. Per-batch seed cost is derived (no snapshot column) by summing consume movements where `related_batch_id = batch.id`. Mobile gets a persistent bottom handle on `seeds.tsx` that opens a sheet showing pixel/RPG-style seed cells; tapping a cell opens a detail sheet with Plant / Restock / Edit actions.

**Tech Stack:** FastAPI + SQLModel + Alembic (backend), Expo Router + React Native + TanStack Query (mobile).

**Spec:** `docs/superpowers/specs/2026-05-18-seed-bank-inventory-design.md`

---

## File Structure

### Backend
- **Create:** `backend/app/alembic/versions/<rev>_add_batch_seed_inventory_link.py` — migration adding `batch.seed_inventory_item_id` FK
- **Modify:** `backend/app/modules/batches/schema.py` — add `seed_inventory_item_id` to `BatchBase`, require in `BatchCreate`, expose `seed_cost` in `BatchPublic`/`BatchDetail`
- **Modify:** `backend/app/modules/batches/services.py` — validate seed item, hard-block on insufficient stock, create consume movement + decrement stock inside batch txn; compute `seed_cost` for detail/list
- **Modify:** `backend/app/modules/batches/routes.py` — pass `seed_cost` into responses

### Mobile
- **Modify:** `mobile/src/lib/hydro-api.ts` — add `seed_inventory_item_id` to `Batch`/`BatchCreate`, add `seed_cost` to `BatchDetail`, add `inventoryApi.restock` helper
- **Create:** `mobile/src/components/seeds/seed-packet-cell.tsx` — pixel/RPG inventory cell
- **Create:** `mobile/src/components/seeds/seed-bank-sheet.tsx` — bottom sheet (grid, sort, search, +Add)
- **Create:** `mobile/src/components/seeds/seed-detail-sheet.tsx` — secondary sheet with Plant / Restock / Edit
- **Create:** `mobile/src/components/seeds/seed-bank-handle.tsx` — persistent grip above tab bar
- **Modify:** `mobile/src/app/(app)/seeds.tsx` — mount handle + sheet over existing content
- **Create:** `mobile/src/app/(app)/seeds/new.tsx` — Add-seed modal route
- **Modify:** `mobile/src/app/(app)/batch/new.tsx` — required seed picker (locked when `seed=` param present)
- **Modify:** `mobile/src/app/(app)/batch/[id].tsx` — show seed cost row

---

## Task 1: Add `seed_inventory_item_id` to Batch model and schemas

**Files:**
- Modify: `backend/app/modules/batches/schema.py`
- Modify: `backend/app/modules/batches/models.py` (no change needed — `BatchBase` is the SQLModel parent and inherits new field)

- [ ] **Step 1: Add field to `BatchBase`, `BatchCreate`, `BatchPublic`, `BatchDetail`**

Edit `backend/app/modules/batches/schema.py`. Replace `BatchBase` and `BatchCreate` blocks:

```python
class BatchBase(SQLModel):
    setup_id: uuid.UUID
    crop_guide_id: uuid.UUID | None = None
    variety_name: str = Field(min_length=1, max_length=120)
    initial_count: int = Field(ge=1)
    slots_used: int | None = Field(default=None, ge=1, le=2000)
    seeds_per_slot: int | None = Field(default=None, ge=1, le=100)
    notes: str | None = Field(default=None, max_length=1000)
    seed_inventory_item_id: uuid.UUID | None = Field(
        default=None, foreign_key="inventory_item.id", ondelete="SET NULL"
    )


class BatchCreate(SQLModel):
    setup_id: uuid.UUID
    crop_guide_id: uuid.UUID | None = None
    variety_name: str = Field(min_length=1, max_length=120)
    slots_used: int = Field(ge=1, le=2000)
    seeds_per_slot: int = Field(ge=1, le=100)
    notes: str | None = Field(default=None, max_length=1000)
    started_at: datetime | None = None
    seed_inventory_item_id: uuid.UUID
```

Add `seed_cost` to `BatchPublic`:

```python
class BatchPublic(BatchBase):
    id: uuid.UUID
    owner_id: uuid.UUID
    started_at: datetime
    archived_at: datetime | None = None
    legacy: bool = False
    seed_cost: float | None = None
```

(`BatchDetail` inherits.)

- [ ] **Step 2: Commit**

```bash
git add backend/app/modules/batches/schema.py
git commit -m "feat(batches): add seed_inventory_item_id and seed_cost to schemas"
```

---

## Task 2: Alembic migration for `batch.seed_inventory_item_id`

**Files:**
- Create: `backend/app/alembic/versions/g2c4e8f1a9b0_add_batch_seed_inventory_link.py`

- [ ] **Step 1: Find current head revision**

Run: `cd backend && uv run alembic heads`
Expected: prints a single revision id (the latest). Capture it as `<HEAD>`.

- [ ] **Step 2: Create the migration file**

Create `backend/app/alembic/versions/g2c4e8f1a9b0_add_batch_seed_inventory_link.py`:

```python
"""add batch.seed_inventory_item_id

Revision ID: g2c4e8f1a9b0
Revises: <HEAD>
Create Date: 2026-05-18 00:00:00.000000

"""
import sqlalchemy as sa
from alembic import op

revision = 'g2c4e8f1a9b0'
down_revision = '<HEAD>'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        'batch',
        sa.Column('seed_inventory_item_id', sa.Uuid(), nullable=True),
    )
    op.create_foreign_key(
        'fk_batch_seed_inventory_item_id',
        'batch',
        'inventory_item',
        ['seed_inventory_item_id'],
        ['id'],
        ondelete='SET NULL',
    )


def downgrade():
    op.drop_constraint(
        'fk_batch_seed_inventory_item_id', 'batch', type_='foreignkey'
    )
    op.drop_column('batch', 'seed_inventory_item_id')
```

Replace `<HEAD>` with the value captured in Step 1.

- [ ] **Step 3: Run migration**

Run: `make backend-migrate`
Expected: completes with `Running upgrade ... -> g2c4e8f1a9b0, add batch.seed_inventory_item_id`

- [ ] **Step 4: Verify column**

Run: `cd backend && uv run python -c "from sqlmodel import inspect, create_engine; from app.core.config import settings; e=create_engine(str(settings.SQLALCHEMY_DATABASE_URI)); print([c['name'] for c in inspect(e).get_columns('batch')])"`
Expected: list includes `seed_inventory_item_id`.

- [ ] **Step 5: Commit**

```bash
git add backend/app/alembic/versions/g2c4e8f1a9b0_add_batch_seed_inventory_link.py
git commit -m "feat(db): link batch to seed inventory item"
```

---

## Task 3: Enforce seed stock + consume movement in `create_batch`

**Files:**
- Modify: `backend/app/modules/batches/services.py`

- [ ] **Step 1: Add imports**

In `backend/app/modules/batches/services.py`, add to the import block:

```python
from app.modules.inventory import repo as inv_repo
from app.modules.inventory.models import InventoryMovement
from app.modules.inventory.schema import InventoryCategory, MovementType
```

- [ ] **Step 2: Add seed validation helper above `create_batch`**

Insert this function above `def create_batch(...)`:

```python
def _consume_seed_for_batch(
    *,
    session: Session,
    current_user: User,
    item_id: uuid.UUID,
    seeds_needed: int,
    batch_id: uuid.UUID,
) -> None:
    item = inv_repo.get_by_id(session=session, item_id=item_id)
    if item is None:
        raise HTTPException(status_code=404, detail="Seed inventory item not found")
    if not current_user.is_superuser and item.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    if item.category != InventoryCategory.seeds:
        raise HTTPException(
            status_code=400, detail="Selected inventory item is not a seed"
        )
    if item.current_stock < seeds_needed:
        raise HTTPException(
            status_code=400,
            detail=(
                f"INSUFFICIENT_SEED_STOCK: need {seeds_needed}, "
                f"have {int(item.current_stock)}"
            ),
        )
    cost_total = (
        round(seeds_needed * item.unit_cost, 4) if item.unit_cost is not None else None
    )
    item.current_stock = max(item.current_stock - seeds_needed, 0)
    session.add(item)
    movement = InventoryMovement(
        item_id=item.id,
        movement_type=MovementType.consume,
        quantity=float(seeds_needed),
        cost_total=cost_total,
        related_batch_id=batch_id,
    )
    inv_repo.add_movement(session=session, movement=movement)
    activity_service.record(
        session=session,
        user_id=current_user.id,
        action_type=ActivityType.inventory_consumed,
        target_type=TargetType.inventory_item,
        target_id=item.id,
        summary=f"{item.name} consumed ({seeds_needed:g} {item.unit.value}) for batch",
        meta={
            "movement_type": MovementType.consume.value,
            "quantity": seeds_needed,
            "cost_total": cost_total,
            "related_batch_id": str(batch_id),
        },
    )
```

- [ ] **Step 3: Wire the helper into `create_batch`**

In `create_batch`, after the line `batch = batches_repo.create(session=session, batch=db)` and BEFORE the slot-assignment loop, add:

```python
    _consume_seed_for_batch(
        session=session,
        current_user=current_user,
        item_id=data.seed_inventory_item_id,
        seeds_needed=initial_count,
        batch_id=batch.id,
    )
```

Also add `seed_inventory_item_id` to the `payload` dict literal:

```python
        "seed_inventory_item_id": data.seed_inventory_item_id,
```

- [ ] **Step 4: Lint**

Run: `make backend-lint`
Expected: passes with no new errors.

- [ ] **Step 5: Commit**

```bash
git add backend/app/modules/batches/services.py
git commit -m "feat(batches): consume seed inventory atomically on batch create"
```

---

## Task 4: Backend test — happy path + hard-block + wrong category

**Files:**
- Create: `backend/tests/api/routes/test_batches_seed_consume.py`

- [ ] **Step 1: Write tests**

```python
import uuid

from fastapi.testclient import TestClient
from sqlmodel import Session

from app.core.config import settings


def _create_setup(client: TestClient, headers: dict) -> str:
    r = client.post(
        f"{settings.API_V1_STR}/setups/",
        headers=headers,
        json={
            "name": "Test Setup",
            "type": "DFT",
            "slot_count": 20,
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
    client: TestClient, normal_user_token_headers: dict, db: Session
) -> None:
    setup_id = _create_setup(client, normal_user_token_headers)
    item_id = _create_seed_item(
        client, normal_user_token_headers, stock=100, unit_cost=1.5
    )

    r = client.post(
        f"{settings.API_V1_STR}/batches/",
        headers=normal_user_token_headers,
        json={
            "setup_id": setup_id,
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
    client: TestClient, normal_user_token_headers: dict
) -> None:
    setup_id = _create_setup(client, normal_user_token_headers)
    item_id = _create_seed_item(client, normal_user_token_headers, stock=3)

    r = client.post(
        f"{settings.API_V1_STR}/batches/",
        headers=normal_user_token_headers,
        json={
            "setup_id": setup_id,
            "variety_name": "Test",
            "slots_used": 2,
            "seeds_per_slot": 5,
            "seed_inventory_item_id": item_id,
        },
    )
    assert r.status_code == 400
    assert "INSUFFICIENT_SEED_STOCK" in r.json()["detail"]


def test_create_batch_rejects_non_seed_item(
    client: TestClient, normal_user_token_headers: dict
) -> None:
    setup_id = _create_setup(client, normal_user_token_headers)
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
            "setup_id": setup_id,
            "variety_name": "Test",
            "slots_used": 1,
            "seeds_per_slot": 1,
            "seed_inventory_item_id": nutrient_id,
        },
    )
    assert r.status_code == 400
    assert "not a seed" in r.json()["detail"]
```

- [ ] **Step 2: Run tests**

Run: `cd backend && uv run pytest tests/api/routes/test_batches_seed_consume.py -v`
Expected: all 3 tests pass.

- [ ] **Step 3: Commit**

```bash
git add backend/tests/api/routes/test_batches_seed_consume.py
git commit -m "test(batches): cover seed stock enforcement on create"
```

---

## Task 5: Compute `seed_cost` for batch list + detail responses

**Files:**
- Modify: `backend/app/modules/batches/services.py`
- Modify: `backend/app/modules/batches/routes.py`

- [ ] **Step 1: Add `compute_seed_cost` helper to services**

Append to `backend/app/modules/batches/services.py`:

```python
def compute_seed_cost(
    *, session: Session, batch_id: uuid.UUID
) -> float | None:
    from app.modules.inventory.models import InventoryMovement
    from app.modules.inventory.schema import MovementType

    q = select(func.coalesce(func.sum(InventoryMovement.cost_total), 0.0)).where(
        InventoryMovement.related_batch_id == batch_id,
        InventoryMovement.movement_type == MovementType.consume,
    )
    total = session.exec(q).one()
    has_consume_q = (
        select(func.count())
        .select_from(InventoryMovement)
        .where(
            InventoryMovement.related_batch_id == batch_id,
            InventoryMovement.movement_type == MovementType.consume,
        )
    )
    has_any = session.exec(has_consume_q).one() > 0
    if not has_any:
        return None
    return float(total or 0.0)
```

- [ ] **Step 2: Use helper in routes**

In `backend/app/modules/batches/routes.py`, update `list_batches` to enrich data:

```python
    data = [
        BatchPublic.model_validate(
            {
                **r.model_dump(),
                "legacy": r.slots_used is None,
                "seed_cost": batches_service.compute_seed_cost(
                    session=session, batch_id=r.id
                ),
            },
        )
        for r in rows
    ]
```

And update `read_batch` `BatchDetail(...)` construction:

```python
    return BatchDetail(
        **BatchPublic.model_validate(
            {
                **batch.model_dump(),
                "legacy": batch.slots_used is None,
                "seed_cost": batches_service.compute_seed_cost(
                    session=session, batch_id=batch.id
                ),
            },
        ).model_dump(),
        state_counts=[...],   # unchanged
        recent_transitions=[...],   # unchanged
    )
```

(Keep the existing `state_counts` and `recent_transitions` list comprehensions exactly as they were.)

- [ ] **Step 3: Run tests**

Run: `cd backend && uv run pytest tests/api/routes/test_batches_seed_consume.py -v`
Expected: all pass (test from Task 4 already asserts `seed_cost == 12.0`).

- [ ] **Step 4: Lint**

Run: `make backend-lint`
Expected: passes.

- [ ] **Step 5: Commit**

```bash
git add backend/app/modules/batches/services.py backend/app/modules/batches/routes.py
git commit -m "feat(batches): expose computed seed_cost in list and detail responses"
```

---

## Task 6: Mobile API client — add seed fields and restock helper

**Files:**
- Modify: `mobile/src/lib/hydro-api.ts`

- [ ] **Step 1: Extend `Batch` interface**

Find the `Batch` interface and add the field after `archived_at`:

```ts
export interface Batch {
    id: string;
    owner_id: string;
    setup_id: string;
    crop_guide_id: string | null;
    variety_name: string;
    initial_count: number;
    slots_used: number | null;
    seeds_per_slot: number | null;
    notes: string | null;
    started_at: string;
    archived_at: string | null;
    legacy: boolean;
    seed_inventory_item_id: string | null;
    seed_cost: number | null;
}
```

- [ ] **Step 2: Update `batchesApi.create` payload**

In `batchesApi.create`, replace its `data` parameter type to add the required field:

```ts
async create(data: {
    setup_id: string;
    variety_name: string;
    slots_used: number;
    seeds_per_slot: number;
    seed_inventory_item_id: string;
    crop_guide_id?: string | null;
    notes?: string;
    started_at?: string;
}): Promise<Batch> {
    const r = await api.post(`${V1}/batches/`, data);
    return r.data;
},
```

- [ ] **Step 3: Add `inventoryApi.restock` helper**

In `inventoryApi`, add (after `create`):

```ts
async restock(
    id: string,
    data: { quantity: number; cost_total?: number | null; occurred_at?: string; notes?: string },
): Promise<unknown> {
    const r = await api.post(`${V1}/inventory/items/${id}/movements`, {
        movement_type: "restock",
        quantity: data.quantity,
        cost_total: data.cost_total ?? undefined,
        occurred_at: data.occurred_at,
        notes: data.notes,
    });
    return r.data;
},
```

- [ ] **Step 4: Type-check**

Run: `cd mobile && bun tsc --noEmit`
Expected: passes. Existing call sites of `batchesApi.create` will now error (missing `seed_inventory_item_id`). That's expected — they get fixed in Task 11.

- [ ] **Step 5: Commit**

```bash
git add mobile/src/lib/hydro-api.ts
git commit -m "feat(mobile): add seed inventory fields and restock helper"
```

---

## Task 7: Seed packet cell component

**Files:**
- Create: `mobile/src/components/seeds/seed-packet-cell.tsx`

- [ ] **Step 1: Create the file**

```tsx
import { Ionicons } from "@expo/vector-icons";
import { Image, Pressable, View } from "react-native";
import { Text } from "@/components/ui/text";
import { spacing, useThemeColors } from "@/constants/theme";
import type { InventoryItem } from "@/lib/hydro-api";

export const PACKET_SIZE = 84;

export function SeedPacketCell({
    item,
    imageUrl,
    onPress,
}: {
    item: InventoryItem;
    imageUrl?: string | null;
    onPress: () => void;
}) {
    const colors = useThemeColors();
    const low = item.is_low_stock;
    const expiring =
        item.expiry_status === "warning" || item.expiry_status === "expired";
    const bg = low ? colors.warningLight : colors.glass;
    const border = expiring ? colors.warning : colors.border;
    return (
        <Pressable
            onPress={onPress}
            style={({ pressed }) => ({
                width: PACKET_SIZE,
                height: PACKET_SIZE,
                borderRadius: 10,
                borderWidth: 2,
                borderColor: border,
                backgroundColor: bg,
                alignItems: "center",
                justifyContent: "center",
                opacity: pressed ? 0.7 : 1,
            })}
        >
            {imageUrl ? (
                <Image
                    source={{ uri: imageUrl }}
                    style={{ width: 48, height: 48, borderRadius: 6 }}
                />
            ) : (
                <Ionicons name="leaf" size={36} color={colors.primaryLight} />
            )}
            <View
                style={{
                    position: "absolute",
                    bottom: 2,
                    right: 2,
                    minWidth: 24,
                    paddingHorizontal: 4,
                    paddingVertical: 1,
                    borderRadius: 6,
                    backgroundColor: "rgba(0,0,0,0.7)",
                    alignItems: "center",
                }}
            >
                <Text
                    size="xs"
                    weight="bold"
                    style={{ color: "#FFFFFF" }}
                    numberOfLines={1}
                >
                    {formatQty(item.current_stock)}
                </Text>
            </View>
        </Pressable>
    );
}

function formatQty(n: number): string {
    if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
    return `${Math.floor(n)}`;
}
```

- [ ] **Step 2: Type-check**

Run: `cd mobile && bun tsc --noEmit`
Expected: passes (verify `InventoryItem` type already includes `is_low_stock`, `expiry_status`; both exist per `inventoryApi`).

- [ ] **Step 3: Commit**

```bash
git add mobile/src/components/seeds/seed-packet-cell.tsx
git commit -m "feat(mobile): add seed packet cell component"
```

---

## Task 8: Seed bank bottom sheet

**Files:**
- Create: `mobile/src/components/seeds/seed-bank-sheet.tsx`

- [ ] **Step 1: Create the file**

```tsx
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import { Modal, Pressable, ScrollView, View } from "react-native";
import { SearchBar } from "@/components/ui/search-bar";
import { Text } from "@/components/ui/text";
import { spacing, useThemeColors } from "@/constants/theme";
import { type CropGuide, type InventoryItem, inventoryApi } from "@/lib/hydro-api";
import { QK, STALE } from "@/lib/query-config";
import { SeedPacketCell } from "./seed-packet-cell";

type Sort = "name" | "qty" | "expiry";

export function SeedBankSheet({
    open,
    onClose,
    onSelect,
    cropsByName,
}: {
    open: boolean;
    onClose: () => void;
    onSelect: (item: InventoryItem) => void;
    cropsByName: Map<string, CropGuide>;
}) {
    const colors = useThemeColors();
    const [query, setQuery] = useState("");
    const [sort, setSort] = useState<Sort>("name");

    const seedsQ = useQuery({
        queryKey: [...QK.inventory.lists(), "seeds"],
        queryFn: () => inventoryApi.list({ category: "seeds", limit: 500 }),
        staleTime: STALE.inventory,
        enabled: open,
    });

    const items = useMemo(() => {
        const data = seedsQ.data?.data ?? [];
        const q = query.trim().toLowerCase();
        const filtered = q
            ? data.filter((d) => d.name.toLowerCase().includes(q))
            : data;
        const sorted = [...filtered].sort((a, b) => {
            if (sort === "qty") return b.current_stock - a.current_stock;
            if (sort === "expiry") {
                const ax = a.expiry_date ?? "9999-12-31";
                const bx = b.expiry_date ?? "9999-12-31";
                return ax.localeCompare(bx);
            }
            return a.name.localeCompare(b.name);
        });
        return sorted;
    }, [seedsQ.data, query, sort]);

    return (
        <Modal
            visible={open}
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >
            <Pressable
                style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.55)" }}
                onPress={onClose}
            />
            <View
                style={{
                    position: "absolute",
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: colors.bg,
                    borderTopLeftRadius: 24,
                    borderTopRightRadius: 24,
                    paddingTop: spacing.sm,
                    paddingHorizontal: spacing.md,
                    paddingBottom: spacing.xxl,
                    maxHeight: "82%",
                    borderTopWidth: 1,
                    borderColor: colors.border,
                }}
            >
                <View
                    style={{
                        alignItems: "center",
                        marginBottom: spacing.xs,
                    }}
                >
                    <View
                        style={{
                            width: 44,
                            height: 4,
                            borderRadius: 2,
                            backgroundColor: colors.border,
                        }}
                    />
                </View>
                <View
                    style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: spacing.sm,
                    }}
                >
                    <Text size="xl" weight="bold">
                        Seed Bank
                    </Text>
                    <Pressable
                        onPress={() => {
                            onClose();
                            router.push("/seeds/new");
                        }}
                        style={({ pressed }) => ({
                            flexDirection: "row",
                            alignItems: "center",
                            gap: spacing.xxs,
                            paddingHorizontal: spacing.sm,
                            paddingVertical: 8,
                            borderRadius: 999,
                            backgroundColor: pressed
                                ? colors.buttonSolidActive
                                : colors.buttonSolidBg,
                        })}
                    >
                        <Ionicons name="add" size={16} color="#FFFFFF" />
                        <Text weight="semibold" style={{ color: "#FFFFFF" }}>
                            Add Seed
                        </Text>
                    </Pressable>
                </View>

                <SearchBar
                    value={query}
                    onChangeText={setQuery}
                    placeholder="Search seeds..."
                />

                <View
                    style={{
                        flexDirection: "row",
                        gap: spacing.xs,
                        marginTop: spacing.xs,
                        marginBottom: spacing.sm,
                    }}
                >
                    {(["name", "qty", "expiry"] as const).map((s) => (
                        <Pressable
                            key={s}
                            onPress={() => setSort(s)}
                            style={({ pressed }) => ({
                                paddingHorizontal: spacing.sm,
                                paddingVertical: 4,
                                borderRadius: 999,
                                backgroundColor:
                                    sort === s ? colors.primaryLight : colors.glass,
                                opacity: pressed ? 0.7 : 1,
                            })}
                        >
                            <Text
                                size="xs"
                                weight="semibold"
                                style={{
                                    color: sort === s ? "#FFFFFF" : colors.text,
                                    textTransform: "capitalize",
                                }}
                            >
                                {s}
                            </Text>
                        </Pressable>
                    ))}
                </View>

                <ScrollView contentContainerStyle={{ paddingBottom: spacing.lg }}>
                    {seedsQ.isLoading ? (
                        <Text tone="muted">Loading seeds...</Text>
                    ) : items.length === 0 ? (
                        <View style={{ alignItems: "center", padding: spacing.xl }}>
                            <Ionicons name="leaf-outline" size={48} color={colors.textMuted} />
                            <Text tone="muted" style={{ marginTop: spacing.sm }}>
                                No seeds yet. Tap "Add Seed" to start.
                            </Text>
                        </View>
                    ) : (
                        <View
                            style={{
                                flexDirection: "row",
                                flexWrap: "wrap",
                                gap: spacing.sm,
                            }}
                        >
                            {items.map((item) => (
                                <SeedPacketCell
                                    key={item.id}
                                    item={item}
                                    imageUrl={
                                        cropsByName.get(item.name.toLowerCase())?.image_url ?? null
                                    }
                                    onPress={() => onSelect(item)}
                                />
                            ))}
                        </View>
                    )}
                </ScrollView>
            </View>
        </Modal>
    );
}
```

- [ ] **Step 2: Verify `QK.inventory.lists` and `STALE.inventory` exist**

Run: `grep -n "inventory" mobile/src/lib/query-config.ts`
If missing, add to `QK` and `STALE` following the existing pattern (use the same shape as `QK.batches`/`STALE.batches`).

- [ ] **Step 3: Type-check**

Run: `cd mobile && bun tsc --noEmit`
Expected: passes (still expecting `batch/new.tsx` errors from Task 6).

- [ ] **Step 4: Commit**

```bash
git add mobile/src/components/seeds/seed-bank-sheet.tsx mobile/src/lib/query-config.ts
git commit -m "feat(mobile): add seed bank bottom sheet"
```

---

## Task 9: Seed detail sheet with Plant / Restock / Edit

**Files:**
- Create: `mobile/src/components/seeds/seed-detail-sheet.tsx`

- [ ] **Step 1: Create the file**

```tsx
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { useState } from "react";
import {
    Alert,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    View,
} from "react-native";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { spacing, useThemeColors } from "@/constants/theme";
import { type InventoryItem, inventoryApi } from "@/lib/hydro-api";
import { QK } from "@/lib/query-config";

type Mode = "view" | "restock";

export function SeedDetailSheet({
    item,
    onClose,
}: {
    item: InventoryItem | null;
    onClose: () => void;
}) {
    const colors = useThemeColors();
    const qc = useQueryClient();
    const [mode, setMode] = useState<Mode>("view");
    const [restockQty, setRestockQty] = useState("");
    const [restockCost, setRestockCost] = useState("");

    const movementsQ = useQuery({
        queryKey: item ? QK.inventory.movements(item.id) : ["noop"],
        queryFn: () => (item ? inventoryApi.movements(item.id) : Promise.resolve([])),
        enabled: !!item,
    });

    const restock = useMutation({
        mutationFn: () => {
            if (!item) throw new Error("no item");
            const qty = Number.parseFloat(restockQty);
            const cost = restockCost ? Number.parseFloat(restockCost) : undefined;
            if (!Number.isFinite(qty) || qty <= 0) throw new Error("Invalid qty");
            return inventoryApi.restock(item.id, { quantity: qty, cost_total: cost });
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: QK.inventory.all });
            setMode("view");
            setRestockQty("");
            setRestockCost("");
        },
        onError: (e: Error) => Alert.alert("Error", e.message),
    });

    if (!item) return null;
    const open = item !== null;

    return (
        <Modal visible={open} transparent animationType="slide" onRequestClose={onClose}>
            <Pressable
                style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.55)" }}
                onPress={onClose}
            />
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : undefined}
                style={{ position: "absolute", left: 0, right: 0, bottom: 0 }}
            >
                <View
                    style={{
                        backgroundColor: colors.bg,
                        borderTopLeftRadius: 24,
                        borderTopRightRadius: 24,
                        padding: spacing.md,
                        paddingBottom: spacing.xxl,
                        borderTopWidth: 1,
                        borderColor: colors.border,
                        gap: spacing.sm,
                        maxHeight: "82%",
                    }}
                >
                    <View
                        style={{
                            flexDirection: "row",
                            justifyContent: "space-between",
                            alignItems: "center",
                        }}
                    >
                        <Text size="lg" weight="bold">
                            {item.name}
                        </Text>
                        <Pressable onPress={onClose} hitSlop={10}>
                            <Ionicons name="close" size={24} color={colors.text} />
                        </Pressable>
                    </View>

                    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
                        <Stat label="STOCK" value={`${item.current_stock} ${item.unit}`} />
                        <Stat
                            label="UNIT COST"
                            value={item.unit_cost != null ? `₱${item.unit_cost.toFixed(2)}` : "—"}
                        />
                        <Stat label="EXPIRES" value={item.expiry_date ?? "—"} />
                    </View>

                    {mode === "view" ? (
                        <>
                            <ScrollView style={{ maxHeight: 180 }}>
                                <Text size="xs" weight="semibold" tone="subtle">
                                    RECENT MOVEMENTS
                                </Text>
                                {(movementsQ.data ?? []).slice(0, 5).map((m) => (
                                    <Text key={m.id} size="sm" tone="muted">
                                        {m.movement_type} · {m.quantity} ·{" "}
                                        {new Date(m.occurred_at).toLocaleDateString()}
                                    </Text>
                                ))}
                            </ScrollView>

                            <View style={{ flexDirection: "row", gap: spacing.xs }}>
                                <View style={{ flex: 1 }}>
                                    <Button
                                        label="Plant"
                                        onPress={() => {
                                            onClose();
                                            router.push(`/batch/new?seed=${item.id}`);
                                        }}
                                    />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Button
                                        variant="ghost"
                                        label="Restock"
                                        onPress={() => setMode("restock")}
                                    />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Button
                                        variant="ghost"
                                        label="Edit"
                                        onPress={() => {
                                            onClose();
                                            router.push(`/inventory/${item.id}`);
                                        }}
                                    />
                                </View>
                            </View>
                        </>
                    ) : (
                        <>
                            <Input
                                placeholder="Quantity"
                                keyboardType="numeric"
                                value={restockQty}
                                onChangeText={setRestockQty}
                            />
                            <Input
                                placeholder="Total cost (optional)"
                                keyboardType="numeric"
                                value={restockCost}
                                onChangeText={setRestockCost}
                            />
                            <View style={{ flexDirection: "row", gap: spacing.xs }}>
                                <View style={{ flex: 1 }}>
                                    <Button
                                        label="Confirm Restock"
                                        isLoading={restock.isPending}
                                        onPress={() => restock.mutate()}
                                    />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Button
                                        variant="ghost"
                                        label="Cancel"
                                        onPress={() => setMode("view")}
                                    />
                                </View>
                            </View>
                        </>
                    )}
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
}

function Stat({ label, value }: { label: string; value: string }) {
    return (
        <View style={{ minWidth: 90 }}>
            <Text size="xs" weight="semibold" tone="subtle">
                {label}
            </Text>
            <Text weight="semibold">{value}</Text>
        </View>
    );
}
```

- [ ] **Step 2: Add `inventoryApi.movements` helper if missing**

Run: `grep -n "movements" mobile/src/lib/hydro-api.ts`
If no `movements` method exists on `inventoryApi`, add:

```ts
async movements(
    id: string,
    limit = 50,
): Promise<Array<{
    id: string;
    item_id: string;
    movement_type: "restock" | "consume" | "adjust";
    quantity: number;
    cost_total: number | null;
    related_batch_id: string | null;
    occurred_at: string;
    notes: string | null;
}>> {
    const r = await api.get(`${V1}/inventory/items/${id}/movements`, {
        params: { limit },
    });
    return r.data;
},
```

Also confirm `QK.inventory.movements(id)` exists in `query-config.ts`; add if missing.

- [ ] **Step 3: Type-check**

Run: `cd mobile && bun tsc --noEmit`
Expected: passes (except known `batch/new.tsx` errors).

- [ ] **Step 4: Commit**

```bash
git add mobile/src/components/seeds/seed-detail-sheet.tsx mobile/src/lib/hydro-api.ts mobile/src/lib/query-config.ts
git commit -m "feat(mobile): add seed detail sheet with plant/restock/edit"
```

---

## Task 10: Persistent bottom handle + wire into Seeds screen

**Files:**
- Create: `mobile/src/components/seeds/seed-bank-handle.tsx`
- Modify: `mobile/src/app/(app)/seeds.tsx`

- [ ] **Step 1: Create the handle**

```tsx
import { Ionicons } from "@expo/vector-icons";
import { Pressable, View } from "react-native";
import { Text } from "@/components/ui/text";
import { spacing, useThemeColors } from "@/constants/theme";

export function SeedBankHandle({
    count,
    bottomOffset,
    onPress,
}: {
    count: number;
    bottomOffset: number;
    onPress: () => void;
}) {
    const colors = useThemeColors();
    return (
        <Pressable
            onPress={onPress}
            style={({ pressed }) => ({
                position: "absolute",
                left: spacing.md,
                right: spacing.md,
                bottom: bottomOffset,
                paddingVertical: 10,
                paddingHorizontal: spacing.md,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: colors.border,
                backgroundColor: pressed ? colors.glassHover : colors.surface,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: spacing.xs,
                shadowColor: "#000",
                shadowOpacity: 0.1,
                shadowRadius: 8,
                shadowOffset: { width: 0, height: -2 },
                elevation: 6,
            })}
        >
            <View
                style={{
                    width: 32,
                    height: 4,
                    borderRadius: 2,
                    backgroundColor: colors.border,
                    position: "absolute",
                    top: 4,
                    alignSelf: "center",
                }}
            />
            <Ionicons name="leaf" size={16} color={colors.primaryLight} />
            <Text weight="semibold">Seed Bank</Text>
            <Text tone="muted">· {count} pack{count === 1 ? "" : "s"}</Text>
        </Pressable>
    );
}
```

- [ ] **Step 2: Wire into `seeds.tsx`**

In `mobile/src/app/(app)/seeds.tsx`:

Add imports near top:

```ts
import { useQuery } from "@tanstack/react-query";
import { inventoryApi, type InventoryItem } from "@/lib/hydro-api";
import { SeedBankHandle } from "@/components/seeds/seed-bank-handle";
import { SeedBankSheet } from "@/components/seeds/seed-bank-sheet";
import { SeedDetailSheet } from "@/components/seeds/seed-detail-sheet";
```

Inside the `SeedsScreen` function, after the existing `cropsQ` query, add:

```ts
const seedsQ = useQuery({
    queryKey: [...QK.inventory.lists(), "seeds", "count"],
    queryFn: () => inventoryApi.list({ category: "seeds", limit: 500 }),
    staleTime: STALE.inventory,
});
const [bankOpen, setBankOpen] = useState(false);
const [selectedSeed, setSelectedSeed] = useState<InventoryItem | null>(null);
```

At the end of the returned JSX (just before closing `</GradientBackground>`), insert:

```tsx
<SeedBankHandle
    count={seedsQ.data?.count ?? 0}
    bottomOffset={tabBarClearance + 8}
    onPress={() => setBankOpen(true)}
/>
<SeedBankSheet
    open={bankOpen}
    onClose={() => setBankOpen(false)}
    onSelect={(item) => {
        setBankOpen(false);
        setSelectedSeed(item);
    }}
    cropsByName={cropByName}
/>
<SeedDetailSheet item={selectedSeed} onClose={() => setSelectedSeed(null)} />
```

- [ ] **Step 3: Smoke test**

Run: `cd mobile && bun start` then open the app. Tap the Seeds tab. Verify the bottom handle is visible above the tab bar. Tap → sheet slides up. Tap a packet → detail sheet opens. Pull to dismiss.

- [ ] **Step 4: Commit**

```bash
git add mobile/src/components/seeds/seed-bank-handle.tsx mobile/src/app/(app)/seeds.tsx
git commit -m "feat(mobile): mount seed bank handle and sheets on seeds screen"
```

---

## Task 11: Add-seed modal route

**Files:**
- Create: `mobile/src/app/(app)/seeds/new.tsx`

- [ ] **Step 1: Create the file**

```tsx
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Alert, Pressable, ScrollView, View } from "react-native";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Combobox, type ComboboxOption } from "@/components/ui/combobox";
import { DatePicker } from "@/components/ui/date-picker";
import { GradientBackground } from "@/components/ui/gradient-background";
import { Input } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { spacing, useThemeColors } from "@/constants/theme";
import { useBack } from "@/hooks/use-back";
import { cropsApi, inventoryApi } from "@/lib/hydro-api";
import { QK, STALE } from "@/lib/query-config";

export default function NewSeedScreen() {
    const colors = useThemeColors();
    const qc = useQueryClient();
    const goBack = useBack();

    const cropsQ = useQuery({
        queryKey: QK.crops(),
        queryFn: () => cropsApi.list(),
        staleTime: STALE.crops,
    });

    const [name, setName] = useState("");
    const [cropId, setCropId] = useState<string | null>(null);
    const [qty, setQty] = useState("");
    const [unitCost, setUnitCost] = useState("");
    const [expiry, setExpiry] = useState<string | null>(null);
    const [lowThreshold, setLowThreshold] = useState("0");
    const [notes, setNotes] = useState("");

    const cropOptions: ComboboxOption[] = (cropsQ.data?.data ?? []).map((c) => ({
        value: c.id,
        label: c.name_en,
        subtitle: c.name_tl || c.category,
    }));

    const create = useMutation({
        mutationFn: async () => {
            const qtyN = Number.parseFloat(qty);
            const costN = unitCost ? Number.parseFloat(unitCost) : null;
            if (!Number.isFinite(qtyN) || qtyN <= 0) throw new Error("Quantity required");
            const item = await inventoryApi.create({
                name: name.trim(),
                category: "seeds",
                unit: "pieces",
                current_stock: qtyN,
                low_stock_threshold: Number.parseFloat(lowThreshold) || 0,
                unit_cost: costN,
                expiry_date: expiry,
                notes: notes.trim() || undefined,
            });
            if (costN != null) {
                await inventoryApi.restock(item.id, {
                    quantity: 0,
                    cost_total: qtyN * costN,
                });
            }
            return item;
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: QK.inventory.all });
            goBack();
        },
        onError: (e: Error) => Alert.alert("Error", e.message),
    });

    const valid = name.trim().length > 0 && Number.parseFloat(qty) > 0;

    return (
        <GradientBackground>
            <ScrollView
                contentContainerStyle={{ padding: spacing.md, paddingBottom: spacing.xxxl }}
                keyboardShouldPersistTaps="handled"
            >
                <View
                    style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: spacing.xs,
                        marginBottom: spacing.xs,
                    }}
                >
                    <Pressable onPress={goBack}>
                        <Ionicons name="arrow-back" size={24} color={colors.text} />
                    </Pressable>
                    <Text size="xxl" weight="bold">
                        Add Seed
                    </Text>
                </View>

                <Card>
                    <Field label="Crop (Optional)">
                        <Combobox
                            value={cropId}
                            onValueChange={(v, opt) => {
                                setCropId(v);
                                if (opt && !name) setName(opt.label);
                            }}
                            options={cropOptions}
                            placeholder="Pick a crop"
                            allowClear
                        />
                    </Field>
                    <Field label="Name">
                        <Input value={name} onChangeText={setName} placeholder="e.g. Lettuce Grand Rapids" />
                    </Field>
                    <Field label="Quantity (pieces)">
                        <Input value={qty} onChangeText={setQty} keyboardType="numeric" />
                    </Field>
                    <Field label="Unit Cost (₱, optional)">
                        <Input value={unitCost} onChangeText={setUnitCost} keyboardType="numeric" />
                    </Field>
                    <Field label="Expiry Date (optional)">
                        <DatePicker value={expiry} onChange={setExpiry} placeholder="None" />
                    </Field>
                    <Field label="Low-stock threshold">
                        <Input value={lowThreshold} onChangeText={setLowThreshold} keyboardType="numeric" />
                    </Field>
                    <Field label="Notes">
                        <Input value={notes} onChangeText={setNotes} multiline placeholder="Optional" />
                    </Field>
                </Card>

                <View style={{ marginTop: spacing.lg, gap: spacing.xs }}>
                    <Button
                        label="Save Seed"
                        isDisabled={!valid || create.isPending}
                        isLoading={create.isPending}
                        onPress={() => create.mutate()}
                    />
                    <Button variant="ghost" label="Cancel" onPress={goBack} />
                </View>
            </ScrollView>
        </GradientBackground>
    );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <View style={{ gap: 6, marginBottom: spacing.md }}>
            <Text
                size="xs"
                weight="semibold"
                tone="subtle"
                style={{ textTransform: "uppercase", letterSpacing: 0.5 }}
            >
                {label}
            </Text>
            {children}
        </View>
    );
}
```

- [ ] **Step 2: Register the route**

Run: `grep -n "seeds" mobile/src/app/\(app\)/_layout.tsx`
Add a `<Stack.Screen name="seeds/new" options={{ presentation: "modal" }} />` entry alongside other modal routes (follow existing pattern for e.g. `inventory-new`).

- [ ] **Step 3: Smoke test**

Open Seed Bank sheet, tap "+ Add Seed". Verify modal opens, form submits, new packet appears in grid.

- [ ] **Step 4: Commit**

```bash
git add mobile/src/app/\(app\)/seeds/new.tsx mobile/src/app/\(app\)/_layout.tsx
git commit -m "feat(mobile): add new seed modal route"
```

---

## Task 12: Required seed picker in `/batch/new`

**Files:**
- Modify: `mobile/src/app/(app)/batch/new.tsx`

- [ ] **Step 1: Add seed query and state**

Near the top of `NewBatchScreen`, parse the new param and load seeds:

```ts
const { setup: setupParam, seed: seedParam } = useLocalSearchParams<{
    setup?: string;
    seed?: string;
}>();
...
const seedsQ = useQuery({
    queryKey: [...QK.inventory.lists(), "seeds"],
    queryFn: () => inventoryApi.list({ category: "seeds", limit: 500 }),
    staleTime: STALE.inventory,
});
const [seedItemId, setSeedItemId] = useState<string>(seedParam ?? "");
const seedLocked = !!seedParam;

const seedOptions: ComboboxOption[] = useMemo(
    () =>
        (seedsQ.data?.data ?? []).map((s) => ({
            value: s.id,
            label: s.name,
            subtitle: `${s.current_stock} ${s.unit} in stock`,
            disabled: s.current_stock < totalSeeds,
        })),
    [seedsQ.data, totalSeeds],
);

const selectedSeed = useMemo(
    () => (seedsQ.data?.data ?? []).find((s) => s.id === seedItemId) ?? null,
    [seedsQ.data, seedItemId],
);
const insufficient =
    selectedSeed != null && totalSeeds > selectedSeed.current_stock;
```

Add `inventoryApi` to the imports.

> **Note for executor:** if `ComboboxOption` doesn't support `disabled`, drop that key and render an inline "low stock" badge in the option subtitle (e.g. `${stock} (low)`). Either way the submit guard below still prevents bad submits.

- [ ] **Step 2: Add Seed field to form**

Insert a new `<Field label="Seed">` block in the form, just before the existing `<Field label="Variety (Crop)">`:

```tsx
<Field label="Seed">
    <Combobox
        value={seedItemId || null}
        onValueChange={(v) => setSeedItemId(v ?? "")}
        options={seedOptions}
        placeholder="Pick a seed from your bank"
        emptyMessage={
            seedsQ.isLoading ? "Loading..." : "No seeds yet. Add one from the Seed Bank."
        }
        disabled={seedLocked}
    />
    {selectedSeed ? (
        <Text
            size="xs"
            tone={insufficient ? "muted" : "muted"}
            style={{ marginTop: 4, color: insufficient ? colors.error : undefined }}
        >
            {insufficient
                ? `Need ${totalSeeds}, have ${selectedSeed.current_stock}`
                : `${selectedSeed.current_stock} ${selectedSeed.unit} available`}
        </Text>
    ) : null}
</Field>
```

> If `Combobox` doesn't have a `disabled` prop, render the locked state as a read-only text row showing `selectedSeed.name` with a lock icon.

- [ ] **Step 3: Send `seed_inventory_item_id` and gate submit**

In the `create` mutation:

```ts
const create = useMutation({
    mutationFn: () =>
        batchesApi.create({
            setup_id: setupId,
            variety_name: variety.trim(),
            slots_used: slotsUsedNum,
            seeds_per_slot: seedsPerSlotNum,
            seed_inventory_item_id: seedItemId,
            crop_guide_id: cropId,
            notes: notes.trim() || undefined,
            started_at: startDate ? `${startDate}T00:00:00.000Z` : undefined,
        }),
    ...
});
```

Update `valid`:

```ts
const valid =
    setupId.length > 0 &&
    variety.trim().length > 0 &&
    slotsUsedNum > 0 &&
    seedsPerSlotNum > 0 &&
    seedItemId.length > 0 &&
    !overCapacity &&
    !insufficient;
```

- [ ] **Step 4: Type-check + smoke test**

Run: `cd mobile && bun tsc --noEmit`
Expected: passes.

Smoke: from Seed Bank → tap packet → Plant → batch/new opens w/ seed locked. Try planting more seeds than stock — submit disabled. Try via "Start Batch" button — picker required.

- [ ] **Step 5: Commit**

```bash
git add mobile/src/app/\(app\)/batch/new.tsx
git commit -m "feat(mobile): require seed picker in new batch form"
```

---

## Task 13: Show seed cost in batch detail screen

**Files:**
- Modify: `mobile/src/app/(app)/batch/[id].tsx`

- [ ] **Step 1: Locate the metadata grid**

Run: `grep -n "DetailCell\|seed_cost\|initial_count" mobile/src/app/\(app\)/batch/\[id\].tsx`
Identify the section where batch detail stats are rendered (e.g. inside a "Batch Details" card).

- [ ] **Step 2: Add a Seed Cost row**

Inside that section, add (matching the existing `DetailCell` / row pattern in that file):

```tsx
<DetailCell
    icon="cash-outline"
    label="SEED COST"
    value={
        batch.seed_cost != null
            ? `₱${batch.seed_cost.toFixed(2)}`
            : "—"
    }
/>
```

If `batch/[id].tsx` uses a different cell component, mirror that pattern. Read the file first and adapt.

- [ ] **Step 3: Smoke test**

Plant a batch from a seed with `unit_cost = ₱2`, 8 seeds. Open batch detail. Verify "SEED COST · ₱16.00".

- [ ] **Step 4: Commit**

```bash
git add mobile/src/app/\(app\)/batch/\[id\].tsx
git commit -m "feat(mobile): surface seed cost in batch detail"
```

---

## Task 14: Final verification

- [ ] **Step 1: Run full backend test suite**

Run: `make backend-test`
Expected: passes, including new test file.

- [ ] **Step 2: Lint backend**

Run: `make backend-lint`
Expected: passes.

- [ ] **Step 3: Type-check mobile**

Run: `cd mobile && bun tsc --noEmit`
Expected: passes.

- [ ] **Step 4: End-to-end smoke**

Manual run:
1. Open Seeds tab → bottom handle visible.
2. Tap handle → empty Seed Bank → tap Add Seed → create "Lettuce" qty 50 cost ₱2.
3. Tap packet → detail shows 50 pieces, ₱2 unit cost.
4. Tap Plant → /batch/new opens with seed locked.
5. Set slots=4, seeds_per_slot=2. Submit. Batch appears in timeline.
6. Re-open Seed Bank → packet now shows 42.
7. Open batch detail → SEED COST ₱16.00.
8. Try planting 100 seeds from a packet with 42 → submit disabled with "Need 100, have 42".
9. Restock from detail sheet (qty 20, cost ₱40) → packet shows 62.

- [ ] **Step 5: Final commit if anything fixed during smoke**

```bash
git status
# only commit if smoke surfaced fixes
```

---

## Self-Review Notes (author)

- Spec coverage: every spec section maps to a task (data model → T1+T2, backend behavior → T3+T5, mobile UI → T6–T13, testing → T4+T14).
- Atomicity: `create_batch` already calls `session.commit()` at the end; `_consume_seed_for_batch` only stages mutations (no commit), so the consume + batch insert + slot assignment all land in one transaction. HTTPException raised before commit rolls back via FastAPI's session dep.
- Legacy: `seed_inventory_item_id` is nullable on the DB column (Task 2) and `BatchBase` (Task 1) but required in `BatchCreate` (Task 1). Existing batches keep `null` and report `seed_cost: null` (Task 5's `compute_seed_cost` returns `None` when no consume movements exist).
- Type consistency: `seed_inventory_item_id` and `seed_cost` are the exact names used in Python schema, mobile TS types, and JSX consumers.
- Combobox `disabled` prop assumption flagged inline (Task 12) with a fallback strategy in case the primitive doesn't support it.

# Seed Bank Inventory — Design

**Date:** 2026-05-18
**Status:** Approved for implementation
**Scope:** Add a game-UI seed inventory ("Seed Bank") on top of the existing Seeds screen, link batch creation to seed inventory consumption, and surface seed cost in batch/sales contexts.

## Goal

Make planting a batch a deliberate inventory action: the user records seeds they bought, then "virtually plants" them in a setup. Batch creation consumes from inventory, snapshots cost via movements, and feeds into the existing sales COGS report.

## Non-goals

- No FIFO lot tracking. Single `unit_cost` per item.
- No retroactive backfill of existing batches. Legacy batches remain unlinked.
- No new sales screens. COGS aggregation already exists.
- No automatic stock refund on batch delete.

## UX

### Seeds screen (`mobile/src/app/(app)/seeds.tsx`)

- Existing batch timeline, filters, search, "Start Batch" button — unchanged.
- New persistent bottom handle above tab bar: `🌱 Seed Bank · N packs`. Drag or tap to open bottom sheet.
- Bottom sheet content:
  - Header: search input, sort selector (name | qty | expiry), `+ Add Seed` button.
  - Grid of pixel/RPG inventory cells (3–4 columns):
    - Square slot, dark border, crop icon centered (fallback to leaf glyph).
    - Quantity badge bottom-right.
    - Tint: low-stock (`current_stock ≤ low_stock_threshold`) → warning bg. Expiring (`expiry_status ∈ {warning, expired}`) → border accent.
  - Empty state: ghost cells + "Add your first seed" CTA.

### Seed detail sheet
Tap a packet → secondary sheet:
- Crop image, name, stock, unit cost, expiry, recent movements (last 5).
- Buttons: `[Plant]` `[Restock]` `[Edit]`.

### Plant flow
- `[Plant]` from packet → navigates to `/batch/new` with `seed_inventory_item_id` prefilled and locked.
- `Start Batch` button (existing) → `/batch/new` with seed picker required. Dropdown filtered to `category=seeds`, each row shows current stock. Items where `stock < seeds_needed` are disabled with a "low stock" badge.
- Client computes `seeds_needed = slots_used × seeds_per_slot`. Submit disabled with inline message `Need X, have Y` when insufficient.

### Add seed flow (new route `/seeds/new`)
- Modal form:
  - Name (autocomplete from crop guides → sets `crop_guide_id` when matched).
  - Quantity, unit (default `pieces`), unit cost, expiry date, low-stock threshold, notes.
- On submit: `POST /inventory/items` (category=seeds) then `POST /inventory/items/{id}/movements` (restock with `cost_total = qty × unit_cost`).

### Restock
- From detail sheet: small form (qty, cost_total, occurred_at). Same restock endpoint.

### Sales linkage display
- Batch detail screen: add `Seed cost` row. `—` for legacy batches.
- Sale detail (when `linked_batch_id` set): show `Attributable seed cost` line.
- Sales report: no UI change. Existing COGS aggregation already sums `InventoryMovement.cost_total`.

## Data model

### Migration
- Add column `batch.seed_inventory_item_id UUID NULL` with FK to `inventory_item(id)` ON DELETE SET NULL.
- Nullable so existing batches remain unaffected.

### Schema (backend/app/modules/batches/schema.py)
- `BatchBase` gains `seed_inventory_item_id: uuid.UUID | None = None`.
- `BatchCreate` adds **required** `seed_inventory_item_id: uuid.UUID`.
- `BatchPublic` exposes `seed_inventory_item_id` and new computed `seed_cost: float | None`.
- `BatchDetail` includes `seed_cost`.

### No new tables
- Cost basis: `cost = seeds_needed × inventory_item.unit_cost` at consume time.
- Per-batch seed cost: derived via SUM of `InventoryMovement.cost_total` where `related_batch_id = batch.id` AND `movement_type = consume`.

## Backend behavior

### `POST /batches` (modified)
Single transaction:
1. Load `InventoryItem` by `seed_inventory_item_id`. Verify `owner_id == current_user.id` AND `category == seeds`. 404/403 otherwise.
2. Compute `seeds_needed = slots_used × seeds_per_slot`.
3. If `current_stock < seeds_needed` → HTTP 400 with body `{ "code": "INSUFFICIENT_SEED_STOCK", "available": X, "needed": Y }`.
4. Create `Batch` with `initial_count = seeds_needed` and `seed_inventory_item_id`.
5. Create `InventoryMovement`: type=`consume`, quantity=seeds_needed, `cost_total = seeds_needed × item.unit_cost` (null if `unit_cost` is null), `related_batch_id = batch.id`.
6. Decrement `inventory_item.current_stock` by `seeds_needed`.
7. Return `BatchPublic`.

### `GET /batches/{id}` (modified)
- Include `seed_cost` field: sum of consume movement `cost_total` where `related_batch_id = batch.id`. `null` if no consume movements (legacy).

### Batch delete
- Existing cascade behavior keeps `InventoryMovement.related_batch_id` set to NULL (FK ON DELETE SET NULL already in place per `models.py`).
- No automatic stock refund. User performs a manual `adjust` movement if needed.

### Seed listing
- Reuse existing `GET /inventory/items?category=seeds` (already supported by `routes.py:89`).
- Used by sheet and plant picker.

## Mobile API client (`mobile/src/lib/hydro-api.ts`)
- `batchesApi.create` payload gains required `seed_inventory_item_id`.
- `Batch` / `BatchDetail` types gain `seed_inventory_item_id?: string` and `seed_cost: number | null`.
- `inventoryApi` gains `listSeeds()` helper (filter by category=seeds) if not present.

## Error handling
- Plant button shows server error message verbatim when `INSUFFICIENT_SEED_STOCK` returned (race condition: client validated but server-side stock changed).
- Item-not-found / not-seeds → toast `Selected seed item is invalid`.

## Testing
- Backend unit tests: plant with sufficient stock decrements + creates movement with correct cost; plant with insufficient stock returns 400; plant with non-seed item rejected; plant with non-owner item rejected; batch detail returns correct `seed_cost`.
- Mobile: verify plant flow disables submit when stock < needed; verify packet renders with low-stock / expiring states.

## Out of scope (followups)
- FIFO lot tracking.
- Auto stock refund on batch failure/archive.
- Bulk seed import.
- Seed packet artwork beyond pixel cell + crop icon.

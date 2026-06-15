# SP1 — Seed Batch Terminal Auto-Archive

**Date:** 2026-06-15
**Status:** Approved (design)
**Scope:** Backend behavior change + small mobile UX change. No schema migration.

## Problem

When a seed batch reaches a terminal state — every seed has either **Failed** or been **Harvested** — it should:

1. Disappear from the active seed-batch list.
2. Release the setup slots it occupied, freeing capacity for new batches.

Today both happen only when a user **manually** taps Archive (or Delete). Recording the final transition to `Failed` or the final harvest leaves the batch active and its slots occupied. Growers must remember a manual cleanup step.

## Existing infrastructure (reused, not rebuilt)

- `Batch.archived_at: datetime | None` — when set, batch is hidden from default lists (`get_multi(..., include_archived=False)` filters on it; mobile seeds list queries with `include_archived: false`).
- `_free_slots_for_batch(session, batch_id)` (`services.py`) — sets each owned `SetupSlot.batch_id = None`, `status = EMPTY`.
- `activity_service.record(..., ActivityType.batch_archived, ...)` — audit log entry.
- Unit accounting lives in `BatchStateCount` rows (`milestone_code` → `count`). Terminal milestones: `Milestone.Failed`, `Milestone.Harvested`. All other milestones (Sowed … HarvestReady) are "living".
- Two service functions move units into terminal states:
  - `record_transition` — generic milestone move; used by mobile "Mark as Failed".
  - `record_harvest` — moves `HarvestReady → Harvested`.

## Design

### Backend — `backend/app/modules/batches/services.py`

Add a private helper:

```python
_TERMINAL_MILESTONES = {Milestone.Failed, Milestone.Harvested}

def _maybe_auto_archive(*, session: Session, current_user: User, batch: Batch) -> bool:
    """Archive + free slots when no living units remain. Idempotent. Returns True if archived."""
    if batch.archived_at is not None:
        return False
    rows = batches_repo.list_state_counts(session=session, batch_id=batch.id)
    total = sum(r.count for r in rows)
    living = sum(r.count for r in rows if r.milestone_code not in _TERMINAL_MILESTONES)
    if total <= 0 or living > 0:
        return False
    _free_slots_for_batch(session=session, batch_id=batch.id)
    batch.archived_at = datetime.now(timezone.utc)
    session.add(batch)
    activity_service.record(
        session=session,
        user_id=current_user.id,
        action_type=ActivityType.batch_archived,
        target_type=TargetType.batch,
        target_id=batch.id,
        summary=f"Batch {batch.variety_name} completed — auto-archived",
    )
    return True
```

Call sites — invoke just **before** the existing `session.commit()`:

- `record_transition`: after `add_transition` + `activity_service.record(...)`, before `session.commit()`.
- `record_harvest`: after `add_harvest` + `activity_service.record(...)`, before `session.commit()`.

`list_state_counts` issues a `select`, which autoflushes pending `upsert_state_count` changes, so the read reflects the just-applied deltas within the same transaction.

**Semantics**
- Triggers when living unit count hits 0 and the batch ever had units (`total > 0`). Covers: all-Failed, all-Harvested, and **mixed** (some failed + the rest harvested).
- Idempotent — the `archived_at is not None` guard prevents re-archiving / double activity rows.
- One-way. No batch-unarchive endpoint exists; adding one is out of scope. A later transition out of a terminal state will **not** auto-unarchive.
- Manual `archive_batch` / `delete_batch` are unchanged and still available.

### Mobile — `mobile/src/app/(app)/batch/[id].tsx`

The screen already computes per-milestone counts (`byMs`). Add completion awareness:

- `livingNow` = Σ `state_counts.count` where `milestone_code` ∉ {`Failed`, `Harvested`}.
- Predicted living after the pending action:
  - **transition:** `to ∈ {Failed, Harvested}` → `livingNow - cnt`; otherwise `livingNow` (living → living move).
  - **harvest:** `livingNow - count` (`HarvestReady` is living).
- `willComplete = predicted === 0 && livingNow > 0`.

Behavior:
- When `willComplete`, intercept the action with a confirm dialog via the existing `lib/dialog.ts` helper (cross-platform: web `confirm` + native `Alert`): *"Complete batch? This frees N slots and archives it."* where N = `slots_used`. Proceed only on confirm. (Reuse the existing dialog util — do not add a new primitive.)
- On the action's `onSuccess`, when `willComplete`: `toast.success("Batch complete — slots freed")` then `router.replace("/seeds")`.
- Add `qc.invalidateQueries({ queryKey: QK.setups.all })` to **`transition.onSettled`** and **`harvest.onSettled`** so the setup slot grid / utilization refreshes after slots are freed (transition currently invalidates only `batches.all`; harvest invalidates `batches.all` + `produce.all`).

Client-side prediction drives both the confirm and the post-success navigation. The backend remains the source of truth for archiving; if the prediction ever diverges, the batch still archives server-side and the list refetch drops it — the only loss is the special toast/navigation. Acceptable graceful degradation.

### Tests — `backend/tests/api/routes/test_batches_auto_archive.py`

Mirror `test_batches_seed_consume.py` (TestClient + `normal_user_token_headers` + seed item + setup helpers). Drive milestone progression via `POST /batches/{id}/transitions` and final harvest via `POST /batches/{id}/harvests`.

- `test_full_harvest_archives` — progress all units to `HarvestReady`, harvest all → batch `archived_at` set; excluded from `GET /batches/?include_archived=false`; setup slots all `empty` / `batch_id == null`.
- `test_full_fail_archives` — transition all units to `Failed` → archived + slots freed.
- `test_mixed_terminal_archives` — fail some, harvest the rest until living == 0 → archived.
- `test_partial_not_archived` — leave some units living → `archived_at` null, slots still held, batch still in default list.

## Out of scope

- Batch unarchive endpoint / auto-unarchive on reverse transition.
- Blocking transitions/harvest/edits on an already-archived batch.
- Notifications / reminders (handled in SP2).

# Batch Sell — Design

Date: 2026-05-03
Scope: `mobile/src/app/(app)/sale-new.tsx` + new bulk-add sheet component.

## Goals

Speed up recording multi-item sales (e.g. okra + eggplant seeds for a single ₱350 purchase). Three additions:

1. Bulk-add multiple inventory/produce items in one action.
2. Pricing mode toggle: per-unit price (current) or single total cost auto-distributed.
3. Replace free-text `unit` field with a Select dropdown.

## Non-goals

- No backend schema change. `SaleCreate.items` already supports multiple items.
- No automatic stock decrement (out of scope, existing behavior unchanged).
- No persisted "pricing mode" preference.

## UI changes

### Unit dropdown
- Replace per-line unit `Input` with `Select`.
- Options: `kg`, `g`, `pcs`, `bunch`, `sack`, `liters`, `milliliters`, `grams`, `pieces`.
- Auto-set when picking from produce/inventory; user may override.

### Pricing mode toggle
- Two-button toggle above Items list: `Per unit` | `Total`.
- `Per unit` mode: current behavior, `₱/unit` input per line, total computed.
- `Total` mode: hide per-line `₱/unit`; show single `Total ₱` input above Save.
- On save in Total mode: `unit_price = total / Σ(qty)` applied to every line (qty-weighted distribution; each line's cost share = `total × line_qty / Σqty`, dividing back by line_qty yields the same unit_price for all lines).
- Validation in Total mode: `total > 0`, all `qty > 0`.

### Bulk-add sheet
- New "Bulk add" Pressable beside existing "Add item" header button.
- Opens `BulkAddSheet` (modal). Tabs: `Produce` | `Inventory`.
- Each tab: scrollable checkbox list. Disabled rows: expired produce, zero-stock inventory.
- Footer: `Add N items` button. Closes sheet, appends one new line per selection (qty=1, fields prefilled like single pick).

## Files

- Modify `mobile/src/app/(app)/sale-new.tsx`
- New `mobile/src/components/sales/bulk-add-sheet.tsx`

## Out of scope / risks

- Mixed-unit total split: degenerate but acceptable per user choice (option B).
- No persistence of toggle state across sessions.

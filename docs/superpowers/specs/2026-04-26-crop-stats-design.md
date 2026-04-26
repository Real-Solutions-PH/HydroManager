# Crop Stats Aggregates — Design

## Goal

Replace fixed `RangeBar` domains (e.g. pH 0-14, EC 0-4) with dataset-derived bounds so each crop's bar shows where it sits relative to all other crops. Add a `MeterRow` for `typical_yield_grams` using the same dataset domain. Surface dataset average as a triangle marker on the bar.

The user reads the bar as: "is this crop's range high, low, or average compared to the rest of the library?" — turning the bar into a passive filter / comparison aid.

## Approach

**Cached aggregates table** (recomputed in service layer on crop mutations). Not a Postgres materialized view (overkill for a small, low-write table).

## Data Model

New table `crop_stat`:

```python
class CropStat(SQLModel, table=True):
    __tablename__ = "crop_stat"
    field: str = Field(primary_key=True, max_length=40)
    min_value: float
    max_value: float
    avg_value: float
    updated_at: datetime
```

One row per stat field. ~10 rows total.

## Stat Field Set

| field key                   | source columns                                | aggregation                                                                                                                              |
| --------------------------- | --------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `ph`                        | `ph_min`, `ph_max`                            | `min_value = min(ph_min)`, `max_value = max(ph_max)`, `avg_value = mean((ph_min + ph_max) / 2)`                                          |
| `ec`                        | `ec_min`, `ec_max`                            | same pattern                                                                                                                             |
| `days_to_harvest`           | `days_to_harvest_min`, `days_to_harvest_max`  | same pattern                                                                                                                             |
| `local_price_php_per_kg`    | `local_price_php_per_kg_min/max`              | same pattern, skip rows where either is null                                                                                              |
| `sunlight_hours`            | `sunlight_hours` (string `"x-y"`)             | parse via `parse_range`; skip unparseable; then `min(parsed_min)`, `max(parsed_max)`, `mean((pmin + pmax) / 2)`                          |
| `growlight_hours`           | `growlight_hours`                             | same                                                                                                                                     |
| `temperature_day_c`         | `temperature_day_c`                           | same                                                                                                                                     |
| `temperature_night_c`       | `temperature_night_c`                         | same                                                                                                                                     |
| `water_temp_c`              | `water_temp_c`                                | same                                                                                                                                     |
| `humidity_pct`              | `humidity_pct`                                | same                                                                                                                                     |
| `typical_yield_grams`       | `typical_yield_grams` (scalar)                | `min_value = min(value)`, `max_value = max(value)`, `avg_value = mean(value)`, skip nulls                                                |

If a stat has zero contributing rows (e.g. all crops have null `humidity_pct`), do not insert a row for that field. The endpoint omits it; the mobile client falls back to the existing fixed domain for that meter.

## Recompute Trigger

`crops_repo.recompute_stats(session: Session) -> None`:

1. Truncate or upsert all `crop_stat` rows.
2. For each stat field, run aggregation query / Python aggregation as appropriate.
3. Skip fields with no contributing rows.
4. Commit.

Called from:
- After successful `seed_if_empty` (only when rows were inserted).
- Manual recompute endpoint `POST /crops/stats/recompute` for ops use.
- Future create/update/delete crop endpoints (none exist yet — admin-only flow). Document this in repo as a hook to call when crop mutations are added.

Synchronous; cost is negligible at expected dataset size (~50 rows).

## API

New endpoints under existing `/crops` router:

### `GET /crops/stats`

Response:

```python
class CropStatValue(SQLModel):
    min: float
    max: float
    avg: float

class CropStatsResponse(SQLModel):
    stats: dict[str, CropStatValue]
```

JSON shape:
```json
{
  "stats": {
    "ph": {"min": 5.5, "max": 7.5, "avg": 6.4},
    "ec": {"min": 0.8, "max": 3.2, "avg": 1.9},
    "typical_yield_grams": {"min": 80, "max": 600, "avg": 220}
  }
}
```

Auth: same `CurrentUser` dep as other crop endpoints.

### `POST /crops/stats/recompute`

Auth: `CurrentUser`. Body: none. Response: `{"updated_fields": int}`. Wipes + recomputes the table.

## Mobile Consumption

### API client

Add to `mobile/src/lib/hydro-api.ts`:

```ts
export interface CropStatValue { min: number; max: number; avg: number; }
export interface CropStatsResponse { stats: Record<string, CropStatValue>; }

cropsApi.stats: () => Promise<CropStatsResponse>
```

### Hook

In `mobile/src/hooks/use-library.ts` (or co-located):

```ts
export function useCropStats() {
  return useQuery({
    queryKey: ["crop-stats"],
    queryFn: () => cropsApi.stats(),
    staleTime: 5 * 60 * 1000,
  });
}
```

### `CropDetail` integration

- Fetch `crop` and `stats` in parallel.
- When stats loading or stat key missing for a meter, fall back to existing fixed domains (e.g. pH `[0, 14]`).
- When stat present, compute padded domain:

```ts
function paddedDomain(stat: CropStatValue): [number, number] {
  const spread = stat.max - stat.min;
  const tightThreshold = Math.abs(stat.max) * 0.1;
  if (spread < tightThreshold) {
    // Q6b: widen artificially when spread is tight
    const mid = (stat.min + stat.max) / 2;
    const halfWidth = Math.max(Math.abs(mid) * 0.2, 1);
    return [mid - halfWidth, mid + halfWidth];
  }
  return [stat.min - spread * 0.1, stat.max + spread * 0.1];
}
```

- Pass `avg = stat.avg` (after domain padding, project avg position into the same domain) to `RangeBar`.

### `RangeBar` updates

New optional prop `avg?: number`. When defined and inside `[domainMin, domainMax]`, render an upward-pointing triangle marker (white, `colors.text`) above the segments at the avg's relative position.

Triangle: ~10px wide, ~6px tall, sits 4px above the bar.

When `avg` is undefined or outside the domain, omit marker (don't crash).

### `MeterRow` for `typical_yield_grams`

Replace the existing inline yield row in `CropDetail` with a `MeterRow`:
- `min === max === crop.typical_yield_grams` (scalar treated as zero-width range)
- `domain` from `stats.typical_yield_grams` w/ padding
- `avg` from `stats.typical_yield_grams.avg`
- `value` text: `${typical_yield_grams}g`
- `unit`: `(g / plant)`
- icon: `leaf` (filled, distinct from harvest days `leaf-outline`)

For zero-width ranges, the existing 5-segment overlap rule will fill exactly one segment (the one containing the value). That's fine — it shows position, not range.

## Edge Cases

- **All crops have identical value for a field**: spread = 0. Tight-spread branch widens to `mid ± max(|mid| * 0.2, 1)` — gives a visible domain.
- **Single crop**: stats degenerate to point. Same widening applies.
- **Stat field missing from response** (zero contributing rows): mobile falls back to fixed domain.
- **`avg` outside padded domain** (shouldn't happen, but defensive): omit triangle.
- **Crop `min` / `max` outside dataset bounds** (e.g. seed update introduces an outlier before stats recompute): `RangeBar` already clamps to `[0, 100]%`, so the band saturates at the edge. Acceptable until next recompute.

## Migration

Alembic migration adds `crop_stat` table. No data migration required (initial population happens via the seed flow's recompute call).

## Out of Scope

- Real-time recompute via background worker / pub-sub
- Stats for stage-EC scalars (`ec_seedling`, `ec_vegetative`, `ec_mature`, `ec_fruiting`) — not currently shown as ranges in UI
- Per-tenant stats (single-tenant app)
- Caching layer in front of the endpoint (low traffic, response is tiny)

## Acceptance

- `GET /crops/stats` returns one entry per non-empty stat field
- `POST /crops/stats/recompute` replaces table contents and returns count
- After `seed_if_empty` inserts rows, stats are populated automatically
- Mobile `CropDetail` `RangeBar`s use dataset-padded domains when stats present
- Mobile fallback to fixed domains when stats fetch fails or key missing
- Triangle marker visible at avg position for each meter
- Yield rendered as `MeterRow` with single-segment fill at value position

## Self-Review

- **Placeholder scan**: none.
- **Internal consistency**: stat field keys (`ph`, `ec`, `humidity_pct`, etc.) match the meter `key`s in mobile (renamed where needed: mobile uses `harvest` key for days_to_harvest — adjust to use `days_to_harvest` to match stat key).
- **Scope check**: bounded to one feature, single backend module + single mobile screen.
- **Ambiguity check**: tight-spread threshold of 10% of `|max|` — explicit. Padding ±10% of spread when wide — explicit. Triangle marker omission when out of domain — explicit.

# Crop Info Page — General Info Redesign

**File:** `mobile/src/app/(app)/library/crops/[id].tsx`
**Scope:** Hero header + "General Info" section. Sections below (EC by Stage, Crop Guide, Tips, Risks, Harvest Indicator) untouched except for removing the existing standalone Harvest Indicator section since it gets promoted into the new highlight card.

## Goals

- Match supplied mockup visually for hero + general info.
- Show recommended ranges as horizontal range bands. No live measurement marker — crop guide data is reference, not telemetry.
- Display setups as pill tags.
- Keep the rest of the page intact.

## Layout

```
[Hero image, full-width, rounded corners]
  └── Back button overlay (top-left, circular)

[Title block]
  ├── name_en (xxl bold)
  └── name_tl + " · " + category (sm muted)

[Highlight card — "Harvest Indicator"]
  ├── Lightbulb icon (left, circular badge)
  └── crop.harvest_indicator text (sm)

[Range rows — one per metric]
  ├── Icon (circular badge, left)
  ├── Label (md semibold)
  ├── Sublabel (xs muted) — e.g. "Soil pH"
  ├── Range value (md bold, right) — e.g. "5.5-6.5"
  ├── Unit (xs muted, right) — e.g. "(pH)"
  └── Range track (full-width, below) — green band marks recommended range across full track

[Setups section]
  ├── Section title "Setups"
  └── Tag pills (recommended_setups split on ",")

[Existing sections unchanged]
  EC by Stage, Crop Guide, Tips, Risks, Source
  (Standalone Harvest Indicator section removed — promoted to highlight card)
```

## Range Track Component

`RangeBar` props:
- `min: number`, `max: number` — recommended range
- `displayMin: number`, `displayMax: number` — full track domain (defines what "average" means)

Rendering:
- Track = full-width rounded bar, neutral muted background.
- Fill = green segment positioned `(min - displayMin) / (displayMax - displayMin)` to `(max - displayMin) / (displayMax - displayMin)` of width.
- No marker, no triangle, no current value indicator.

Display domains (chosen per metric to give meaningful "where in the spectrum" context):

| Metric | displayMin | displayMax | Source field |
|---|---|---|---|
| pH | 0 | 14 | `ph_min`/`ph_max` |
| EC (mS/cm) | 0 | 4 | `ec_min`/`ec_max` |
| Sunlight (h) | 0 | 24 | parse `sunlight_hours` |
| Growlight (h) | 0 | 24 | parse `growlight_hours` |
| Day temp (°C) | 0 | 40 | parse `temperature_day_c` |
| Night temp (°C) | 0 | 40 | parse `temperature_night_c` |
| Water temp (°C) | 0 | 40 | parse `water_temp_c` |
| Humidity (%) | 0 | 100 | parse `humidity_pct` |
| Days to harvest | 0 | 120 | `days_to_harvest_min`/`max` |
| Price (PHP/kg) | 0 | 500 | `local_price_php_per_kg_min`/`max` |

String range fields (`sunlight_hours`, temps, humidity, growlight) come from API as strings like `"6-8"` or `"22-28"`. Parser: split on `-`, parse floats, trim whitespace. If parse fails → render value as plain text, omit track.

## Tag List

`TagList` for `recommended_setups`:
- Split by `,` (trim entries)
- Each entry = pill chip (rounded, bordered, primaryLight tint)
- Wrap on overflow

## Hero Header

- `Image` source = `crop.image_url`, full-width, height 240, borderRadius 24
- Back button = circular pressable, absolute top-left, semi-transparent bg
- No refresh/info buttons (per Q1 D2)
- No "monitored X days" line — replaced by `name_tl · category`

## Data Mapping

Existing `CropGuide` interface, no API changes needed.

Mapping for range rows:

```ts
const ranges = [
  { label: "pH", sub: "Soil pH", icon: "water-outline",
    min: crop.ph_min, max: crop.ph_max,
    domain: [0, 14], unit: "pH" },
  { label: "EC", sub: "Nutrient strength", icon: "flash-outline",
    min: crop.ec_min, max: crop.ec_max,
    domain: [0, 4], unit: "mS/cm" },
  // ... (all parsed string-range fields, skipped if null or unparseable)
];
```

## Files Touched

- `mobile/src/app/(app)/library/crops/[id].tsx` — main rewrite of `CropDetail` for hero + General Info; remove standalone Harvest Indicator section
- New helpers in same file (or extracted to `mobile/src/components/crop/`):
  - `RangeBar` — track renderer
  - `MeterRow` — full row composition
  - `TagList` — pill list

Decision: keep helpers in same file initially. Extract if reused.

## Out of Scope

- EC by Stage, Crop Guide, Tips, Risks sections (unchanged).
- Backend / API / data model.
- Live sensor integration.
- Refresh / info action buttons in hero.

## Acceptance

- Range rows render only when data parses successfully.
- pH and EC rows always render (numeric fields, never null).
- Tags render only if `recommended_setups` non-empty.
- Highlight card hidden if `harvest_indicator` is null.
- Existing sections below General Info still display as before, minus the now-promoted Harvest Indicator section.
- Visual fidelity to mockup: rounded hero, circular icon badges, horizontal range track w/ green band, pill tags.

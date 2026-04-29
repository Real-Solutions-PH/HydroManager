# Home Page Redesign — Mobile App

**Date:** 2026-04-29
**Scope:** `mobile/src/app/(app)/index.tsx` and supporting primitives.

## Goal

Redesign the mobile home screen to match the provided UX references: a richer dashboard with a localized greeting, daily check-in card, today's-tasks progress ring, KPI grid, severity-coded alerts, upcoming harvests row, recent activity feed, and a 3×2 quick-actions grid.

## Approach

Approach 3 — full rewrite of `(app)/index.tsx` with **two new reusable primitives** (`ProgressRing`, `AlertCard`) and inline section composition. Other sections stay local to the home screen until a second consumer appears.

## Layout Structure

Top-to-bottom inside the scroll container:

1. **Header** — time-based localized greeting (`Magandang umaga! 🇵🇭`) + bold farm name (`Kai's Farm`). Right-aligned: bell icon button (red dot if any alert) → `/checklist`; avatar circle with first-initial → `/settings`.
2. **Daily check-in card** — full-width Card. Left: 64×64 rounded-square illustration placeholder (tinted leaf icon for v1). Right: bold quote (`"Kumusta ang farm mo ngayon! 👋"`) and a summary line `{tasks} tasks pending • {harvests} batches ready to check • {low} low stock`.
3. **Today's tasks card** — Card with title `Today's Tasks`, formatted current date, `ProgressRing` (64pt) right-aligned, full-width thin progress bar below, caption `{done} of {total} tasks completed today`.
4. **KPI grid (2×2)** — Active Setups, Plant Batches, Near Harvest, Low Stock. Each tile: tinted icon-square top-left, large bold value (≥32pt), label below. 48% width, 8pt gap.
5. **Alerts** — list of `AlertCard`s with left border in severity color. Sources: low-stock items (urgent if zero, low if <min), batches near harvest window, mocked pH-out-of-range entry. Hidden when zero.
6. **Upcoming Harvests** — horizontal `ScrollView`, 3 cards visible. Each: tinted leaf icon, crop name, plant count, days-left pill (red `<7d`, green `≥7d`). `See all` link → `/setups`.
7. **Recent Activity** — vertical list, 4 rows. Each: tinted square icon, title, relative time. Static mock array (no event-log endpoint).
8. **Quick Actions (3×2)** — 6 tiles, icon top-left, label below.

## Quick Actions Mapping

| Tile | Route |
|---|---|
| New Batch | `/batch/new` |
| Log Reading | `/checklist` (placeholder until reading-create route exists) |
| Crop Guide | `/library/crops` |
| Add Sale | `/sale-new` |
| Restock | `/inventory-new` |
| Tasks | `/checklist` |

## Data Sources

| Section | Source | Status |
|---|---|---|
| Greeting first-name | `usersApi.me()` → `full_name` | real |
| Farm name | `{firstName}'s Farm`; future: from a setting | derived |
| Time-of-day greeting | `Date().getHours()` → morning/hapon/gabi key | derived |
| Check-in summary counts | `checklistApi.list().count`, harvest-ready batches, low-stock inventory | real |
| Tasks ring progress | mocked `0.67` constant; total = `checklistApi.count` | mock + real |
| KPI Active Setups | `setupsApi.list().count` | real |
| KPI Plant Batches | `batchesApi.list().count` | real |
| KPI Near Harvest | batches with days since `started_at` ≥ 25 (existing filter) | real |
| KPI Low Stock | `inventory.is_low_stock` filter | real |
| Alerts: pH out of range | mock 1 entry (no readings list API surfaced) | mock |
| Alerts: low stock | first low-stock inventory item | real |
| Alerts: batch ready | first harvest-ready batch | real |
| Upcoming Harvests | top 3 batches sorted by remaining days, joined with crop names | real |
| Recent Activity | static 4-row mock array | mock |

Loading: keep current pattern (data resolves; values default to 0 or empty during fetch). No skeleton screens added in v1.

Errors: silent fallback to empty / zero values (matches existing screen behavior).

## New Primitives

### `mobile/src/components/ui/progress-ring.tsx`

```ts
type Props = {
  size: number;
  strokeWidth?: number;     // default 6
  progress: number;         // 0–1
  color?: string;           // default colors.primaryLight
  trackColor?: string;      // default colors.glass
  children?: React.ReactNode; // centered label
};
```

Implementation: `react-native-svg` `Svg` + two `Circle`s. Foreground uses `strokeDasharray={c}` and `strokeDashoffset={c * (1 - progress)}` where `c = 2πr`. Rotate `-90°` so progress starts at top. `strokeLinecap="round"`. Centered child via absolute-positioned `View`.

Accessibility: `accessibilityRole="progressbar"`, `accessibilityValue={{ now: Math.round(progress*100), min: 0, max: 100 }}`.

### `mobile/src/components/ui/alert-card.tsx`

```ts
type Severity = "urgent" | "low" | "info";
type Props = {
  severity: Severity;
  icon: React.ComponentProps<typeof Ionicons>["name"];
  title: string;
  subtitle: string;
  onPress?: () => void;
  chevron?: boolean;
};
```

Implementation: existing `Card` wrapped in `Pressable`, with `borderLeftWidth: 4`, `borderLeftColor` from severity map. Layout: 40×40 tinted icon-square, title+subtitle column (flex: 1), severity pill on the right (text uppercase, tinted background), optional chevron icon.

Severity map:

| Severity | Border | Pill bg | Pill text color |
|---|---|---|---|
| urgent | `colors.error` | `colors.errorLight` | `colors.error` |
| low | `colors.warning` | `colors.warningLight` | `colors.warning` |
| info | `colors.info` | `colors.infoLight` | (no pill, chevron only) |

## Local Sub-Components (in `index.tsx`)

`HomeHeader`, `DailyCheckinCard`, `TodaysTasksCard`, `KpiGrid` (or 4× `StatCard` rendered manually), `HarvestsRow`, `ActivityRow`, `QuickActionTile`. Extracted only if a second screen needs them later (YAGNI).

`StatCard` may need an extension for the larger value treatment in the refs. Decision deferred to implementation: extend `StatCard` props if minor; otherwise inline a `KpiTile` in this file only.

## i18n

Project uses `useT()` with `en` and `tl` dicts in `mobile/src/lib/i18n.ts`. Extend the existing `home` namespace.

Add (en / tl):

```
home.greeting_morning     "Good morning! 🇵🇭"        / "Magandang umaga! 🇵🇭"
home.greeting_afternoon   "Good afternoon! 🇵🇭"      / "Magandang hapon! 🇵🇭"
home.greeting_evening     "Good evening! 🇵🇭"        / "Magandang gabi! 🇵🇭"
home.farm_suffix          "'s Farm"                  / " Farm"
home.checkin_quote        "How's your farm today? 👋"/ "Kumusta ang farm mo ngayon! 👋"
home.checkin_summary      "{tasks} tasks pending • {harvests} batches ready to check • {low} low stock"
home.todays_tasks         "Today's Tasks"            / "Mga Gawain Ngayon"
home.tasks_done_count     "{done} of {total} tasks completed today"
home.kpi.active_setups    "Active Setups"            / "Aktibong Setup"
home.kpi.plant_batches    "Plant Batches"            / "Batch ng Halaman"
home.kpi.near_harvest     "Near Harvest"             / "Malapit Anihin"
home.kpi.low_stock        "Low Stock"                / "Mababang Stock"
home.alerts               "Alerts"                   / "Mga Babala"
home.alert.severity_urgent "URGENT"                  / "URGENTE"
home.alert.severity_low   "LOW"                      / "MABABA"
home.upcoming_harvests    "Upcoming Harvests"        / "Mga Paparating na Ani"
home.see_all              "See all"                  / "Tingnan lahat"
home.days_left            "{n}d left"
home.recent_activity      "Recent Activity"          / "Kamakailang Aktibidad"
home.quick_actions        "Quick Actions"            / "Mga Mabilisang Aksyon"
home.qa.new_batch         "New Batch"                / "Bagong Batch"
home.qa.log_reading       "Log Reading"              / "Itala ang Reading"
home.qa.crop_guide        "Crop Guide"               / "Gabay sa Pananim"
home.qa.add_sale          "Add Sale"                 / "Magdagdag ng Benta"
home.qa.restock           "Restock"                  / "Punan ang Stock"
home.qa.tasks             "Tasks"                    / "Mga Gawain"
```

Existing `home.greeting`, `home.today`, etc. keys remain (some unused after rewrite — leave for now to avoid orphan-key cleanup churn).

Date format for the tasks card: `Intl.DateTimeFormat(locale, { month: 'long', day: 'numeric', year: 'numeric' }).format(new Date())`.

Greeting time logic: `<12 → morning`, `<18 → afternoon`, `else → evening`.

## Quality Bar

**Accessibility:**
- Icon-only buttons (bell, avatar) get `accessibilityLabel`.
- ProgressRing has `accessibilityRole="progressbar"` + `accessibilityValue`.
- Alert severity is conveyed by color **and** pill text + icon — not color alone.
- Touch targets ≥44pt for header buttons, alert rows, harvest cards, quick-action tiles.
- Existing dark-theme contrast already meets WCAG AA on the listed text tones.

**Performance:**
- All API data routed through `useQuery` (cache hit on tab switch).
- Horizontal harvests row uses `ScrollView horizontal` with 3 items — no virtualization needed.
- No load-time animations; rely on default `Pressable` press feedback.

**Anti-patterns avoided:**
- No emoji-as-icon (the 🇵🇭 / 👋 in greeting copy are text/locale signals, not controls).
- No hover-only states (RN — pressed feedback via `Pressable` + `colors.glassHover`).
- No fixed pixel widths (use `flex` + `gap`).
- No layout-shifting press states (opacity / background only).

## Out of Scope

- Bottom tab nav redesign (current `InteractiveMenu` with 7 tabs stays — refs show 5 icons but home-screen scope only).
- Light mode (project is dark-only currently).
- Real notification dot (mock: red dot if any alert exists in v1).
- Server-side completion tracking for tasks (ring is a mocked constant until backend supports it).
- Reading-create route (Log Reading tile points at `/checklist` until route lands).
- Skeleton loading screens (existing screens use silent fallbacks).

## Files Touched

- `mobile/src/app/(app)/index.tsx` — full rewrite
- `mobile/src/components/ui/progress-ring.tsx` — **NEW**
- `mobile/src/components/ui/alert-card.tsx` — **NEW**
- `mobile/src/lib/i18n.ts` — extend `en.home` and `tl.home`
- `mobile/src/components/ui/stat-card.tsx` — possibly extend props (decided during impl)

## Testing

- Manual smoke on iOS sim 375pt (iPhone 14) — portrait + landscape.
- Manual check with `tl` locale — all keys render.
- Verify reduced-motion off/on (no animations to gate, but confirm).
- No unit tests added: pure UI screen, no business logic worth isolating; data shapes already typed via `hydro-api.ts`.

## Acceptance Criteria

- [ ] Home screen visually matches the three reference screenshots (header, daily check-in, tasks ring, KPI 2×2, alerts, harvests row, recent activity, quick actions 3×2) within reasonable component-library fidelity.
- [ ] All copy ships in both `en` and `tl`.
- [ ] Greeting copy varies by time of day.
- [ ] All quick actions navigate to a real route (no dead taps).
- [ ] Alerts hidden when zero (no empty section header).
- [ ] No regressions in tab navigation or other tabs.

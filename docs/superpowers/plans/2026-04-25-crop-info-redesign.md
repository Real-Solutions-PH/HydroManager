# Crop Info Page Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign hero + General Info section of crop detail page to match supplied mockup. Replace key/value grid with horizontal range bands, promote `harvest_indicator` to a highlight card, and render `recommended_setups` as pill tags.

**Architecture:** Single-file rewrite of `mobile/src/app/(app)/library/crops/[id].tsx`. New helper components (`RangeBar`, `MeterRow`, `TagList`, `HarvestHighlight`, `HeroHeader`) live in same file. No backend or API changes. Range tracks render fixed display domains (e.g. pH 0-14) with green band marking the recommended range; no live measurement marker because data is reference-only.

**Tech Stack:** React Native, Expo Router, TypeScript, `@expo/vector-icons` (Ionicons), existing `Text`/`Card`/`Badge` UI primitives, `colors`/`spacing`/`radii` from `@/constants/theme`.

**Spec:** [docs/superpowers/specs/2026-04-25-crop-info-redesign-design.md](../specs/2026-04-25-crop-info-redesign-design.md)

---

## File Structure

**Modified:**
- `mobile/src/app/(app)/library/crops/[id].tsx` — full rewrite of `CropDetail`. Add internal helpers. Remove standalone `Harvest Indicator` section (promoted to highlight card). Keep `EC by Stage`, `Crop Guide`, `Tips`, `Risks`, `Source` sections.

No new files. Helpers stay local until reused.

---

## Task 1: Add range parsing helper

**Files:**
- Modify: `mobile/src/app/(app)/library/crops/[id].tsx`

- [ ] **Step 1: Add `parseRange` helper at module scope (above `CropDetailScreen`)**

```ts
function parseRange(s: string | null | undefined): [number, number] | null {
	if (!s) return null;
	const parts = s.split("-").map((p) => p.trim());
	if (parts.length !== 2) return null;
	const min = Number.parseFloat(parts[0]);
	const max = Number.parseFloat(parts[1]);
	if (Number.isNaN(min) || Number.isNaN(max)) return null;
	return [min, max];
}

function formatRange(min: number, max: number): string {
	const isInt = Number.isInteger(min) && Number.isInteger(max);
	return isInt ? `${min}-${max}` : `${min.toFixed(1)}-${max.toFixed(1)}`;
}
```

- [ ] **Step 2: Typecheck**

Run: `cd mobile && npx tsc --noEmit`
Expected: PASS (no errors)

- [ ] **Step 3: Commit**

```bash
git add mobile/src/app/\(app\)/library/crops/\[id\].tsx
git commit -m "feat(library): add range parsing helpers for crop detail"
```

---

## Task 2: Add `RangeBar` component

**Files:**
- Modify: `mobile/src/app/(app)/library/crops/[id].tsx`

- [ ] **Step 1: Add `RangeBar` below the existing `StatGrid` function**

```tsx
function RangeBar({
	min,
	max,
	domainMin,
	domainMax,
}: {
	min: number;
	max: number;
	domainMin: number;
	domainMax: number;
}) {
	const span = domainMax - domainMin;
	const safeSpan = span > 0 ? span : 1;
	const startPct = Math.max(0, Math.min(100, ((min - domainMin) / safeSpan) * 100));
	const endPct = Math.max(0, Math.min(100, ((max - domainMin) / safeSpan) * 100));
	const widthPct = Math.max(0, endPct - startPct);
	return (
		<View
			style={{
				height: 8,
				borderRadius: 999,
				backgroundColor: colors.surfaceVariant,
				overflow: "hidden",
			}}
		>
			<View
				style={{
					position: "absolute",
					left: `${startPct}%`,
					width: `${widthPct}%`,
					top: 0,
					bottom: 0,
					backgroundColor: colors.primaryLight,
					borderRadius: 999,
				}}
			/>
		</View>
	);
}
```

- [ ] **Step 2: Typecheck**

Run: `cd mobile && npx tsc --noEmit`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add mobile/src/app/\(app\)/library/crops/\[id\].tsx
git commit -m "feat(library): add RangeBar track component"
```

---

## Task 3: Add `MeterRow` component

**Files:**
- Modify: `mobile/src/app/(app)/library/crops/[id].tsx`

- [ ] **Step 1: Add `MeterRow` below `RangeBar`**

```tsx
function MeterRow({
	icon,
	iconColor,
	label,
	sublabel,
	value,
	unit,
	min,
	max,
	domainMin,
	domainMax,
}: {
	icon: keyof typeof Ionicons.glyphMap;
	iconColor: string;
	label: string;
	sublabel: string;
	value: string;
	unit: string;
	min: number;
	max: number;
	domainMin: number;
	domainMax: number;
}) {
	return (
		<View style={{ flexDirection: "row", gap: spacing.sm, alignItems: "center" }}>
			<View
				style={{
					width: 44,
					height: 44,
					borderRadius: 22,
					backgroundColor: colors.surfaceVariant,
					alignItems: "center",
					justifyContent: "center",
				}}
			>
				<Ionicons name={icon} size={22} color={iconColor} />
			</View>
			<View style={{ flex: 1, gap: 6 }}>
				<View
					style={{
						flexDirection: "row",
						justifyContent: "space-between",
						alignItems: "flex-end",
					}}
				>
					<View style={{ flex: 1 }}>
						<Text size="md" weight="semibold">
							{label}
						</Text>
						<Text size="xs" tone="muted">
							{sublabel}
						</Text>
					</View>
					<View style={{ alignItems: "flex-end" }}>
						<Text size="md" weight="bold">
							{value}
						</Text>
						<Text size="xs" tone="muted">
							{unit}
						</Text>
					</View>
				</View>
				<RangeBar
					min={min}
					max={max}
					domainMin={domainMin}
					domainMax={domainMax}
				/>
			</View>
		</View>
	);
}
```

- [ ] **Step 2: Typecheck**

Run: `cd mobile && npx tsc --noEmit`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add mobile/src/app/\(app\)/library/crops/\[id\].tsx
git commit -m "feat(library): add MeterRow component for crop range display"
```

---

## Task 4: Add `TagList` component

**Files:**
- Modify: `mobile/src/app/(app)/library/crops/[id].tsx`

- [ ] **Step 1: Add `TagList` below `MeterRow`**

```tsx
function TagList({ value }: { value: string | null | undefined }) {
	if (!value) return null;
	const tags = value
		.split(",")
		.map((t) => t.trim())
		.filter((t) => t.length > 0);
	if (tags.length === 0) return null;
	return (
		<View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.xs }}>
			{tags.map((tag) => (
				<View
					key={tag}
					style={{
						paddingHorizontal: spacing.sm,
						paddingVertical: 6,
						borderRadius: 999,
						borderWidth: 1,
						borderColor: colors.primaryLight,
						backgroundColor: `${colors.primaryLight}26`,
					}}
				>
					<Text
						size="sm"
						weight="semibold"
						style={{ color: colors.primaryLight }}
					>
						{tag}
					</Text>
				</View>
			))}
		</View>
	);
}
```

- [ ] **Step 2: Typecheck**

Run: `cd mobile && npx tsc --noEmit`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add mobile/src/app/\(app\)/library/crops/\[id\].tsx
git commit -m "feat(library): add TagList component for crop setups"
```

---

## Task 5: Add `HarvestHighlight` card

**Files:**
- Modify: `mobile/src/app/(app)/library/crops/[id].tsx`

- [ ] **Step 1: Add `HarvestHighlight` below `TagList`**

```tsx
function HarvestHighlight({ text }: { text: string | null }) {
	if (!text) return null;
	return (
		<Card variant="outlined">
			<View style={{ flexDirection: "row", gap: spacing.sm, alignItems: "center" }}>
				<View
					style={{
						width: 40,
						height: 40,
						borderRadius: 20,
						backgroundColor: `${colors.primaryLight}26`,
						alignItems: "center",
						justifyContent: "center",
					}}
				>
					<Ionicons name="bulb-outline" size={20} color={colors.primaryLight} />
				</View>
				<View style={{ flex: 1 }}>
					<Text size="xs" tone="muted" weight="semibold" style={{ textTransform: "uppercase", letterSpacing: 0.5 }}>
						Harvest Indicator
					</Text>
					<Text size="sm" tone="subtle" style={{ marginTop: 2 }}>
						{text}
					</Text>
				</View>
			</View>
		</Card>
	);
}
```

- [ ] **Step 2: Typecheck**

Run: `cd mobile && npx tsc --noEmit`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add mobile/src/app/\(app\)/library/crops/\[id\].tsx
git commit -m "feat(library): add HarvestHighlight card component"
```

---

## Task 6: Add `HeroHeader` component

**Files:**
- Modify: `mobile/src/app/(app)/library/crops/[id].tsx`

- [ ] **Step 1: Add import for `radii` at top of file**

Find existing import:

```ts
import { colors, spacing } from "@/constants/theme";
```

Replace with:

```ts
import { colors, radii, spacing } from "@/constants/theme";
```

- [ ] **Step 2: Add `HeroHeader` below `HarvestHighlight`**

```tsx
function HeroHeader({
	imageUrl,
	onBack,
}: {
	imageUrl: string | null;
	onBack: () => void;
}) {
	return (
		<View
			style={{
				height: 240,
				borderRadius: radii.xxl,
				overflow: "hidden",
				backgroundColor: colors.surfaceVariant,
			}}
		>
			{imageUrl ? (
				<Image
					source={{ uri: imageUrl }}
					style={{ width: "100%", height: "100%" }}
				/>
			) : null}
			<Pressable
				onPress={onBack}
				hitSlop={8}
				style={{
					position: "absolute",
					top: spacing.sm,
					left: spacing.sm,
					width: 40,
					height: 40,
					borderRadius: 20,
					backgroundColor: "rgba(0,0,0,0.45)",
					alignItems: "center",
					justifyContent: "center",
				}}
			>
				<Ionicons name="chevron-back" size={22} color={colors.text} />
			</Pressable>
		</View>
	);
}
```

- [ ] **Step 3: Typecheck**

Run: `cd mobile && npx tsc --noEmit`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add mobile/src/app/\(app\)/library/crops/\[id\].tsx
git commit -m "feat(library): add HeroHeader component for crop detail"
```

---

## Task 7: Rewrite `CropDetail` general info + remove standalone harvest section

**Files:**
- Modify: `mobile/src/app/(app)/library/crops/[id].tsx`

- [ ] **Step 1: Replace the entire `CropDetail` function body**

Replace the existing `CropDetail` function (currently lines 44-249) with:

```tsx
function CropDetail({
	crop,
	onBack,
}: {
	crop: CropGuide;
	onBack: () => void;
}) {
	const sunlightRange = parseRange(crop.sunlight_hours);
	const growlightRange = parseRange(crop.growlight_hours);
	const dayTempRange = parseRange(crop.temperature_day_c);
	const nightTempRange = parseRange(crop.temperature_night_c);
	const waterTempRange = parseRange(crop.water_temp_c);
	const humidityRange = parseRange(crop.humidity_pct);

	type MeterDef = {
		key: string;
		icon: keyof typeof Ionicons.glyphMap;
		iconColor: string;
		label: string;
		sublabel: string;
		min: number;
		max: number;
		domainMin: number;
		domainMax: number;
		unit: string;
	};

	const meters: MeterDef[] = [];
	meters.push({
		key: "ph",
		icon: "water-outline",
		iconColor: colors.info,
		label: "pH",
		sublabel: "Soil/water pH",
		min: crop.ph_min,
		max: crop.ph_max,
		domainMin: 0,
		domainMax: 14,
		unit: "(pH)",
	});
	meters.push({
		key: "ec",
		icon: "flash-outline",
		iconColor: colors.warning,
		label: "EC",
		sublabel: "Nutrient strength",
		min: crop.ec_min,
		max: crop.ec_max,
		domainMin: 0,
		domainMax: 4,
		unit: "(mS/cm)",
	});
	if (sunlightRange) {
		meters.push({
			key: "sunlight",
			icon: "sunny-outline",
			iconColor: colors.warning,
			label: "Sunlight",
			sublabel: "Daily hours",
			min: sunlightRange[0],
			max: sunlightRange[1],
			domainMin: 0,
			domainMax: 24,
			unit: "(h)",
		});
	}
	if (growlightRange) {
		meters.push({
			key: "growlight",
			icon: "bulb-outline",
			iconColor: colors.primaryLight,
			label: "Growlight",
			sublabel: "Supplemental hours",
			min: growlightRange[0],
			max: growlightRange[1],
			domainMin: 0,
			domainMax: 24,
			unit: "(h)",
		});
	}
	if (dayTempRange) {
		meters.push({
			key: "day-temp",
			icon: "thermometer-outline",
			iconColor: colors.error,
			label: "Day temp",
			sublabel: "Air temperature",
			min: dayTempRange[0],
			max: dayTempRange[1],
			domainMin: 0,
			domainMax: 40,
			unit: "(°C)",
		});
	}
	if (nightTempRange) {
		meters.push({
			key: "night-temp",
			icon: "moon-outline",
			iconColor: colors.info,
			label: "Night temp",
			sublabel: "Air temperature",
			min: nightTempRange[0],
			max: nightTempRange[1],
			domainMin: 0,
			domainMax: 40,
			unit: "(°C)",
		});
	}
	if (waterTempRange) {
		meters.push({
			key: "water-temp",
			icon: "water",
			iconColor: colors.info,
			label: "Water temp",
			sublabel: "Reservoir",
			min: waterTempRange[0],
			max: waterTempRange[1],
			domainMin: 0,
			domainMax: 40,
			unit: "(°C)",
		});
	}
	if (humidityRange) {
		meters.push({
			key: "humidity",
			icon: "cloud-outline",
			iconColor: colors.info,
			label: "Humidity",
			sublabel: "Relative humidity",
			min: humidityRange[0],
			max: humidityRange[1],
			domainMin: 0,
			domainMax: 100,
			unit: "(%)",
		});
	}
	meters.push({
		key: "harvest",
		icon: "leaf-outline",
		iconColor: colors.primaryLight,
		label: "Days to harvest",
		sublabel: "Crop cycle",
		min: crop.days_to_harvest_min,
		max: crop.days_to_harvest_max,
		domainMin: 0,
		domainMax: 120,
		unit: "(days)",
	});
	if (
		crop.local_price_php_per_kg_min !== null &&
		crop.local_price_php_per_kg_max !== null
	) {
		meters.push({
			key: "price",
			icon: "cash-outline",
			iconColor: colors.success,
			label: "Local price",
			sublabel: "PHP per kg",
			min: crop.local_price_php_per_kg_min,
			max: crop.local_price_php_per_kg_max,
			domainMin: 0,
			domainMax: 500,
			unit: "(₱/kg)",
		});
	}

	return (
		<View style={{ gap: spacing.md }}>
			<HeroHeader imageUrl={crop.image_url} onBack={onBack} />

			<View>
				<Text size="xxl" weight="bold">
					{crop.name_en}
				</Text>
				<Text size="sm" tone="muted">
					{crop.name_tl} · {crop.category}
				</Text>
			</View>

			<HarvestHighlight text={crop.harvest_indicator} />

			<Section title="General Info">
				<View style={{ gap: spacing.md }}>
					{meters.map((m) => (
						<MeterRow
							key={m.key}
							icon={m.icon}
							iconColor={m.iconColor}
							label={m.label}
							sublabel={m.sublabel}
							value={formatRange(m.min, m.max)}
							unit={m.unit}
							min={m.min}
							max={m.max}
							domainMin={m.domainMin}
							domainMax={m.domainMax}
						/>
					))}
					{crop.typical_yield_grams != null ? (
						<View style={{ flexDirection: "row", justifyContent: "space-between" }}>
							<View>
								<Text size="md" weight="semibold">
									Typical yield
								</Text>
								<Text size="xs" tone="muted">
									Per plant
								</Text>
							</View>
							<Text size="md" weight="bold">
								{crop.typical_yield_grams}g
							</Text>
						</View>
					) : null}
				</View>
			</Section>

			{crop.recommended_setups ? (
				<Section title="Setups">
					<TagList value={crop.recommended_setups} />
				</Section>
			) : null}

			{crop.ec_seedling != null ||
			crop.ec_vegetative != null ||
			crop.ec_mature != null ||
			crop.ec_fruiting != null ? (
				<Section title="EC by Stage">
					<StatGrid
						stats={[
							{
								label: "Seedling",
								value:
									crop.ec_seedling != null ? String(crop.ec_seedling) : null,
							},
							{
								label: "Vegetative",
								value:
									crop.ec_vegetative != null
										? String(crop.ec_vegetative)
										: null,
							},
							{
								label: "Mature",
								value: crop.ec_mature != null ? String(crop.ec_mature) : null,
							},
							{
								label: "Fruiting",
								value:
									crop.ec_fruiting != null ? String(crop.ec_fruiting) : null,
							},
						]}
					/>
				</Section>
			) : null}

			{crop.growth_stages?.length ? (
				<Section title="Crop Guide">
					<View style={{ gap: spacing.sm }}>
						{crop.growth_stages.map((stage, i) => (
							<Card key={`${stage.stage}-${stage.day_min}`} variant="outlined">
								<View
									style={{
										flexDirection: "row",
										justifyContent: "space-between",
										marginBottom: 4,
									}}
								>
									<Text size="md" weight="semibold">
										{i + 1}. {stage.stage}
									</Text>
									<Text size="xs" tone="muted">
										Day {stage.day_min}-{stage.day_max}
									</Text>
								</View>
								<Text size="sm" tone="subtle">
									{stage.description}
								</Text>
								{stage.actions?.length ? (
									<View style={{ marginTop: spacing.xs, gap: 2 }}>
										{stage.actions.map((a) => (
											<Text
												key={`${stage.stage}-action-${a}`}
												size="xs"
												tone="muted"
											>
												• {a}
											</Text>
										))}
									</View>
								) : null}
							</Card>
						))}
					</View>
				</Section>
			) : null}

			{crop.tips?.length ? (
				<Section title="Tips">
					<Card variant="outlined">
						<View style={{ gap: spacing.xs }}>
							{crop.tips.map((tip) => (
								<View
									key={`tip-${tip}`}
									style={{ flexDirection: "row", gap: spacing.xs }}
								>
									<Text
										size="md"
										weight="bold"
										style={{ color: colors.primaryLight }}
									>
										•
									</Text>
									<Text size="sm" tone="subtle" style={{ flex: 1 }}>
										{tip}
									</Text>
								</View>
							))}
						</View>
					</Card>
				</Section>
			) : null}

			{crop.risks?.length ? (
				<Section title="Risks & Mitigation">
					<View style={{ gap: spacing.sm }}>
						{crop.risks.map((risk) => (
							<Card key={`risk-${risk.title}`} variant="outlined">
								<Text
									size="md"
									weight="semibold"
									style={{ color: colors.warning }}
								>
									{risk.title}
								</Text>
								<Text size="sm" tone="subtle" style={{ marginTop: 4 }}>
									{risk.description}
								</Text>
								<Text
									size="xs"
									tone="muted"
									style={{ marginTop: spacing.xs, fontStyle: "italic" }}
								>
									Mitigation: {risk.mitigation}
								</Text>
							</Card>
						))}
					</View>
				</Section>
			) : null}

			{crop.source ? (
				<Text size="xs" tone="muted" style={{ marginTop: spacing.md }}>
					Source: {crop.source}
				</Text>
			) : null}
		</View>
	);
}
```

- [ ] **Step 2: Update `CropDetailScreen` to pass `onBack` and remove now-redundant back button**

Replace existing `CropDetailScreen` (currently lines 12-42) with:

```tsx
export default function CropDetailScreen() {
	const { id } = useLocalSearchParams<{ id: string }>();
	const router = useRouter();
	const { data: crop, isLoading } = useCrop(id);

	return (
		<GradientBackground>
			<ScrollView
				contentContainerStyle={{
					padding: spacing.md,
					paddingBottom: spacing.jumbo * 2,
					gap: spacing.md,
				}}
			>
				{isLoading || !crop ? (
					<Text tone="muted">Loading...</Text>
				) : (
					<CropDetail crop={crop} onBack={() => router.back()} />
				)}
			</ScrollView>
		</GradientBackground>
	);
}
```

- [ ] **Step 3: Remove unused `Badge` import**

The original used `Badge` for category/days/price chips. New design removes those. Find:

```ts
import { Badge } from "@/components/ui/badge";
```

Delete this line.

- [ ] **Step 4: Typecheck**

Run: `cd mobile && npx tsc --noEmit`
Expected: PASS (no errors, no unused-import warnings about `Badge`)

- [ ] **Step 5: Commit**

```bash
git add mobile/src/app/\(app\)/library/crops/\[id\].tsx
git commit -m "feat(library): redesign crop detail hero and general info

Replace stat grid with horizontal range bands. Promote harvest
indicator to highlight card. Render recommended_setups as pill tags."
```

---

## Task 8: Manual visual verification

**Files:** none

- [ ] **Step 1: Start mobile dev server**

Run: `cd mobile && npx expo start`

- [ ] **Step 2: Open app, navigate Library → Crops → pick a crop with full data**

Pick any crop seeded with `harvest_indicator`, `recommended_setups`, and string range fields populated (check `backend/app/modules/library_seed_data/crops.json` for one).

- [ ] **Step 3: Verify against mockup**

Check:
- Hero image renders with rounded corners and circular back button overlay top-left
- Title shows `name_en`; sublabel shows `name_tl · category`
- Harvest highlight card renders with bulb icon and "HARVEST INDICATOR" label
- Each meter row shows: circular icon badge, label + sublabel left, value + unit right, green range band below
- Range band fills correct portion of track (e.g. pH 5.5-6.5 fills middle of 0-14 track)
- Setups appear as pill tags
- Sections below (EC by Stage, Crop Guide, Tips, Risks) still render

- [ ] **Step 4: Test edge case — crop with null `harvest_indicator`**

Pick a crop where `harvest_indicator` is null in seed data.
Expected: highlight card omitted; no empty space.

- [ ] **Step 5: Test edge case — crop with unparseable string ranges**

If any seed crop has malformed `temperature_day_c` (e.g. `"warm"`), confirm the row is omitted rather than crashing.

If no such crop exists, skip this check.

---

## Self-Review Notes

- **Spec coverage:** Hero ✓ (Task 6,7), title sublabel ✓ (Task 7), harvest highlight ✓ (Task 5,7), range rows for all listed metrics ✓ (Task 7), tags for setups ✓ (Task 4,7), removal of standalone harvest section ✓ (Task 7), preservation of EC/Guide/Tips/Risks ✓ (Task 7).
- **No marker per Q1 decision** — `RangeBar` renders only the green band, no triangle.
- **No buttons per D2** — only back button on hero.
- **Type consistency** — `MeterDef.icon` typed as `keyof typeof Ionicons.glyphMap`; matches `MeterRow` prop.
- **Placeholder scan:** none.

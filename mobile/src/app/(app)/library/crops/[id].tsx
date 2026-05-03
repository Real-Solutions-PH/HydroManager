import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo } from "react";
import { Image, Pressable, ScrollView, View } from "react-native";
import { Card } from "@/components/ui/card";
import { GradientBackground } from "@/components/ui/gradient-background";
import { Text } from "@/components/ui/text";
import { colors, radii, spacing, systemTypes } from "@/constants/theme";
import { useBack } from "@/hooks/use-back";
import { useCrop, useCropStats } from "@/hooks/use-library";
import type { CropGuide, CropStatValue } from "@/lib/hydro-api";

function parseRange(s: string | null | undefined): [number, number] | null {
	if (!s) return null;
	const parts = s.split("-").map((p) => p.trim());
	if (parts.length !== 2) return null;
	const min = Number.parseFloat(parts[0]);
	const max = Number.parseFloat(parts[1]);
	if (Number.isNaN(min) || Number.isNaN(max)) return null;
	if (min > max) return null;
	return [min, max];
}

function formatRange(min: number, max: number): string {
	const isInt = Number.isInteger(min) && Number.isInteger(max);
	return isInt ? `${min}-${max}` : `${min.toFixed(1)}-${max.toFixed(1)}`;
}

function paddedDomain(stat: { min: number; max: number }): [number, number] {
	const spread = stat.max - stat.min;
	const tightThreshold = Math.abs(stat.max) * 0.1;
	if (spread <= tightThreshold) {
		const mid = (stat.min + stat.max) / 2;
		const halfWidth = Math.max(Math.abs(mid) * 0.2, 1);
		return [mid - halfWidth, mid + halfWidth];
	}
	return [stat.min - spread * 0.1, stat.max + spread * 0.1];
}

function tryParseRange(
	field: string,
	value: string | null | undefined,
): [number, number] | null {
	const result = parseRange(value);
	if (__DEV__ && value && !result) {
		console.warn(
			`[crop-detail] Failed to parse range for "${field}": ${JSON.stringify(value)}`,
		);
	}
	return result;
}

export default function CropDetailScreen() {
	const { id } = useLocalSearchParams<{ id: string }>();
	const _router = useRouter();
	const goBack = useBack();
	const { data: crop, isLoading } = useCrop(id);
	const { data: statsResponse } = useCropStats();

	return (
		<GradientBackground>
			<ScrollView
				contentContainerStyle={{
					paddingBottom: spacing.jumbo * 2,
				}}
			>
				{isLoading || !crop ? (
					<View style={{ padding: spacing.md }}>
						<Text tone="muted">Loading...</Text>
					</View>
				) : (
					<CropDetail
						crop={crop}
						stats={statsResponse?.stats ?? {}}
						onBack={goBack}
					/>
				)}
			</ScrollView>
		</GradientBackground>
	);
}

function CropDetail({
	crop,
	stats,
	onBack,
}: {
	crop: CropGuide;
	stats: Record<string, CropStatValue>;
	onBack: () => void;
}) {
	const sunlightRange = tryParseRange("sunlight_hours", crop.sunlight_hours);
	const growlightRange = tryParseRange("growlight_hours", crop.growlight_hours);
	const dayTempRange = tryParseRange(
		"temperature_day_c",
		crop.temperature_day_c,
	);
	const nightTempRange = tryParseRange(
		"temperature_night_c",
		crop.temperature_night_c,
	);
	const waterTempRange = tryParseRange("water_temp_c", crop.water_temp_c);
	const humidityRange = tryParseRange("humidity_pct", crop.humidity_pct);

	function domainFor(
		statKey: string,
		fallbackMin: number,
		fallbackMax: number,
	): { domainMin: number; domainMax: number; avg: number | undefined } {
		const stat = stats[statKey];
		if (!stat) {
			return {
				domainMin: fallbackMin,
				domainMax: fallbackMax,
				avg: undefined,
			};
		}
		const [domainMin, domainMax] = paddedDomain(stat);
		return { domainMin, domainMax, avg: stat.avg };
	}

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
		avg?: number;
		unit: string;
	};

	const meters = useMemo<MeterDef[]>(() => {
		const arr: MeterDef[] = [];
		{
			const d = domainFor("ph", 0, 14);
			arr.push({
				key: "ph",
				icon: "water-outline",
				iconColor: colors.info,
				label: "pH",
				sublabel: "Soil/water pH",
				min: crop.ph_min,
				max: crop.ph_max,
				domainMin: d.domainMin,
				domainMax: d.domainMax,
				avg: d.avg,
				unit: "(pH)",
			});
		}
		{
			const d = domainFor("ec", 0, 4);
			arr.push({
				key: "ec",
				icon: "flash-outline",
				iconColor: colors.warning,
				label: "EC",
				sublabel: "Nutrient strength",
				min: crop.ec_min,
				max: crop.ec_max,
				domainMin: d.domainMin,
				domainMax: d.domainMax,
				avg: d.avg,
				unit: "(mS/cm)",
			});
		}
		if (sunlightRange) {
			const d = domainFor("sunlight_hours", 0, 24);
			arr.push({
				key: "sunlight",
				icon: "sunny-outline",
				iconColor: colors.warning,
				label: "Sunlight",
				sublabel: "Daily hours",
				min: sunlightRange[0],
				max: sunlightRange[1],
				domainMin: d.domainMin,
				domainMax: d.domainMax,
				avg: d.avg,
				unit: "(h)",
			});
		}
		if (growlightRange) {
			const d = domainFor("growlight_hours", 0, 24);
			arr.push({
				key: "growlight",
				icon: "bulb-outline",
				iconColor: colors.primaryLight,
				label: "Growlight",
				sublabel: "Supplemental hours",
				min: growlightRange[0],
				max: growlightRange[1],
				domainMin: d.domainMin,
				domainMax: d.domainMax,
				avg: d.avg,
				unit: "(h)",
			});
		}
		if (dayTempRange) {
			const d = domainFor("temperature_day_c", 0, 40);
			arr.push({
				key: "day-temp",
				icon: "thermometer-outline",
				iconColor: colors.error,
				label: "Day temp",
				sublabel: "Air temperature",
				min: dayTempRange[0],
				max: dayTempRange[1],
				domainMin: d.domainMin,
				domainMax: d.domainMax,
				avg: d.avg,
				unit: "(°C)",
			});
		}
		if (nightTempRange) {
			const d = domainFor("temperature_night_c", 0, 40);
			arr.push({
				key: "night-temp",
				icon: "moon-outline",
				iconColor: colors.info,
				label: "Night temp",
				sublabel: "Air temperature",
				min: nightTempRange[0],
				max: nightTempRange[1],
				domainMin: d.domainMin,
				domainMax: d.domainMax,
				avg: d.avg,
				unit: "(°C)",
			});
		}
		if (waterTempRange) {
			const d = domainFor("water_temp_c", 0, 40);
			arr.push({
				key: "water-temp",
				icon: "water",
				iconColor: colors.info,
				label: "Water temp",
				sublabel: "Reservoir",
				min: waterTempRange[0],
				max: waterTempRange[1],
				domainMin: d.domainMin,
				domainMax: d.domainMax,
				avg: d.avg,
				unit: "(°C)",
			});
		}
		if (humidityRange) {
			const d = domainFor("humidity_pct", 0, 100);
			arr.push({
				key: "humidity",
				icon: "cloud-outline",
				iconColor: colors.info,
				label: "Humidity",
				sublabel: "Relative humidity",
				min: humidityRange[0],
				max: humidityRange[1],
				domainMin: d.domainMin,
				domainMax: d.domainMax,
				avg: d.avg,
				unit: "(%)",
			});
		}
		{
			const d = domainFor("days_to_harvest", 0, 120);
			arr.push({
				key: "harvest",
				icon: "leaf-outline",
				iconColor: colors.primaryLight,
				label: "Days to harvest",
				sublabel: "Crop cycle",
				min: crop.days_to_harvest_min,
				max: crop.days_to_harvest_max,
				domainMin: d.domainMin,
				domainMax: d.domainMax,
				avg: d.avg,
				unit: "(days)",
			});
		}
		if (
			crop.local_price_php_per_kg_min !== null &&
			crop.local_price_php_per_kg_max !== null
		) {
			const d = domainFor("local_price_php_per_kg", 0, 500);
			arr.push({
				key: "price",
				icon: "cash-outline",
				iconColor: colors.success,
				label: "Local price",
				sublabel: "PHP per kg",
				min: crop.local_price_php_per_kg_min,
				max: crop.local_price_php_per_kg_max,
				domainMin: d.domainMin,
				domainMax: d.domainMax,
				avg: d.avg,
				unit: "(₱/kg)",
			});
		}
		if (crop.typical_yield_grams != null) {
			const d = domainFor(
				"typical_yield_grams",
				0,
				Math.max(1000, crop.typical_yield_grams * 1.2),
			);
			arr.push({
				key: "yield",
				icon: "leaf",
				iconColor: colors.primaryLight,
				label: "Typical yield",
				sublabel: "Per plant",
				min: crop.typical_yield_grams,
				max: crop.typical_yield_grams,
				domainMin: d.domainMin,
				domainMax: d.domainMax,
				avg: d.avg,
				unit: "(g)",
			});
		}
		return arr;
	}, [
		crop,
		dayTempRange,
		domainFor,
		growlightRange,
		humidityRange,
		nightTempRange,
		sunlightRange,
		waterTempRange,
	]);

	return (
		<View style={{ gap: spacing.md }}>
			<HeroHeader
				imageUrl={crop.image_url}
				onBack={onBack}
				setups={crop.recommended_setups}
			/>

			<View style={{ paddingHorizontal: spacing.md, gap: spacing.md }}>
				<View>
					<Text size="xxl" weight="bold">
						{crop.name_en}
					</Text>
					<Text size="sm" tone="muted">
						{crop.name_tl} · {crop.category}
					</Text>
				</View>

				<HarvestHighlight text={crop.harvest_indicator} />

				<Section title="General Info" icon="information-circle">
					<View style={{ gap: spacing.md }}>
						{meters.map((m) => (
							<MeterRow
								key={m.key}
								icon={m.icon}
								iconColor={m.iconColor}
								label={m.label}
								sublabel={m.sublabel}
								value={m.min === m.max ? `${m.min}` : formatRange(m.min, m.max)}
								unit={m.unit}
								min={m.min}
								max={m.max}
								domainMin={m.domainMin}
								domainMax={m.domainMax}
								avg={m.avg}
							/>
						))}
					</View>
				</Section>

				{crop.ec_seedling != null ||
				crop.ec_vegetative != null ||
				crop.ec_mature != null ||
				crop.ec_fruiting != null ? (
					<Section title="EC by Stage" icon="flask">
						<EcStageGrid
							stages={[
								{
									label: "Seedling",
									value:
										crop.ec_seedling != null ? String(crop.ec_seedling) : null,
									icon: "leaf-outline",
								},
								{
									label: "Vegetative",
									value:
										crop.ec_vegetative != null
											? String(crop.ec_vegetative)
											: null,
									icon: "leaf",
								},
								{
									label: "Mature",
									value: crop.ec_mature != null ? String(crop.ec_mature) : null,
									icon: "flower-outline",
								},
								{
									label: "Fruiting",
									value:
										crop.ec_fruiting != null ? String(crop.ec_fruiting) : null,
									icon: "nutrition",
								},
							]}
						/>
					</Section>
				) : null}

				{crop.growth_stages?.length ? (
					<Section title="Crop Guide" icon="git-branch">
						<View>
							{crop.growth_stages.map((stage, i) => {
								const isLast = i === crop.growth_stages!.length - 1;
								return (
									<View
										key={`${stage.stage}-${stage.day_min}`}
										style={{ flexDirection: "row" }}
									>
										<View
											style={{
												width: 32,
												alignItems: "center",
												paddingTop: 6,
											}}
										>
											<View
												style={{
													width: 24,
													height: 24,
													borderRadius: 12,
													backgroundColor: colors.primary,
													borderWidth: 2,
													borderColor: colors.primaryDeep,
													alignItems: "center",
													justifyContent: "center",
												}}
											>
												<Text
													size="xs"
													weight="bold"
													style={{ color: colors.text }}
												>
													{i + 1}
												</Text>
											</View>
											{!isLast ? (
												<View
													style={{
														flex: 1,
														width: 2,
														backgroundColor: colors.primaryDark,
														marginTop: 4,
														opacity: 0.6,
													}}
												/>
											) : null}
										</View>
										<View
											style={{
												flex: 1,
												paddingLeft: spacing.sm,
												paddingBottom: isLast ? 0 : spacing.md,
											}}
										>
											<View
												style={{
													alignSelf: "flex-start",
													backgroundColor: colors.successLight,
													borderWidth: 1,
													borderColor: colors.primary,
													borderRadius: radii.full,
													paddingHorizontal: spacing.sm,
													paddingVertical: 2,
													marginBottom: spacing.xs,
												}}
											>
												<Text
													size="sm"
													weight="bold"
													style={{ color: colors.primaryLight }}
												>
													Day {stage.day_min}–{stage.day_max}
												</Text>
											</View>
											<Card variant="outlined">
												<Text
													size="md"
													weight="semibold"
													style={{ marginBottom: 4 }}
												>
													{stage.stage}
												</Text>
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
										</View>
									</View>
								);
							})}
						</View>
					</Section>
				) : null}

				{crop.tips?.length ? (
					<Section title="Tips" icon="bulb" iconColor={colors.warning}>
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
					<Section title="Risks & Mitigation" icon="warning" iconColor={colors.warning}>
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
		</View>
	);
}

function Section({
	title,
	icon,
	iconColor,
	children,
}: {
	title: string;
	icon?: keyof typeof Ionicons.glyphMap;
	iconColor?: string;
	children: React.ReactNode;
}) {
	return (
		<View style={{ gap: spacing.xs }}>
			<View
				style={{
					flexDirection: "row",
					alignItems: "center",
					gap: spacing.xs,
				}}
			>
				{icon ? (
					<Ionicons
						name={icon}
						size={20}
						color={iconColor ?? colors.primaryLight}
					/>
				) : null}
				<Text size="lg" weight="semibold">
					{title}
				</Text>
			</View>
			{children}
		</View>
	);
}

const RANGE_BAR_SEGMENTS = 5;

function RangeBar({
	min,
	max,
	domainMin,
	domainMax,
	avg,
}: {
	min: number;
	max: number;
	domainMin: number;
	domainMax: number;
	avg?: number;
}) {
	const lo = Math.min(min, max);
	const hi = Math.max(min, max);
	const span = domainMax - domainMin;
	const safeSpan = span > 0 ? span : 1;
	const segmentSpan = safeSpan / RANGE_BAR_SEGMENTS;
	const showAvg = avg !== undefined && avg >= domainMin && avg <= domainMax;
	const avgPct = showAvg ? ((avg - domainMin) / safeSpan) * 100 : 0;
	return (
		<View>
			{showAvg ? (
				<View
					style={{
						height: 8,
						marginBottom: 2,
						position: "relative",
					}}
				>
					<View
						style={{
							position: "absolute",
							left: `${avgPct}%`,
							marginLeft: -5,
							width: 0,
							height: 0,
							borderLeftWidth: 5,
							borderRightWidth: 5,
							borderTopWidth: 6,
							borderLeftColor: "transparent",
							borderRightColor: "transparent",
							borderTopColor: colors.text,
						}}
					/>
				</View>
			) : null}
			<View style={{ flexDirection: "row", gap: 4 }}>
				{Array.from({ length: RANGE_BAR_SEGMENTS }).map((_, i) => {
					const segStart = domainMin + i * segmentSpan;
					const segEnd = segStart + segmentSpan;
					const inRange = segEnd > lo && segStart < hi;
					return (
						<View
							key={`seg-${i}`}
							style={{
								flex: 1,
								height: 8,
								borderRadius: 999,
								backgroundColor: inRange
									? colors.primaryLight
									: colors.surfaceVariant,
							}}
						/>
					);
				})}
			</View>
		</View>
	);
}

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
	avg,
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
	avg?: number;
}) {
	return (
		<View
			style={{ flexDirection: "row", gap: spacing.sm, alignItems: "center" }}
		>
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
					avg={avg}
				/>
			</View>
		</View>
	);
}

function HarvestHighlight({ text }: { text: string | null }) {
	if (!text) return null;
	return (
		<Card variant="outlined">
			<View
				style={{ flexDirection: "row", gap: spacing.sm, alignItems: "center" }}
			>
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
					<Text
						size="xs"
						tone="muted"
						weight="semibold"
						style={{ textTransform: "uppercase", letterSpacing: 0.5 }}
					>
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

function HeroHeader({
	imageUrl,
	onBack,
	setups,
}: {
	imageUrl: string | null;
	onBack: () => void;
	setups?: string | null;
}) {
	const setupTags = setups
		? setups
				.split(",")
				.map((t) => t.trim())
				.filter((t) => t.length > 0)
		: [];
	return (
		<View
			style={{
				height: 280,
				borderBottomLeftRadius: radii.xxl,
				borderBottomRightRadius: radii.xxl,
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
					top: spacing.lg,
					left: spacing.md,
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
			{setupTags.length > 0 ? (
				<View
					style={{
						position: "absolute",
						left: spacing.md,
						right: spacing.md,
						bottom: spacing.md,
						flexDirection: "row",
						flexWrap: "wrap",
						gap: spacing.xs,
					}}
				>
					{setupTags.map((tag) => {
						const meta = systemTypes[tag as keyof typeof systemTypes];
						const color = meta?.color ?? colors.primaryLight;
						const bg = meta?.bg ?? `${colors.primaryLight}26`;
						return (
							<View
								key={tag}
								style={{
									paddingHorizontal: spacing.sm,
									paddingVertical: 6,
									borderRadius: 999,
									borderWidth: 1,
									borderColor: color,
									backgroundColor: bg,
								}}
							>
								<Text size="sm" weight="semibold" style={{ color }}>
									{tag}
								</Text>
							</View>
						);
					})}
				</View>
			) : null}
		</View>
	);
}

function EcStageGrid({
	stages,
}: {
	stages: {
		label: string;
		value: string | null | undefined;
		icon: keyof typeof Ionicons.glyphMap;
	}[];
}) {
	const visible = stages.filter((s) => s.value);
	return (
		<View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
			{visible.map((s) => (
				<Card
					key={s.label}
					variant="outlined"
					style={{
						flexGrow: 1,
						flexBasis: "47%",
						minWidth: 130,
						gap: spacing.xs,
					}}
				>
					<View
						style={{
							flexDirection: "row",
							alignItems: "center",
							gap: spacing.xs,
						}}
					>
						<View
							style={{
								width: 32,
								height: 32,
								borderRadius: radii.full,
								backgroundColor: colors.successLight,
								alignItems: "center",
								justifyContent: "center",
							}}
						>
							<Ionicons name={s.icon} size={18} color={colors.primaryLight} />
						</View>
						<Text
							size="xs"
							tone="muted"
							style={{ textTransform: "uppercase", letterSpacing: 0.5 }}
						>
							{s.label}
						</Text>
					</View>
					<Text size="xl" weight="bold">
						{s.value}
					</Text>
					<Text size="xs" tone="muted">
						EC mS/cm
					</Text>
				</Card>
			))}
		</View>
	);
}

function StatGrid({
	stats,
}: {
	stats: { label: string; value: string | null | undefined }[];
}) {
	const visible = stats.filter((s) => s.value);
	return (
		<View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.md }}>
			{visible.map((s) => (
				<View key={s.label} style={{ minWidth: "30%" }}>
					<Text
						size="xs"
						tone="muted"
						style={{ textTransform: "uppercase", letterSpacing: 0.5 }}
					>
						{s.label}
					</Text>
					<Text size="md" weight="semibold">
						{s.value}
					</Text>
				</View>
			))}
		</View>
	);
}

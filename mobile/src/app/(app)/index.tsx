import { Ionicons } from "@expo/vector-icons";
import { useQueries, useQuery } from "@tanstack/react-query";
import * as Location from "expo-location";
import { Link, router, type Href } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Image, Pressable, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { type AlertSeverity } from "@/components/ui/alert-card";
import { Card } from "@/components/ui/card";
import {
	CropCompositionCard,
	type CropCompositionSegment,
	getCompositionColor,
} from "@/components/ui/crop-composition-card";
import { GradientBackground } from "@/components/ui/gradient-background";
import {
	PhaseProgressionCard,
	type PhaseSegment,
} from "@/components/ui/phase-progression-card";
import { SpeechBubble } from "@/components/ui/speech-bubble";
import { Text } from "@/components/ui/text";
import { WeatherCard, type TodayForecast } from "@/components/ui/weather-card";
import { colors, radii, spacing } from "@/constants/theme";
import { useGeolocation } from "@/hooks/use-geolocation";
import { useClimateNormals } from "@/hooks/use-library";
import {
	type Activity,
	type ActivityActionType,
	activityApi,
	type Batch,
	batchesApi,
	checklistApi,
	type CropGuide,
	cropsApi,
	inventoryApi,
	MILESTONE_ORDER,
	type Milestone,
	setupsApi,
	usersApi,
} from "@/lib/hydro-api";
import { useT } from "@/lib/i18n";
import { QK, STALE } from "@/lib/query-config";

const STAGE_LABEL: Record<Milestone, string> = {
	Sowed: "Sowed",
	Germinated: "Germinated",
	SeedLeaves: "Seed Leaves",
	TrueLeaves: "True Leaves",
	Transplanted: "Transplanted",
	Vegetative: "Vegetative",
	Flowering: "Flowering",
	FruitSet: "Fruit Set",
	HarvestReady: "Harvest-Ready",
	Harvested: "Harvested",
	Failed: "Failed",
};

const STAGE_COLORS: Record<Milestone, { fg: string; bg: string }> = {
	Sowed: { fg: "#A1887F", bg: "rgba(161, 136, 127, 0.18)" },
	Germinated: { fg: "#AED581", bg: "rgba(174, 213, 129, 0.18)" },
	SeedLeaves: { fg: "#9CCC65", bg: "rgba(156, 204, 101, 0.18)" },
	TrueLeaves: { fg: "#66BB6A", bg: "rgba(102, 187, 106, 0.18)" },
	Transplanted: { fg: "#42A5F5", bg: "rgba(66, 165, 245, 0.18)" },
	Vegetative: { fg: "#26A69A", bg: "rgba(38, 166, 154, 0.18)" },
	Flowering: { fg: "#CE93D8", bg: "rgba(206, 147, 216, 0.18)" },
	FruitSet: { fg: "#FFB74D", bg: "rgba(255, 183, 77, 0.18)" },
	HarvestReady: { fg: "#EF5350", bg: "rgba(239, 83, 80, 0.18)" },
	Harvested: { fg: "rgba(255,255,255,0.6)", bg: "rgba(255,255,255,0.08)" },
	Failed: { fg: "#EF5350", bg: "rgba(239, 83, 80, 0.18)" },
};

const LEAFY_STAGES: Milestone[] = [
	"Sowed",
	"Germinated",
	"SeedLeaves",
	"TrueLeaves",
	"Transplanted",
	"Vegetative",
	"HarvestReady",
];
const FRUITING_STAGES: Milestone[] = [
	"Sowed",
	"Germinated",
	"SeedLeaves",
	"TrueLeaves",
	"Transplanted",
	"Vegetative",
	"Flowering",
	"HarvestReady",
];

const MILESTONE_TO_GUIDE_STAGE: Partial<Record<Milestone, string[]>> = {
	Sowed: ["Sowing"],
	Germinated: ["Germination"],
	SeedLeaves: ["Seedling"],
	TrueLeaves: ["Seedling"],
	Transplanted: ["Transplant"],
	Vegetative: ["Vegetative"],
	Flowering: ["Flowering"],
	FruitSet: ["Fruit Set"],
	HarvestReady: ["Harvest"],
};

function computeCurrentStage(
	stateCounts: { milestone_code: Milestone; count: number }[],
): Milestone | null {
	let latest: Milestone | null = null;
	for (const m of MILESTONE_ORDER) {
		const c = stateCounts.find((s) => s.milestone_code === m);
		if (c && c.count > 0) latest = m;
	}
	return latest;
}

function findGuideStageDayMax(
	guide: CropGuide | undefined,
	milestone: Milestone | null,
): number | null {
	if (!guide?.growth_stages || !milestone) return null;
	const names = MILESTONE_TO_GUIDE_STAGE[milestone];
	if (!names) return null;
	for (const s of guide.growth_stages) {
		if (names.includes(s.stage)) return s.day_max;
	}
	return null;
}

interface ActivityItem {
	id: string;
	icon: React.ComponentProps<typeof Ionicons>["name"];
	iconBg: string;
	iconColor: string;
	title: string;
	timeAgo: string;
}

interface ActivityVisual {
	icon: React.ComponentProps<typeof Ionicons>["name"];
	iconBg: string;
	iconColor: string;
}

function activityVisual(action: ActivityActionType): ActivityVisual {
	switch (action) {
		case "batch_created":
		case "batch_transition":
			return {
				icon: "leaf",
				iconBg: colors.infoLight,
				iconColor: colors.info,
			};
		case "batch_harvest":
			return {
				icon: "checkmark-circle",
				iconBg: colors.successLight,
				iconColor: colors.primaryLight,
			};
		case "batch_archived":
		case "batch_deleted":
			return {
				icon: "archive",
				iconBg: colors.surfaceVariant,
				iconColor: colors.textSecondary,
			};
		case "inventory_restocked":
		case "inventory_created":
			return {
				icon: "cube",
				iconBg: colors.warningLight,
				iconColor: colors.warning,
			};
		case "inventory_consumed":
		case "inventory_adjusted":
		case "inventory_deleted":
			return {
				icon: "remove-circle",
				iconBg: colors.warningLight,
				iconColor: colors.warning,
			};
		case "sale_recorded":
		case "overhead_added":
			return {
				icon: "trending-up",
				iconBg: colors.salesAccentLight,
				iconColor: colors.salesAccent,
			};
		case "sale_deleted":
			return {
				icon: "close-circle",
				iconBg: colors.errorLight,
				iconColor: colors.error,
			};
		case "produce_created":
		case "produce_movement":
			return {
				icon: "basket",
				iconBg: colors.successLight,
				iconColor: colors.primaryLight,
			};
		case "setup_created":
			return {
				icon: "construct",
				iconBg: colors.infoLight,
				iconColor: colors.info,
			};
		case "setup_archived":
		case "setup_deleted":
			return {
				icon: "archive",
				iconBg: colors.surfaceVariant,
				iconColor: colors.textSecondary,
			};
		default:
			return {
				icon: "ellipse",
				iconBg: colors.surfaceVariant,
				iconColor: colors.info,
			};
	}
}

function formatTimeAgo(iso: string, locale: string): string {
	const then = new Date(iso).getTime();
	const now = Date.now();
	const diff = Math.max(now - then, 0);
	const sec = Math.floor(diff / 1000);
	const min = Math.floor(sec / 60);
	const hr = Math.floor(min / 60);
	const day = Math.floor(hr / 24);
	if (sec < 60) return locale.startsWith("fil") ? "ngayon lang" : "just now";
	if (min < 60) return `${min}m ago`;
	if (hr < 24) return `${hr}h ago`;
	if (day < 7) return `${day}d ago`;
	return new Date(iso).toLocaleDateString(locale);
}

function activityToItem(a: Activity, locale: string): ActivityItem {
	const visual = activityVisual(a.action_type);
	return {
		id: a.id,
		icon: visual.icon,
		iconBg: visual.iconBg,
		iconColor: visual.iconColor,
		title: a.summary,
		timeAgo: formatTimeAgo(a.created_at, locale),
	};
}

interface HomeAlert {
	id: string;
	severity: AlertSeverity;
	icon: React.ComponentProps<typeof Ionicons>["name"];
	title: string;
	subtitle: string;
	pillLabel?: string;
	chevron?: boolean;
	onPress?: () => void;
}

function getGreetingKey(hour: number): string {
	if (hour < 12) return "home.greeting_morning";
	if (hour < 18) return "home.greeting_afternoon";
	return "home.greeting_evening";
}

export default function HomeScreen() {
	const { t, locale } = useT();
	const insets = useSafeAreaInsets();

	const userQ = useQuery({
		queryKey: QK.me(),
		queryFn: () => usersApi.me(),
		staleTime: STALE.me,
	});
	const setupsQ = useQuery({
		queryKey: QK.setups.list(),
		queryFn: () => setupsApi.list(),
		staleTime: STALE.setups,
	});
	const batchesQ = useQuery({
		queryKey: QK.batches.list(),
		queryFn: () => batchesApi.list(),
		staleTime: STALE.batches,
	});
	const inventoryQ = useQuery({
		queryKey: QK.inventory.list(),
		queryFn: () => inventoryApi.list(),
		staleTime: STALE.inventory,
	});
	const checklistQ = useQuery({
		queryKey: QK.checklist(),
		queryFn: () => checklistApi.list(),
		staleTime: STALE.checklist,
	});
	const cropsQ = useQuery({
		queryKey: QK.crops(),
		queryFn: () => cropsApi.list(undefined, undefined, { limit: 1000 }),
		staleTime: STALE.crops,
	});
	const activityQ = useQuery({
		queryKey: QK.activity(8),
		queryFn: () => activityApi.list({ limit: 8 }),
		staleTime: STALE.activity,
	});

	const {
		coords,
		error: geoError,
		status: geoStatus,
		refresh: refreshGeo,
	} = useGeolocation(true);
	const climateQ = useClimateNormals({
		lat: coords?.lat ?? null,
		lon: coords?.lon ?? null,
		month: new Date().getMonth() + 1,
	});
	const todayForecastQ = useQuery({
		queryKey: ["weather", "today", coords?.lat, coords?.lon],
		queryFn: async (): Promise<TodayForecast> => {
			const url = `https://api.open-meteo.com/v1/forecast?latitude=${coords?.lat}&longitude=${coords?.lon}&current=weather_code&daily=precipitation_probability_max,weather_code&forecast_days=1&timezone=auto`;
			const r = await fetch(url);
			if (!r.ok) throw new Error("forecast failed");
			const j = await r.json();
			const code =
				j?.current?.weather_code ?? j?.daily?.weather_code?.[0] ?? 0;
			const prob = j?.daily?.precipitation_probability_max?.[0] ?? null;
			return { weather_code: code, precipitation_probability_max: prob };
		},
		enabled: coords != null,
		staleTime: 1000 * 60 * 30,
	});
	const [cityLabel, setCityLabel] = useState<string | null>(null);
	useEffect(() => {
		let cancelled = false;
		if (!coords) return;
		const fallback = `${coords.lat.toFixed(2)}, ${coords.lon.toFixed(2)}`;

		const tryNetworkGeocode = async (): Promise<string | null> => {
			try {
				const r = await fetch(
					`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${coords.lat}&longitude=${coords.lon}&localityLanguage=en`,
				);
				if (!r.ok) return null;
				const j = await r.json();
				const primary =
					j?.city || j?.locality || j?.localityInfo?.administrative?.[3]?.name;
				const secondary =
					j?.principalSubdivision || j?.countryName || j?.countryCode;
				const label = [primary, secondary].filter(Boolean).join(", ");
				return label || null;
			} catch {
				return null;
			}
		};

		(async () => {
			let label: string | null = null;
			try {
				const places = await Location.reverseGeocodeAsync({
					latitude: coords.lat,
					longitude: coords.lon,
				});
				const p = places[0];
				const primary =
					p?.city ?? p?.subregion ?? p?.district ?? p?.name ?? null;
				const secondary = p?.region ?? p?.country ?? null;
				label = [primary, secondary].filter(Boolean).join(", ") || null;
			} catch {
				label = null;
			}
			if (!label) label = await tryNetworkGeocode();
			if (cancelled) return;
			setCityLabel(label ?? fallback);
		})();

		return () => {
			cancelled = true;
		};
	}, [coords]);

	const activeBatches = useMemo(
		() => (batchesQ.data?.data ?? []).filter((b) => !b.archived_at),
		[batchesQ.data],
	);

	const detailsQ = useQueries({
		queries: activeBatches.map((b) => ({
			queryKey: QK.batches.detail(b.id),
			queryFn: () => batchesApi.get(b.id),
			staleTime: 30_000,
		})),
	});

	const firstName =
		userQ.data?.full_name?.split(" ")[0] ?? t("home.default_name");
	const farmName = t("home.farm_label", { name: firstName });
	const greeting = t(getGreetingKey(new Date().getHours()));

	const lowStock = (inventoryQ.data?.data ?? []).filter((i) => i.is_low_stock);
	const harvestReady = (batchesQ.data?.data ?? []).filter(
		(b) =>
			Math.floor((Date.now() - new Date(b.started_at).getTime()) / 86400000) >=
			25,
	);
	const tasksPending = checklistQ.data?.count ?? 0;

	const alerts: HomeAlert[] = [];
	// Mock pH out-of-range alert until readings API surfaces here
	alerts.push({
		id: "ph-mock",
		severity: "urgent",
		icon: "warning",
		title: "DFT-A pH Out of Range",
		subtitle: "Current: 7.2 — Target: 5.5–6.5",
		pillLabel: t("home.alert_severity_urgent"),
	});
	const firstLow = lowStock[0];
	if (firstLow) {
		alerts.push({
			id: `low-${firstLow.id}`,
			severity: "low",
			icon: "cube",
			title: t("home.alert_low_stock_title", { name: firstLow.name }),
			subtitle: t("home.alert_low_stock_subtitle", { stock: String(firstLow.current_stock), unit: firstLow.unit, min: String(firstLow.low_stock_threshold) }),
			pillLabel: t("home.alert_severity_low"),
		});
	}
	const firstReady = harvestReady[0];
	if (firstReady) {
		const days = Math.floor(
			(Date.now() - new Date(firstReady.started_at).getTime()) / 86400000,
		);
		alerts.push({
			id: `ready-${firstReady.id}`,
			severity: "info",
			icon: "time",
			title: t("home.alert_harvest_ready_title", { variety: firstReady.variety_name }),
			subtitle: t("home.alert_harvest_ready_subtitle", { day: String(days) }),
			chevron: true,
			onPress: () => router.push("/setups"),
		});
	}

	const crops = cropsQ.data?.data ?? [];
	const cropById = useMemo(() => {
		const m = new Map<string, CropGuide>();
		for (const c of crops) m.set(c.id, c);
		return m;
	}, [crops]);
	const cropByName = useMemo(() => {
		const m = new Map<string, CropGuide>();
		for (const c of crops) {
			if (c.name_en) m.set(c.name_en.toLowerCase(), c);
			if (c.name_tl) m.set(c.name_tl.toLowerCase(), c);
		}
		return m;
	}, [crops]);
	const resolveGuide = (b: Batch): CropGuide | undefined => {
		if (b.crop_guide_id) {
			const g = cropById.get(b.crop_guide_id);
			if (g) return g;
		}
		const v = b.variety_name?.toLowerCase().trim();
		if (!v) return undefined;
		const direct = cropByName.get(v);
		if (direct) return direct;
		for (const [k, g] of cropByName) {
			if (v.includes(k) || k.includes(v)) return g;
		}
		return undefined;
	};

	const cropComposition = useMemo(() => {
		const totals = new Map<string, number>();
		for (const b of activeBatches) {
			const key = b.variety_name?.trim() || "Unknown";
			totals.set(key, (totals.get(key) ?? 0) + (b.initial_count ?? 0));
		}
		const segments: CropCompositionSegment[] = Array.from(totals.entries())
			.map(([label, value]) => ({ label, value }))
			.sort((a, b) => b.value - a.value)
			.map((s, i) => ({
				label: s.label,
				value: s.value,
				color: getCompositionColor(i),
			}));
		const total = segments.reduce((a, b) => a + b.value, 0);
		return { segments, total };
	}, [activeBatches]);

	const phaseGroups = useMemo(() => {
		let germinating = 0;
		let trueLeaves = 0;
		let transplanted = 0;
		let fruiting = 0;
		for (const q of detailsQ) {
			const states = q.data?.state_counts ?? [];
			for (const s of states) {
				switch (s.milestone_code) {
					case "Sowed":
					case "Germinated":
						germinating += s.count;
						break;
					case "SeedLeaves":
					case "TrueLeaves":
						trueLeaves += s.count;
						break;
					case "Transplanted":
					case "Vegetative":
						transplanted += s.count;
						break;
					case "Flowering":
					case "FruitSet":
					case "HarvestReady":
						fruiting += s.count;
						break;
					default:
						break;
				}
			}
		}
		const phases: PhaseSegment[] = [
			{
				key: "germinating",
				label: t("home.phase_germinating"),
				count: germinating,
				color: colors.info,
				icon: "egg",
			},
			{
				key: "trueLeaves",
				label: t("home.phase_true_leaves"),
				count: trueLeaves,
				color: colors.primaryLight,
				icon: "leaf",
			},
			{
				key: "transplanted",
				label: t("home.phase_transplanted"),
				count: transplanted,
				color: colors.primary,
				icon: "git-branch",
			},
			{
				key: "fruiting",
				label: t("home.phase_fruiting"),
				count: fruiting,
				color: colors.warning,
				icon: "nutrition",
			},
		];
		const total = germinating + trueLeaves + transplanted + fruiting;
		return { phases, total };
	}, [detailsQ, t]);

	const upcomingPhases = activeBatches
		.map((b, i) => {
			const detail = detailsQ[i]?.data;
			const stateCounts = detail?.state_counts ?? [];
			const currentStage = computeCurrentStage(stateCounts);
			if (!currentStage) return null;
			const isFruiting = stateCounts.some(
				(s) =>
					(s.milestone_code === "Flowering" ||
						s.milestone_code === "FruitSet") &&
					s.count > 0,
			);
			const stages = isFruiting ? FRUITING_STAGES : LEAFY_STAGES;
			const idx = stages.indexOf(currentStage);
			if (idx < 0 || idx >= stages.length - 1) return null;
			const nextStage = stages[idx + 1];
			const day = Math.floor(
				(Date.now() - new Date(b.started_at).getTime()) / 86400000,
			);
			const guide = resolveGuide(b);
			const dayMax = findGuideStageDayMax(guide, currentStage);
			const daysLeft = dayMax !== null ? Math.max(0, dayMax - day) : null;
			const pendingCount =
				stateCounts.find((s) => s.milestone_code === currentStage)?.count ?? 0;
			return { batch: b, currentStage, nextStage, daysLeft, pendingCount };
		})
		.filter((x): x is NonNullable<typeof x> => x !== null)
		.sort((a, b) => {
			const av = a.daysLeft ?? 9999;
			const bv = b.daysLeft ?? 9999;
			return av - bv;
		})
		.slice(0, 5);

	return (
		<GradientBackground>
			<ScrollView
				contentContainerStyle={{
					gap: spacing.md,
				}}
				style={{ flex: 1 }}
			>
				{/* Header: date + greeting on left, circular bell + gear on right */}
				<View
					style={{
						flexDirection: "row",
						alignItems: "flex-start",
						justifyContent: "space-between",
						paddingHorizontal: spacing.md,
						paddingTop: spacing.xs,
						gap: spacing.sm,
					}}
				>
					<View style={{ flex: 1, gap: 2 }}>
						<Text size="xxl" weight="bold">
							{`${greeting}, ${firstName}!`}
						</Text>
					</View>
					<View
						style={{
							flexDirection: "row",
							gap: spacing.xs,
							paddingTop: spacing.lg,
						}}
					>
						<Link href="/library" asChild>
							<Pressable
								accessibilityLabel={t("home.qa_library")}
								accessibilityRole="button"
								style={{
									width: 44,
									height: 44,
									borderRadius: radii.full,
									backgroundColor: colors.infoLight,
									borderWidth: 1,
									borderColor: colors.info,
									alignItems: "center",
									justifyContent: "center",
								}}
							>
								<Ionicons
									name="library"
									size={20}
									color={colors.info}
								/>
							</Pressable>
						</Link>
						{/* <Link href="/checklist" asChild>
							<Pressable
								accessibilityLabel={t("home.a11y_notifications")}
								accessibilityRole="button"
								style={{
									width: 44,
									height: 44,
									borderRadius: radii.full,
									backgroundColor: colors.glass,
									borderWidth: 1,
									borderColor: colors.border,
									alignItems: "center",
									justifyContent: "center",
								}}
							>
								<Ionicons
									name="notifications-outline"
									size={20}
									color={colors.text}
								/>
								{alerts.length > 0 ? (
									<View
										style={{
											position: "absolute",
											top: 8,
											right: 10,
											width: 8,
											height: 8,
											borderRadius: 4,
											backgroundColor: colors.error,
										}}
									/>
								) : null}
							</Pressable>
						</Link> */}
						<Link href="/settings" asChild>
							<Pressable
								accessibilityLabel={t("home.a11y_profile")}
								accessibilityRole="button"
								style={{
									width: 44,
									height: 44,
									borderRadius: radii.full,
									backgroundColor: colors.glass,
									borderWidth: 1,
									borderColor: colors.border,
									alignItems: "center",
									justifyContent: "center",
								}}
							>
								<Ionicons
									name="settings-outline"
									size={20}
									color={colors.text}
								/>
							</Pressable>
						</Link>
					</View>
				</View>

				{/* Mascot + speech bubble */}
				<View
					style={{
						flexDirection: "row",
						alignItems: "center",
						paddingHorizontal: spacing.md,
					}}
				>
					<Image
						source={require("../../../assets/character/saying_hi_halfbody.png")}
						style={{ width: 140, height: 140, marginRight: -spacing.xs }}
						resizeMode="contain"
						accessibilityIgnoresInvertColors
					/>
					<SpeechBubble
						title={t("home.checkin_quote")}
						subtitle={t("home.checkin_summary", {
							tasks: String(tasksPending),
							harvests: String(harvestReady.length),
							low: String(lowStock.length),
						})}
					/>
				</View>

				{/* Horizontal action chip row */}
				<ScrollView
					horizontal
					showsHorizontalScrollIndicator={false}
					contentContainerStyle={{
						paddingHorizontal: spacing.md,
						gap: spacing.xs,
					}}
				>
					<QuickActionChip
						icon="water"
						iconColor={colors.info}
						label={t("home.qa_log_reading")}
						href="/checklist"
					/>
					<QuickActionChip
						icon="add"
						iconColor={colors.primaryLight}
						label={t("home.qa_new_batch")}
						href="/batch/new"
					/>
					<QuickActionChip
						icon="trending-up"
						iconColor={colors.salesAccent}
						label={t("home.qa_add_sale")}
						href="/sale-new"
					/>
					<QuickActionChip
						icon="cube"
						iconColor={colors.restockAccent}
						label={t("home.qa_restock")}
						href="/inventory-new"
					/>
					<QuickActionChip
						icon="flash"
						iconColor={colors.primaryLight}
						label={t("home.qa_tasks")}
						href="/checklist"
					/>
					<QuickActionChip
						icon="book"
						iconColor={colors.warning}
						label={t("home.qa_crop_guide")}
						href="/library/crops"
					/>
				</ScrollView>

				{/* Bottom panel — clear separation from header */}
				<View
					style={{
						marginTop: spacing.sm,
						paddingTop: spacing.lg,
						paddingBottom: insets.bottom + 128,
						gap: spacing.md,
						backgroundColor: colors.bg,
						borderTopLeftRadius: radii.xxl,
						borderTopRightRadius: radii.xxl,
						borderTopWidth: 1,
						borderColor: colors.borderLight,
					}}
				>

				{/* Today's Tasks */}
				{/* <View style={{ paddingHorizontal: spacing.md }}>
					<Card>
						<View
							style={{
								flexDirection: "row",
								alignItems: "center",
								justifyContent: "space-between",
							}}
						>
							<View style={{ flex: 1 }}>
								<Text weight="bold" size="lg">
									{t("home.todays_tasks")}
								</Text>
								<Text size="sm" tone="muted">
									{dateLabel}
								</Text>
							</View>
							<ProgressRing
								size={64}
								strokeWidth={6}
								progress={TASKS_PROGRESS_MOCK}
								color={colors.primaryLight}
								accessibilityLabel="Today's tasks completion"
							>
								<Text size="sm" weight="bold">
									{`${Math.round(TASKS_PROGRESS_MOCK * 100)}%`}
								</Text>
							</ProgressRing>
						</View>
						<View
							style={{
								height: 6,
								borderRadius: radii.full,
								backgroundColor: colors.glass,
								marginTop: spacing.sm,
								overflow: "hidden",
							}}
						>
							<View
								style={{
									width: `${Math.round(TASKS_PROGRESS_MOCK * 100)}%`,
									height: "100%",
									backgroundColor: colors.primaryLight,
								}}
							/>
						</View>
						<Text size="sm" tone="muted" style={{ marginTop: spacing.xs }}>
							{t("home.tasks_done_count", {
								done: String(TASKS_DONE_MOCK),
								total: String(TASKS_TOTAL_MOCK),
							})}
						</Text>
					</Card>
				</View> */}

				{/* Grow climate widget */}
				<WeatherCard
					data={climateQ.data}
					today={todayForecastQ.data}
					cityLabel={cityLabel ?? undefined}
					loading={
						climateQ.isLoading ||
						geoStatus === "requesting" ||
						(geoStatus === "idle" && !coords)
					}
					error={
						geoStatus === "denied"
							? "Location permission denied. Enable to see local climate."
							: geoStatus === "error"
								? geoError
								: climateQ.error
									? "Couldn't load climate data."
									: null
					}
					onRetry={
						geoStatus === "denied" || geoStatus === "error"
							? refreshGeo
							: climateQ.error
								? () => climateQ.refetch()
								: undefined
					}
				/>

				{/* KPI Grid 2x2 */}
				<View
					style={{
						flexDirection: "row",
						flexWrap: "wrap",
						gap: spacing.sm,
						paddingHorizontal: spacing.md,
					}}
				>
					<KpiTile
						icon="grid"
						iconBg={colors.successLight}
						iconColor={colors.primaryLight}
						value={setupsQ.data?.count ?? 0}
						label={t("home.kpi_active_setups")}
					/>
					<KpiTile
						icon="leaf"
						iconBg={colors.infoLight}
						iconColor={colors.info}
						value={batchesQ.data?.count ?? 0}
						label={t("home.kpi_plant_batches")}
					/>
					<KpiTile
						icon="nutrition"
						iconBg={colors.successLight}
						iconColor={colors.primaryLight}
						value={harvestReady.length}
						label={t("home.kpi_near_harvest")}
					/>
					<KpiTile
						icon="alert-circle"
						iconBg={colors.errorLight}
						iconColor={colors.error}
						value={lowStock.length}
						label={t("home.kpi_low_stock")}
					/>
				</View>

				{/* Active crop composition */}
				<CropCompositionCard
					title={t("home.crop_composition_title")}
					segments={cropComposition.segments}
					centerValue={String(cropComposition.total)}
					centerLabel={t("home.crop_composition_center")}
					emptyLabel={t("home.crop_composition_empty")}
				/>

				{/* Plant phase progression */}
				<PhaseProgressionCard
					title={t("home.phases_card_title")}
					phases={phaseGroups.phases}
					total={phaseGroups.total}
					totalLabel={t("home.phases_total_label")}
					emptyLabel={t("home.phases_empty")}
				/>

				{/* Alerts */}
				{/* {alerts.length > 0 ? (
					<View
						style={{
							paddingHorizontal: spacing.md,
							gap: spacing.sm,
						}}
					>
						<Text size="lg" weight="bold">
							{t("home.alerts")}
						</Text>
						{alerts.map((a) => (
							<AlertCard
								key={a.id}
								severity={a.severity}
								icon={a.icon}
								title={a.title}
								subtitle={a.subtitle}
								pillLabel={a.pillLabel}
								chevron={a.chevron}
								onPress={a.onPress}
							/>
						))}
					</View>
				) : null} */}

				{/* Upcoming Phases */}
				{upcomingPhases.length > 0 ? (
					<View style={{ gap: spacing.sm }}>
						<View
							style={{
								flexDirection: "row",
								alignItems: "center",
								justifyContent: "space-between",
								paddingHorizontal: spacing.md,
							}}
						>
							<Text size="lg" weight="bold">
								{t("home.upcoming_phases")}
							</Text>
							<Link href="/seeds" asChild>
								<Pressable accessibilityRole="link">
									<Text size="sm" tone="primary">
										{t("home.see_all")}
									</Text>
								</Pressable>
							</Link>
						</View>
						<ScrollView
							horizontal
							showsHorizontalScrollIndicator={false}
							contentContainerStyle={{
								paddingHorizontal: spacing.md,
								gap: spacing.sm,
							}}
						>
							{upcomingPhases.map(
								({ batch, currentStage, nextStage, daysLeft, pendingCount }) => {
									const due = daysLeft !== null && daysLeft <= 0;
									const urgent =
										daysLeft !== null && daysLeft > 0 && daysLeft < 3;
									const pillBg = due
										? colors.warningLight
										: urgent
											? colors.errorLight
											: colors.successLight;
									const pillFg = due
										? colors.warning
										: urgent
											? colors.error
											: colors.primaryLight;
									const pillLabel =
										daysLeft === null
											? t("home.phase_no_eta")
											: due
												? t("home.phase_due")
												: t("home.days_left", { n: String(daysLeft) });
									const stageTint = STAGE_COLORS[nextStage];
									return (
										<Pressable
											key={batch.id}
											accessibilityRole="button"
											accessibilityLabel={t("home.phase_card_a11y", {
												variety: batch.variety_name,
												phase: STAGE_LABEL[nextStage],
											})}
											onPress={() => router.push(`/batch/${batch.id}`)}
											style={({ pressed }) => ({
												width: 180,
												padding: spacing.sm,
												borderRadius: radii.lg,
												backgroundColor: pressed
													? colors.glassHover
													: stageTint.bg,
												borderWidth: 1,
												borderColor: stageTint.fg + "40",
												borderLeftWidth: 4,
												borderLeftColor: stageTint.fg,
												gap: spacing.xs,
											})}
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
														width: 36,
														height: 36,
														borderRadius: radii.md,
														backgroundColor: stageTint.fg + "26",
														alignItems: "center",
														justifyContent: "center",
													}}
												>
													<Ionicons
														name="leaf"
														size={18}
														color={stageTint.fg}
													/>
												</View>
												<View style={{ flex: 1 }}>
													<Text weight="bold" numberOfLines={1}>
														{batch.variety_name}
													</Text>
													<Text size="xs" tone="muted" numberOfLines={1}>
														{STAGE_LABEL[currentStage]}
													</Text>
												</View>
											</View>
											<View
												style={{
													flexDirection: "row",
													alignItems: "center",
													gap: 4,
												}}
											>
												<Ionicons
													name="arrow-forward"
													size={12}
													color={colors.textMuted}
												/>
												<Text size="xs" tone="muted" numberOfLines={1}>
													{STAGE_LABEL[nextStage]}
												</Text>
											</View>
											<View
												style={{
													flexDirection: "row",
													alignItems: "center",
													justifyContent: "space-between",
												}}
											>
												<Text size="xs" tone="muted">
													{t("home.plants_count", {
														n: String(pendingCount),
													})}
												</Text>
												<View
													style={{
														paddingHorizontal: spacing.sm,
														paddingVertical: 4,
														borderRadius: radii.full,
														backgroundColor: pillBg,
													}}
												>
													<Text
														size="xs"
														weight="bold"
														style={{ color: pillFg }}
													>
														{pillLabel}
													</Text>
												</View>
											</View>
										</Pressable>
									);
								},
							)}
						</ScrollView>
					</View>
				) : null}

				{/* Recent Activity */}
				<View
					style={{
						paddingHorizontal: spacing.md,
						gap: spacing.sm,
					}}
				>
					<Text size="lg" weight="bold">
						{t("home.recent_activity")}
					</Text>
					<Card>
						{(() => {
							const items = (activityQ.data?.data ?? []).map((a) =>
								activityToItem(a, locale),
							);
							if (items.length === 0) {
								return (
									<View
										style={{
											paddingVertical: spacing.md,
											alignItems: "center",
										}}
									>
										<Text size="sm" tone="muted">
											{activityQ.isLoading ? "…" : t("home.no_activity")}
										</Text>
									</View>
								);
							}
							return items.map((a, idx) => (
								<View
									key={a.id}
									style={{
										flexDirection: "row",
										alignItems: "center",
										gap: spacing.sm,
										paddingVertical: spacing.sm,
										borderBottomWidth: idx === items.length - 1 ? 0 : 1,
										borderBottomColor: colors.borderLight,
									}}
								>
									<View
										style={{
											width: 36,
											height: 36,
											borderRadius: radii.md,
											backgroundColor: a.iconBg,
											alignItems: "center",
											justifyContent: "center",
										}}
									>
										<Ionicons name={a.icon} size={18} color={a.iconColor} />
									</View>
									<Text style={{ flex: 1 }}>{a.title}</Text>
									<Text size="xs" tone="muted">
										{a.timeAgo}
									</Text>
								</View>
							));
						})()}
					</Card>
				</View>

				</View>

			</ScrollView>
		</GradientBackground>
	);
}

function KpiTile({
	icon,
	iconBg,
	iconColor,
	value,
	label,
}: {
	icon: React.ComponentProps<typeof Ionicons>["name"];
	iconBg: string;
	iconColor: string;
	value: number | string;
	label: string;
}) {
	return (
		<View
			style={{
				flex: 1,
				minWidth: "47%",
				padding: spacing.md,
				borderRadius: radii.lg,
				backgroundColor: colors.surfaceVariant,
				borderWidth: 1,
				borderColor: colors.border,
				gap: spacing.sm,
			}}
		>
			<View
				style={{
					width: 36,
					height: 36,
					borderRadius: radii.md,
					backgroundColor: iconBg,
					alignItems: "center",
					justifyContent: "center",
				}}
			>
				<Ionicons name={icon} size={18} color={iconColor} />
			</View>
			<Text size="xxxl" weight="bold">
				{value}
			</Text>
			<Text size="sm" tone="muted">
				{label}
			</Text>
		</View>
	);
}

function QuickActionChip({
	icon,
	iconColor,
	label,
	href,
}: {
	icon: React.ComponentProps<typeof Ionicons>["name"];
	iconColor: string;
	label: string;
	href: Href;
}) {
	return (
		<Pressable
			accessibilityRole="link"
			accessibilityLabel={label}
			onPress={() => router.push(href)}
			style={({ pressed }) => ({
				flexDirection: "row",
				alignItems: "center",
				gap: 6,
				paddingVertical: 6,
				paddingHorizontal: spacing.sm,
				borderRadius: radii.full,
				backgroundColor: pressed ? colors.glassHover : colors.surfaceVariant,
				borderWidth: 1,
				borderColor: colors.border,
				minHeight: 32,
			})}
		>
			<Ionicons name={icon} size={14} color={iconColor} />
			<Text weight="semibold" size="xs">
				{label}
			</Text>
			<Ionicons
				name="chevron-forward"
				size={12}
				color={colors.textMuted}
			/>
		</Pressable>
	);
}

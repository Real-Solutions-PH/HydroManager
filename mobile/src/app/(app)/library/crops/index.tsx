import { Ionicons } from "@expo/vector-icons";
import { Link, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { FlatList, Image, Pressable, View } from "react-native";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { GradientBackground } from "@/components/ui/gradient-background";
import { SearchBar } from "@/components/ui/search-bar";
import { Select } from "@/components/ui/select";
import { Text } from "@/components/ui/text";
import { colors, spacing } from "@/constants/theme";
import { useBack } from "@/hooks/use-back";
import { useGeolocation } from "@/hooks/use-geolocation";
import { useClimateNormals, useCrops } from "@/hooks/use-library";
import type { ClimateNormals, CropGuide } from "@/lib/hydro-api";
import { capitalize } from "@/lib/utils";

const CATEGORIES = ["leafy", "herb", "fruiting", "other"] as const;
type Cat = (typeof CATEGORIES)[number];

const CAT_COLOR: Record<Cat, string> = {
	leafy: colors.success,
	herb: colors.primaryLight,
	fruiting: colors.warning,
	other: colors.info,
};

const MONTHS = [
	"January",
	"February",
	"March",
	"April",
	"May",
	"June",
	"July",
	"August",
	"September",
	"October",
	"November",
	"December",
];

type SortKey =
	| "name"
	| "yield"
	| "price"
	| "ph"
	| "ec"
	| "sunlight"
	| "growlight"
	| "humidity"
	| "days_to_harvest";

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
	{ value: "name", label: "Name (A-Z)" },
	{ value: "yield", label: "Yield per plant (high → low)" },
	{ value: "price", label: "Price ₱/kg (high → low)" },
	{ value: "ph", label: "pH (low → high)" },
	{ value: "ec", label: "EC (low → high)" },
	{ value: "sunlight", label: "Sunlight hours (high → low)" },
	{ value: "growlight", label: "Growlight hours (low → high)" },
	{ value: "humidity", label: "Humidity (low → high)" },
	{ value: "days_to_harvest", label: "Days to harvest (low → high)" },
];

function parseRange(s: string | null | undefined): [number, number] | null {
	if (!s) return null;
	const nums = s.match(/-?\d+(\.\d+)?/g);
	if (!nums || nums.length === 0) return null;
	const a = Number.parseFloat(nums[0]);
	const b = nums.length > 1 ? Number.parseFloat(nums[1]) : a;
	return [Math.min(a, b), Math.max(a, b)];
}

function rangeMid(r: [number, number] | null): number | null {
	return r ? (r[0] + r[1]) / 2 : null;
}

function withinTolerance(
	value: number,
	range: [number, number] | null,
	tol: number,
): boolean {
	if (!range) return true;
	return value >= range[0] - tol && value <= range[1] + tol;
}

function cropMatchesEnv(crop: CropGuide, env: ClimateNormals): boolean {
	const tempR = parseRange(crop.temperature_day_c);
	if (env.air_temp_c_avg != null && tempR) {
		if (!withinTolerance(env.air_temp_c_avg, tempR, 6)) return false;
	}
	const humR = parseRange(crop.humidity_pct);
	if (env.humidity_pct_avg != null && humR) {
		if (!withinTolerance(env.humidity_pct_avg, humR, 20)) return false;
	}
	const sunR = parseRange(crop.sunlight_hours);
	if (env.sunlight_hours_avg != null && sunR) {
		if (env.sunlight_hours_avg + 4 < sunR[0]) return false;
	}
	return true;
}

function sortCrops(crops: CropGuide[], key: SortKey): CropGuide[] {
	const copy = [...crops];
	const num = (v: number | null | undefined) =>
		typeof v === "number" && Number.isFinite(v) ? v : null;
	const cmp = (a: number | null, b: number | null, dir: 1 | -1) => {
		if (a == null && b == null) return 0;
		if (a == null) return 1;
		if (b == null) return -1;
		return (a - b) * dir;
	};
	switch (key) {
		case "name":
			return copy.sort((a, b) => a.name_en.localeCompare(b.name_en));
		case "yield":
			return copy.sort((a, b) =>
				cmp(num(a.typical_yield_grams), num(b.typical_yield_grams), -1),
			);
		case "price":
			return copy.sort((a, b) =>
				cmp(
					num(a.local_price_php_per_kg_max),
					num(b.local_price_php_per_kg_max),
					-1,
				),
			);
		case "ph":
			return copy.sort((a, b) => cmp(num(a.ph_min), num(b.ph_min), 1));
		case "ec":
			return copy.sort((a, b) => cmp(num(a.ec_min), num(b.ec_min), 1));
		case "sunlight":
			return copy.sort((a, b) =>
				cmp(
					rangeMid(parseRange(a.sunlight_hours)),
					rangeMid(parseRange(b.sunlight_hours)),
					-1,
				),
			);
		case "growlight":
			return copy.sort((a, b) =>
				cmp(
					rangeMid(parseRange(a.growlight_hours)),
					rangeMid(parseRange(b.growlight_hours)),
					1,
				),
			);
		case "humidity":
			return copy.sort((a, b) =>
				cmp(
					rangeMid(parseRange(a.humidity_pct)),
					rangeMid(parseRange(b.humidity_pct)),
					1,
				),
			);
		case "days_to_harvest":
			return copy.sort((a, b) =>
				cmp(num(a.days_to_harvest_min), num(b.days_to_harvest_min), 1),
			);
	}
}

export default function CropsListScreen() {
	const _router = useRouter();
	const goBack = useBack();
	const [query, setQuery] = useState("");
	const [category, setCategory] = useState<Cat | null>(null);
	const [envFilterOn, setEnvFilterOn] = useState(false);
	const [month, setMonth] = useState<number>(new Date().getMonth() + 1);
	const [sort, setSort] = useState<SortKey>("name");
	const [advOpen, setAdvOpen] = useState(false);

	const {
		coords,
		status: geoStatus,
		refresh: refreshGeo,
	} = useGeolocation(true);
	const { data: env, isLoading: envLoading } = useClimateNormals({
		lat: coords?.lat ?? null,
		lon: coords?.lon ?? null,
		month,
	});

	const { data, isLoading } = useCrops(query, category ?? undefined);

	useEffect(() => {
		if (envFilterOn && !coords && geoStatus === "idle") refreshGeo();
	}, [envFilterOn, coords, geoStatus, refreshGeo]);

	const crops = useMemo(() => {
		const base = data?.data ?? [];
		const filtered =
			envFilterOn && env ? base.filter((c) => cropMatchesEnv(c, env)) : base;
		return sortCrops(filtered, sort);
	}, [data, envFilterOn, env, sort]);

	return (
		<GradientBackground>
			<View
				style={{
					paddingHorizontal: spacing.md,
					paddingTop: spacing.xs,
					gap: spacing.sm,
				}}
			>
				<View
					style={{
						flexDirection: "row",
						alignItems: "center",
						gap: spacing.sm,
					}}
				>
					<Pressable onPress={goBack} hitSlop={8}>
						<Ionicons name="chevron-back" size={26} color={colors.text} />
					</Pressable>
					<Text size="xxl" weight="bold">
						Crops
					</Text>
				</View>
				<SearchBar
					value={query}
					onChangeText={setQuery}
					placeholder="Hanapin sa english or tagalog"
				/>
				<View
					style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.xs }}
				>
					<Chip
						label="All"
						active={category === null}
						onPress={() => setCategory(null)}
					/>
					{CATEGORIES.map((c) => (
						<Chip
							key={c}
							label={capitalize(c)}
							active={category === c}
							accent={CAT_COLOR[c]}
							onPress={() => setCategory(c)}
						/>
					))}
				</View>

				<Pressable
					onPress={() => setAdvOpen((v) => !v)}
					style={{
						flexDirection: "row",
						alignItems: "center",
						justifyContent: "space-between",
						paddingVertical: spacing.xs,
						paddingHorizontal: 2,
					}}
				>
					<Text size="sm" weight="semibold">
						Filters & sort
					</Text>
					<Ionicons
						name={advOpen ? "chevron-up" : "chevron-down"}
						size={18}
						color={colors.text}
					/>
				</Pressable>

				{advOpen ? (
					<View style={{ gap: spacing.sm, paddingBottom: spacing.md }}>
						<View
							style={{
								flexDirection: "row",
								flexWrap: "wrap",
								gap: spacing.xs,
							}}
						>
							<Chip
								label={envFilterOn ? "Env: ON" : "Env: OFF"}
								active={envFilterOn}
								accent={colors.info}
								onPress={() => setEnvFilterOn((v) => !v)}
							/>
						</View>
						<View style={{ flexDirection: "row", gap: spacing.xs }}>
							<View style={{ flex: 1 }}>
								<Text size="xs" tone="muted" style={{ marginBottom: 4 }}>
									Month
								</Text>
								<Select
									value={String(month)}
									onValueChange={(v) => setMonth(Number.parseInt(v, 10))}
									options={MONTHS.map((m, i) => ({
										value: String(i + 1),
										label: m,
									}))}
									placeholder="Month"
								/>
							</View>
							<View style={{ flex: 1 }}>
								<Text size="xs" tone="muted" style={{ marginBottom: 4 }}>
									Sort by
								</Text>
								<Select
									value={sort}
									onValueChange={(v) => setSort(v as SortKey)}
									options={SORT_OPTIONS}
									placeholder="Sort"
								/>
							</View>
						</View>

						{envFilterOn ? (
							<EnvBanner
								loading={envLoading}
								geoStatus={geoStatus}
								env={env ?? null}
								onRetryGeo={refreshGeo}
							/>
						) : null}
					</View>
				) : null}
			</View>
			<FlatList
				data={crops}
				keyExtractor={(c) => c.id}
				contentContainerStyle={{
					padding: spacing.md,
					paddingBottom: spacing.jumbo * 2,
					gap: spacing.sm,
				}}
				ListEmptyComponent={
					isLoading ? (
						<Text tone="muted">Loading...</Text>
					) : (
						<View
							style={{ alignItems: "center", paddingVertical: spacing.jumbo }}
						>
							<Ionicons
								name="leaf-outline"
								size={48}
								color={colors.textMuted}
							/>
							<Text tone="muted" style={{ marginTop: spacing.sm }}>
								No crops matched.
							</Text>
						</View>
					)
				}
				renderItem={({ item }) => <CropRow crop={item} />}
			/>
		</GradientBackground>
	);
}

function EnvBanner({
	loading,
	geoStatus,
	env,
	onRetryGeo,
}: {
	loading: boolean;
	geoStatus: ReturnType<typeof useGeolocation>["status"];
	env: ClimateNormals | null;
	onRetryGeo: () => void;
}) {
	if (geoStatus === "denied" || geoStatus === "error") {
		return (
			<Pressable
				onPress={onRetryGeo}
				style={{
					padding: spacing.sm,
					borderRadius: 10,
					backgroundColor: "rgba(239,83,80,0.10)",
					borderWidth: 1,
					borderColor: colors.borderError,
				}}
			>
				<Text size="xs" tone="muted">
					Location unavailable. Tap to retry.
				</Text>
			</Pressable>
		);
	}
	if (loading || !env) {
		return (
			<Text size="xs" tone="muted">
				Loading climate for your location...
			</Text>
		);
	}
	const fmt = (v: number | null, suffix: string) =>
		v == null ? "—" : `${v.toFixed(1)}${suffix}`;
	return (
		<View
			style={{
				padding: spacing.sm,
				borderRadius: 10,
				backgroundColor: "rgba(66,165,245,0.08)",
				borderWidth: 1,
				borderColor: "rgba(66,165,245,0.25)",
				gap: 4,
			}}
		>
			<Text size="xs" weight="semibold">
				Filtering for your environment
			</Text>
			<Text size="xs" tone="muted">
				Air {fmt(env.air_temp_c_avg, "°C")} · Humidity{" "}
				{fmt(env.humidity_pct_avg, "%")} · Sun{" "}
				{fmt(env.sunlight_hours_avg, "h")}
			</Text>
		</View>
	);
}

function Chip({
	label,
	active,
	accent,
	onPress,
}: {
	label: string;
	active: boolean;
	accent?: string;
	onPress: () => void;
}) {
	const c = accent ?? colors.primaryLight;
	return (
		<Pressable
			onPress={onPress}
			style={{
				paddingHorizontal: spacing.sm,
				paddingVertical: 6,
				borderRadius: 999,
				borderWidth: 1,
				borderColor: active ? c : "rgba(255,255,255,0.18)",
				backgroundColor: active ? `${c}26` : "rgba(255,255,255,0.04)",
				opacity: active ? 1 : 0.75,
			}}
		>
			<Text
				size="sm"
				weight="semibold"
				style={{ color: active ? c : colors.text }}
			>
				{label}
			</Text>
		</Pressable>
	);
}

function CropRow({ crop }: { crop: CropGuide }) {
	return (
		<Link href={`/library/crops/${crop.id}`} asChild>
			<Card onPress={() => {}}>
				<View
					style={{
						flexDirection: "row",
						alignItems: "center",
						gap: spacing.sm,
					}}
				>
					{crop.image_url ? (
						<Image
							source={{ uri: crop.image_url }}
							style={{ width: 64, height: 64, borderRadius: 12 }}
						/>
					) : (
						<View
							style={{
								width: 64,
								height: 64,
								borderRadius: 12,
								backgroundColor: colors.glass,
								alignItems: "center",
								justifyContent: "center",
							}}
						>
							<Ionicons name="leaf" size={28} color={colors.primaryLight} />
						</View>
					)}
					<View style={{ flex: 1 }}>
						<Text size="lg" weight="semibold">
							{crop.name_en}
						</Text>
						<Text size="xs" tone="muted">
							{crop.name_tl} · {crop.category}
						</Text>
						<View
							style={{
								flexDirection: "row",
								gap: spacing.sm,
								marginTop: 4,
								flexWrap: "wrap",
							}}
						>
							<Badge
								label={`${crop.days_to_harvest_min}-${crop.days_to_harvest_max}d`}
								color={colors.primaryLight}
								small
							/>
							{crop.local_price_php_per_kg_min ? (
								<Badge
									label={`PHP ${crop.local_price_php_per_kg_min}-${crop.local_price_php_per_kg_max}/kg`}
									color={colors.warning}
									small
								/>
							) : null}
						</View>
					</View>
				</View>
			</Card>
		</Link>
	);
}

import { Ionicons } from "@expo/vector-icons";
import { useQueries, useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { Card } from "@/components/ui/card";
import { GradientBackground } from "@/components/ui/gradient-background";
import { SearchBar } from "@/components/ui/search-bar";
import { Text } from "@/components/ui/text";
import { colors, spacing, systemTypes } from "@/constants/theme";
import {
	type Batch,
	type BatchDetail,
	batchesApi,
	type CropGuide,
	cropsApi,
	MILESTONE_ORDER,
	type Milestone,
	type Setup,
	setupsApi,
} from "@/lib/hydro-api";

const FILTERS = ["All", "Active", "Harvest-Ready", "Archived"] as const;
type Filter = (typeof FILTERS)[number];

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

export default function SeedsScreen() {
	const [filter, setFilter] = useState<Filter>("All");
	const [query, setQuery] = useState("");
	const [expanded, setExpanded] = useState<string | null>(null);

	const setupsQ = useQuery({
		queryKey: ["setups", "all-with-archived"],
		queryFn: () => setupsApi.list(true),
	});
	const batchesQ = useQuery({
		queryKey: ["batches", "all-with-archived"],
		queryFn: () => batchesApi.list({ include_archived: true }),
	});
	const cropsQ = useQuery({
		queryKey: ["crops"],
		queryFn: () => cropsApi.list(),
	});

	const setups = setupsQ.data?.data ?? [];
	const batches = batchesQ.data?.data ?? [];
	const crops = cropsQ.data?.data ?? [];

	const setupById = useMemo(() => {
		const m = new Map<string, Setup>();
		for (const s of setups) m.set(s.id, s);
		return m;
	}, [setups]);

	const cropById = useMemo(() => {
		const m = new Map<string, CropGuide>();
		for (const c of crops) m.set(c.id, c);
		return m;
	}, [crops]);

	const codeByBatch = useMemo(
		() => buildBatchCodes(batches, setups),
		[batches, setups],
	);

	const detailsQ = useQueries({
		queries: batches.map((b) => ({
			queryKey: ["batch", b.id],
			queryFn: () => batchesApi.get(b.id),
			staleTime: 30_000,
		})),
	});

	const detailById = useMemo(() => {
		const m = new Map<string, BatchDetail>();
		detailsQ.forEach((q, i) => {
			if (q.data) m.set(batches[i].id, q.data);
		});
		return m;
	}, [detailsQ, batches]);

	const visible = useMemo(() => {
		const q = query.trim().toLowerCase();
		return batches.filter((b) => {
			if (filter === "Active" && b.archived_at) return false;
			if (filter === "Archived" && !b.archived_at) return false;
			if (filter === "Harvest-Ready") {
				const d = detailById.get(b.id);
				const ready = (d?.state_counts ?? []).some(
					(s) => s.milestone_code === "HarvestReady" && s.count > 0,
				);
				if (!ready) return false;
			}
			if (q) {
				const code = codeByBatch.get(b.id) ?? "";
				const hit =
					b.variety_name.toLowerCase().includes(q) ||
					code.toLowerCase().includes(q);
				if (!hit) return false;
			}
			return true;
		});
	}, [batches, filter, query, detailById, codeByBatch]);

	return (
		<GradientBackground>
			<ScrollView
				contentContainerStyle={{
					paddingHorizontal: spacing.md,
					paddingTop: spacing.xs,
					paddingBottom: spacing.xxxl,
					gap: spacing.md,
				}}
			>
				<View
					style={{
						flexDirection: "row",
						alignItems: "center",
						justifyContent: "space-between",
					}}
				>
					<Text size="xxl" weight="bold">
						Seeds
					</Text>
					<Pressable
						onPress={() => router.push("/batch/new")}
						style={({ pressed }) => ({
							flexDirection: "row",
							alignItems: "center",
							gap: spacing.xxs,
							backgroundColor: pressed
								? colors.buttonSolidActive
								: colors.buttonSolidBg,
							paddingHorizontal: spacing.md,
							paddingVertical: 10,
							borderRadius: 999,
						})}
					>
						<Ionicons name="add" size={18} color="#FFFFFF" />
						<Text weight="semibold">Start Batch</Text>
					</Pressable>
				</View>

				<SearchBar
					value={query}
					onChangeText={setQuery}
					placeholder="Search crops or batch code..."
				/>

				<View
					style={{ flexDirection: "row", gap: spacing.xs, flexWrap: "wrap" }}
				>
					{FILTERS.map((f) => {
						const active = filter === f;
						return (
							<Pressable
								key={f}
								onPress={() => setFilter(f)}
								style={{
									paddingHorizontal: spacing.md,
									paddingVertical: 8,
									borderRadius: 999,
									borderWidth: 1,
									borderColor: active ? colors.primaryLight : colors.border,
									backgroundColor: active
										? `${colors.primaryLight}26`
										: colors.surfaceVariant,
								}}
							>
								<Text
									size="sm"
									weight="semibold"
									style={{ color: active ? colors.primaryLight : colors.text }}
								>
									{f}
								</Text>
							</Pressable>
						);
					})}
				</View>

				{batchesQ.isLoading ? (
					<Text tone="muted">Loading batches...</Text>
				) : visible.length === 0 ? (
					<View
						style={{ alignItems: "center", paddingVertical: spacing.jumbo }}
					>
						<Ionicons name="leaf-outline" size={48} color={colors.textMuted} />
						<Text tone="muted" style={{ marginTop: spacing.sm }}>
							No batches match.
						</Text>
					</View>
				) : (
					visible.map((b) => (
						<BatchCard
							key={b.id}
							batch={b}
							code={codeByBatch.get(b.id) ?? "—"}
							setup={setupById.get(b.setup_id)}
							guide={
								b.crop_guide_id ? cropById.get(b.crop_guide_id) : undefined
							}
							detail={detailById.get(b.id)}
							isExpanded={expanded === b.id}
							onToggle={() =>
								setExpanded((cur) => (cur === b.id ? null : b.id))
							}
						/>
					))
				)}

				<TipCard />
			</ScrollView>
		</GradientBackground>
	);
}

function BatchCard({
	batch,
	code,
	setup,
	guide,
	detail,
	isExpanded,
	onToggle,
}: {
	batch: Batch;
	code: string;
	setup?: Setup;
	guide?: CropGuide;
	detail?: BatchDetail;
	isExpanded: boolean;
	onToggle: () => void;
}) {
	const setupColor = setup ? systemTypes[setup.type] : null;
	const day = Math.max(
		0,
		Math.floor((Date.now() - new Date(batch.started_at).getTime()) / 86400000),
	);

	const stateCounts = detail?.state_counts ?? [];
	const harvestCount =
		stateCounts.find((s) => s.milestone_code === "HarvestReady")?.count ?? 0;
	const failedCount =
		stateCounts.find((s) => s.milestone_code === "Failed")?.count ?? 0;
	const harvestedCount =
		stateCounts.find((s) => s.milestone_code === "Harvested")?.count ?? 0;

	const activePlants = stateCounts
		.filter(
			(s) => s.milestone_code !== "Failed" && s.milestone_code !== "Harvested",
		)
		.reduce((a, s) => a + s.count, 0);
	const totalPlants = batch.initial_count;

	const isFruiting = stateCounts.some(
		(s) =>
			(s.milestone_code === "Flowering" || s.milestone_code === "FruitSet") &&
			s.count > 0,
	);
	const stages = isFruiting ? FRUITING_STAGES : LEAFY_STAGES;
	const currentStage = computeCurrentStage(stateCounts);
	const currentIdx = currentStage ? stages.indexOf(currentStage) : -1;
	const nextStage =
		currentIdx >= 0 && currentIdx < stages.length - 1
			? stages[currentIdx + 1]
			: null;

	const daysToHarvest = guide
		? Math.max(0, guide.days_to_harvest_min - day)
		: null;
	const harvestWindow = guide
		? `Day ${guide.days_to_harvest_min}–${guide.days_to_harvest_max}`
		: null;

	const harvestSoon = daysToHarvest !== null && daysToHarvest <= 7;
	const showHarvestBadge = harvestCount > 0 || harvestSoon;

	return (
		<Card>
			<Pressable onPress={onToggle}>
				<View
					style={{
						flexDirection: "row",
						alignItems: "flex-start",
						gap: spacing.sm,
					}}
				>
					<View style={{ flex: 1 }}>
						<View
							style={{
								flexDirection: "row",
								alignItems: "center",
								gap: spacing.xs,
								flexWrap: "wrap",
							}}
						>
							<Text size="lg" weight="bold">
								{batch.variety_name}
							</Text>
							<View
								style={{
									paddingHorizontal: 8,
									paddingVertical: 2,
									borderRadius: 6,
									backgroundColor: colors.glass,
								}}
							>
								<Text size="xs" tone="muted" weight="semibold">
									{code}
								</Text>
							</View>
							{showHarvestBadge ? (
								<View
									style={{
										paddingHorizontal: 8,
										paddingVertical: 2,
										borderRadius: 6,
										backgroundColor: colors.successLight,
									}}
								>
									<Text
										size="xs"
										weight="bold"
										style={{ color: colors.success, letterSpacing: 0.5 }}
									>
										HARVEST
									</Text>
								</View>
							) : null}
						</View>
						<View
							style={{
								flexDirection: "row",
								alignItems: "center",
								gap: spacing.xs,
								marginTop: 6,
							}}
						>
							{setup && setupColor ? (
								<View
									style={{
										paddingHorizontal: 10,
										paddingVertical: 3,
										borderRadius: 999,
										backgroundColor: setupColor.bg,
									}}
								>
									<Text
										size="xs"
										weight="semibold"
										style={{ color: setupColor.color }}
										numberOfLines={1}
									>
										{setup.name}
									</Text>
								</View>
							) : null}
							<Text size="sm" tone="muted">
								Day {day}
							</Text>
						</View>
					</View>
					<View style={{ alignItems: "flex-end", gap: 4 }}>
						{daysToHarvest !== null ? (
							<View
								style={{
									flexDirection: "row",
									alignItems: "center",
									gap: 4,
								}}
							>
								<Text
									size="sm"
									weight="bold"
									style={{
										color: harvestSoon ? colors.error : colors.primaryLight,
									}}
								>
									{daysToHarvest}d
								</Text>
								<Ionicons
									name={isExpanded ? "chevron-up" : "chevron-down"}
									size={14}
									color={colors.textMuted}
								/>
							</View>
						) : (
							<Ionicons
								name={isExpanded ? "chevron-up" : "chevron-down"}
								size={16}
								color={colors.textMuted}
							/>
						)}
					</View>
				</View>

				{stateCounts.length > 0 ? (
					<View
						style={{
							flexDirection: "row",
							flexWrap: "wrap",
							gap: spacing.xxs,
							marginTop: spacing.sm,
						}}
					>
						{MILESTONE_ORDER.filter(
							(m) =>
								(stateCounts.find((s) => s.milestone_code === m)?.count ?? 0) >
								0,
						)
							.slice(-3)
							.map((m) => {
								const count =
									stateCounts.find((s) => s.milestone_code === m)?.count ?? 0;
								return (
									<View
										key={m}
										style={{
											paddingHorizontal: 10,
											paddingVertical: 4,
											borderRadius: 999,
											backgroundColor: colors.successLight,
										}}
									>
										<Text
											size="xs"
											weight="semibold"
											style={{ color: colors.primaryLight }}
										>
											{count} {STAGE_LABEL[m]}
										</Text>
									</View>
								);
							})}
						{failedCount > 0 ? (
							<View
								style={{
									paddingHorizontal: 10,
									paddingVertical: 4,
									borderRadius: 999,
									backgroundColor: colors.errorLight,
								}}
							>
								<Text
									size="xs"
									weight="semibold"
									style={{ color: colors.error }}
								>
									{failedCount} Failed
								</Text>
							</View>
						) : null}
					</View>
				) : null}

				<StageDots
					stages={stages}
					currentIdx={currentIdx}
					totalPlants={totalPlants - harvestedCount}
				/>
			</Pressable>

			{isExpanded ? (
				<View
					style={{
						marginTop: spacing.md,
						paddingTop: spacing.md,
						borderTopWidth: 1,
						borderTopColor: colors.borderLight,
						gap: spacing.sm,
					}}
				>
					<Text size="lg" weight="bold">
						Batch Details
					</Text>
					<View style={{ flexDirection: "row", flexWrap: "wrap" }}>
						<DetailCell
							label="STARTED"
							value={new Date(batch.started_at).toLocaleDateString(undefined, {
								month: "short",
								day: "numeric",
								year: "numeric",
							})}
						/>
						<DetailCell label="HARVEST WINDOW" value={harvestWindow ?? "—"} />
						<DetailCell
							label="CURRENT STAGE"
							value={currentStage ? STAGE_LABEL[currentStage] : "—"}
						/>
						<DetailCell
							label="NEXT STAGE"
							value={nextStage ? STAGE_LABEL[nextStage] : "—"}
						/>
						<DetailCell
							label="ACTIVE PLANTS"
							value={`${activePlants}/${totalPlants}`}
						/>
						<DetailCell
							label="DAYS TO HARVEST"
							value={daysToHarvest !== null ? `~${daysToHarvest} days` : "—"}
						/>
					</View>
					<View
						style={{
							flexDirection: "row",
							gap: spacing.sm,
							marginTop: spacing.xs,
						}}
					>
						<Pressable
							onPress={() => router.push(`/batch/${batch.id}`)}
							style={({ pressed }) => ({
								flex: 2,
								alignItems: "center",
								paddingVertical: 12,
								borderRadius: 12,
								backgroundColor: pressed
									? colors.buttonSolidActive
									: colors.buttonSolidBg,
							})}
						>
							<Text weight="semibold">Advance Stage</Text>
						</Pressable>
						<Pressable
							onPress={() => router.push(`/batch/${batch.id}?edit=1`)}
							style={({ pressed }) => ({
								flex: 1,
								flexDirection: "row",
								alignItems: "center",
								justifyContent: "center",
								gap: 6,
								paddingVertical: 12,
								borderRadius: 12,
								borderWidth: 1,
								borderColor: colors.border,
								backgroundColor: pressed ? colors.glassHover : "transparent",
							})}
						>
							<Ionicons name="create-outline" size={16} color={colors.text} />
							<Text weight="semibold">Edit</Text>
						</Pressable>
					</View>
				</View>
			) : null}
		</Card>
	);
}

function StageDots({
	stages,
	currentIdx,
	totalPlants,
}: {
	stages: Milestone[];
	currentIdx: number;
	totalPlants: number;
}) {
	return (
		<View
			style={{
				flexDirection: "row",
				alignItems: "center",
				justifyContent: "space-between",
				marginTop: spacing.sm,
			}}
		>
			<View
				style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: 4 }}
			>
				{stages.map((s, i) => {
					const reached = currentIdx >= 0 && i <= currentIdx;
					const current = i === currentIdx;
					return (
						<View
							key={s}
							style={{ flex: 1, flexDirection: "row", alignItems: "center" }}
						>
							<View
								style={{
									width: current ? 12 : 8,
									height: current ? 12 : 8,
									borderRadius: 999,
									backgroundColor: reached ? colors.primaryLight : colors.glass,
									borderWidth: current ? 0 : 1,
									borderColor: colors.border,
								}}
							/>
							{i < stages.length - 1 ? (
								<View
									style={{
										flex: 1,
										height: 2,
										backgroundColor:
											currentIdx >= 0 && i < currentIdx
												? colors.primaryLight
												: colors.glass,
										marginHorizontal: 2,
									}}
								/>
							) : null}
						</View>
					);
				})}
			</View>
			<Text size="xs" tone="muted" style={{ marginLeft: spacing.sm }}>
				{totalPlants} plants
			</Text>
		</View>
	);
}

function DetailCell({ label, value }: { label: string; value: string }) {
	return (
		<View style={{ width: "50%", paddingVertical: 6 }}>
			<Text
				size="xs"
				tone="muted"
				weight="semibold"
				style={{ letterSpacing: 0.5 }}
			>
				{label}
			</Text>
			<Text weight="semibold" style={{ marginTop: 2 }}>
				{value}
			</Text>
		</View>
	);
}

function TipCard() {
	return (
		<View
			style={{
				flexDirection: "row",
				alignItems: "center",
				gap: spacing.sm,
				padding: spacing.sm,
				borderRadius: 16,
				borderWidth: 1,
				borderColor: colors.border,
				backgroundColor: colors.surfaceVariant,
			}}
		>
			<View
				style={{
					width: 44,
					height: 44,
					borderRadius: 12,
					backgroundColor: colors.successLight,
					alignItems: "center",
					justifyContent: "center",
				}}
			>
				<Ionicons name="bulb-outline" size={22} color={colors.primaryLight} />
			</View>
			<Text size="sm" tone="subtle" style={{ flex: 1 }}>
				<Text weight="bold">Tip: </Text>
				Tap any batch to approve milestone transitions. Never miss a stage!
			</Text>
		</View>
	);
}

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

function buildBatchCodes(
	batches: Batch[],
	setups: Setup[],
): Map<string, string> {
	const setupOrder = [...setups].sort((a, b) =>
		(a.created_at ?? "").localeCompare(b.created_at ?? ""),
	);
	const letterBySetup = new Map<string, string>();
	setupOrder.forEach((s, i) => {
		letterBySetup.set(s.id, indexToLetters(i));
	});

	const grouped = new Map<string, Batch[]>();
	for (const b of batches) {
		const arr = grouped.get(b.setup_id) ?? [];
		arr.push(b);
		grouped.set(b.setup_id, arr);
	}

	const codes = new Map<string, string>();
	for (const [setupId, list] of grouped) {
		const sorted = [...list].sort((a, b) =>
			a.started_at.localeCompare(b.started_at),
		);
		const letter = letterBySetup.get(setupId) ?? "?";
		sorted.forEach((b, i) => {
			codes.set(b.id, `${letter}-${String(i + 1).padStart(3, "0")}`);
		});
	}
	return codes;
}

function indexToLetters(i: number): string {
	let n = i;
	let s = "";
	do {
		s = String.fromCharCode(65 + (n % 26)) + s;
		n = Math.floor(n / 26) - 1;
	} while (n >= 0);
	return s;
}

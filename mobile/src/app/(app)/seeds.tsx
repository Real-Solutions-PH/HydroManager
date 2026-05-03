import { Ionicons } from "@expo/vector-icons";
import {
	useMutation,
	useQueries,
	useQuery,
	useQueryClient,
} from "@tanstack/react-query";
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
	Alert,
	Image,
	KeyboardAvoidingView,
	Modal,
	Platform,
	Pressable,
	ScrollView,
	View,
} from "react-native";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { GradientBackground } from "@/components/ui/gradient-background";
import { Input } from "@/components/ui/input";
import { SearchBar } from "@/components/ui/search-bar";
import { Text } from "@/components/ui/text";
import { colors, spacing, systemTypes } from "@/constants/theme";
import {
	type Batch,
	type BatchDetail,
	batchesApi,
	type CropGrowthStage,
	type CropGuide,
	cropsApi,
	MILESTONE_ORDER,
	type Milestone,
	type Setup,
	setupsApi,
} from "@/lib/hydro-api";
import { formatDateOnly } from "@/lib/utils";

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

function findGuideStage(
	guide: CropGuide | undefined,
	milestone: Milestone | null,
): CropGrowthStage | null {
	if (!guide?.growth_stages || !milestone) return null;
	const names = MILESTONE_TO_GUIDE_STAGE[milestone];
	if (!names) return null;
	for (const s of guide.growth_stages) {
		if (names.includes(s.stage)) return s;
	}
	return null;
}

export default function SeedsScreen() {
	const [filter, setFilter] = useState<Filter>("All");
	const [query, setQuery] = useState("");
	const [expanded, setExpanded] = useState<string | null>(null);
	const [advanceTarget, setAdvanceTarget] = useState<{
		batch: Batch;
		detail?: BatchDetail;
		guide?: CropGuide;
	} | null>(null);

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
					visible.map((b) => {
						const guide = resolveGuide(b);
						const detail = detailById.get(b.id);
						return (
							<BatchCard
								key={b.id}
								batch={b}
								code={codeByBatch.get(b.id) ?? "—"}
								setup={setupById.get(b.setup_id)}
								guide={guide}
								detail={detail}
								isExpanded={expanded === b.id}
								onToggle={() =>
									setExpanded((cur) => (cur === b.id ? null : b.id))
								}
								onAutoAdvance={() =>
									setAdvanceTarget({ batch: b, detail, guide })
								}
							/>
						);
					})
				)}

				<TipCard />
			</ScrollView>

			<AdvanceStageDialog
				target={advanceTarget}
				onClose={() => setAdvanceTarget(null)}
			/>
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
	onAutoAdvance,
}: {
	batch: Batch;
	code: string;
	setup?: Setup;
	guide?: CropGuide;
	detail?: BatchDetail;
	isExpanded: boolean;
	onToggle: () => void;
	onAutoAdvance: () => void;
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

	const guideStage = findGuideStage(guide, currentStage);
	const daysToNextPhase =
		guideStage && nextStage ? Math.max(0, guideStage.day_max - day) : null;
	const readyToAdvance =
		nextStage !== null &&
		daysToNextPhase !== null &&
		daysToNextPhase === 0 &&
		(stateCounts.find((s) => s.milestone_code === currentStage)?.count ?? 0) >
			0;

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
					<CropImage url={guide?.image_url ?? null} />
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
							{readyToAdvance && nextStage ? (
								<View
									style={{
										flexDirection: "row",
										alignItems: "center",
										gap: 4,
										paddingHorizontal: 8,
										paddingVertical: 2,
										borderRadius: 6,
										backgroundColor: colors.warningLight,
									}}
								>
									<Ionicons
										name="flash"
										size={10}
										color={colors.warning}
									/>
									<Text
										size="xs"
										weight="bold"
										style={{ color: colors.warning, letterSpacing: 0.5 }}
									>
										READY → {STAGE_LABEL[nextStage].toUpperCase()}
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
							value={formatDateOnly(batch.started_at, {
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

					{nextStage ? (
						<View
							style={{
								flexDirection: "row",
								alignItems: "center",
								gap: spacing.xs,
								padding: spacing.sm,
								borderRadius: 12,
								backgroundColor: readyToAdvance
									? colors.warningLight
									: colors.successLight,
							}}
						>
							<Ionicons
								name={readyToAdvance ? "alert-circle" : "time-outline"}
								size={18}
								color={readyToAdvance ? colors.warning : colors.primaryLight}
							/>
							<Text size="sm" style={{ flex: 1 }}>
								{readyToAdvance ? (
									<>
										<Text weight="bold">Ready to advance</Text> to{" "}
										{STAGE_LABEL[nextStage]}.
									</>
								) : daysToNextPhase !== null ? (
									<>
										<Text weight="bold">~{daysToNextPhase}d</Text> to{" "}
										{STAGE_LABEL[nextStage]}.
									</>
								) : (
									<>Next phase: {STAGE_LABEL[nextStage]}.</>
								)}
							</Text>
						</View>
					) : null}

					<View
						style={{
							flexDirection: "row",
							gap: spacing.sm,
							marginTop: spacing.xs,
						}}
					>
						<View style={{ flex: 2, position: "relative" }}>
							<Pressable
								onPress={() => router.push(`/batch/${batch.id}`)}
								style={({ pressed }) => ({
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
							{readyToAdvance ? (
								<Pressable
									onPress={onAutoAdvance}
									hitSlop={8}
									style={({ pressed }) => ({
										position: "absolute",
										top: -6,
										right: -6,
										width: 22,
										height: 22,
										borderRadius: 999,
										backgroundColor: pressed ? colors.warning : colors.warning,
										borderWidth: 2,
										borderColor: colors.bg,
										alignItems: "center",
										justifyContent: "center",
										opacity: pressed ? 0.8 : 1,
									})}
								>
									<Ionicons name="flash" size={12} color={colors.bg} />
								</Pressable>
							) : null}
						</View>
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

function CropImage({ url }: { url: string | null }) {
	const [errored, setErrored] = useState(false);
	const showImg = !!url && !errored;
	return (
		<View
			style={{
				width: 56,
				height: 56,
				borderRadius: 12,
				backgroundColor: colors.glass,
				alignItems: "center",
				justifyContent: "center",
				overflow: "hidden",
			}}
		>
			{showImg ? (
				<Image
					source={{ uri: url ?? "" }}
					style={{ width: 56, height: 56 }}
					onError={() => setErrored(true)}
				/>
			) : (
				<Ionicons name="leaf" size={26} color={colors.primaryLight} />
			)}
		</View>
	);
}

function AdvanceStageDialog({
	target,
	onClose,
}: {
	target: { batch: Batch; detail?: BatchDetail; guide?: CropGuide } | null;
	onClose: () => void;
}) {
	const qc = useQueryClient();
	const stateCounts = target?.detail?.state_counts ?? [];
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
	const currentCount =
		stateCounts.find((s) => s.milestone_code === currentStage)?.count ?? 0;

	const [count, setCount] = useState("");
	const open = target !== null;

	useEffect(() => {
		if (open) setCount(currentCount > 0 ? String(currentCount) : "");
	}, [open, currentCount]);

	const transition = useMutation({
		mutationFn: () => {
			if (!target || !currentStage || !nextStage)
				throw new Error("No advance possible");
			return batchesApi.transition(target.batch.id, {
				from_milestone: currentStage,
				to_milestone: nextStage,
				count: Number.parseInt(count, 10) || 0,
			});
		},
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ["batches"] });
			if (target)
				qc.invalidateQueries({ queryKey: ["batch", target.batch.id] });
			setCount("");
			onClose();
		},
		onError: (e: Error) => Alert.alert("Error", e.message),
	});

	const close = () => {
		setCount("");
		onClose();
	};

	const n = Number.parseInt(count, 10) || 0;
	const valid = !!currentStage && !!nextStage && n > 0 && n <= currentCount;

	return (
		<Modal
			visible={open}
			transparent
			animationType="slide"
			onRequestClose={close}
		>
			<Pressable
				style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.6)" }}
				onPress={close}
			/>
			<KeyboardAvoidingView
				behavior={Platform.OS === "ios" ? "padding" : undefined}
				style={{ position: "absolute", left: 0, right: 0, bottom: 0 }}
			>
				<View
					style={{
						backgroundColor: colors.bg,
						borderTopLeftRadius: 24,
						borderTopRightRadius: 24,
						padding: spacing.md,
						paddingBottom: spacing.xxl,
						borderTopWidth: 1,
						borderColor: colors.border,
						gap: spacing.sm,
					}}
				>
					<View
						style={{
							flexDirection: "row",
							justifyContent: "space-between",
							alignItems: "center",
						}}
					>
						<Text size="lg" weight="bold">
							Advance to next phase
						</Text>
						<Pressable onPress={close} hitSlop={10}>
							<Ionicons name="close" size={24} color={colors.text} />
						</Pressable>
					</View>

					{currentStage && nextStage ? (
						<View
							style={{
								flexDirection: "row",
								alignItems: "center",
								gap: spacing.xs,
							}}
						>
							<View
								style={{
									paddingHorizontal: 10,
									paddingVertical: 4,
									borderRadius: 999,
									backgroundColor: colors.glass,
								}}
							>
								<Text size="sm" weight="semibold">
									{STAGE_LABEL[currentStage]}
								</Text>
							</View>
							<Ionicons
								name="arrow-forward"
								size={16}
								color={colors.textMuted}
							/>
							<View
								style={{
									paddingHorizontal: 10,
									paddingVertical: 4,
									borderRadius: 999,
									backgroundColor: colors.successLight,
								}}
							>
								<Text
									size="sm"
									weight="semibold"
									style={{ color: colors.primaryLight }}
								>
									{STAGE_LABEL[nextStage]}
								</Text>
							</View>
						</View>
					) : (
						<Text tone="muted">No next phase available.</Text>
					)}

					<Text size="sm" tone="muted">
						{currentCount} seed{currentCount === 1 ? "" : "s"} currently in{" "}
						{currentStage ? STAGE_LABEL[currentStage] : "—"}.
					</Text>

					<View style={{ gap: 6 }}>
						<Text
							size="xs"
							weight="semibold"
							tone="subtle"
							style={{ textTransform: "uppercase", letterSpacing: 0.5 }}
						>
							Seeds to advance
						</Text>
						<Input
							keyboardType="numeric"
							value={count}
							onChangeText={setCount}
							placeholder={String(currentCount)}
						/>
					</View>

					<Button
						label={valid ? `Advance ${n} seed${n === 1 ? "" : "s"}` : "Advance"}
						isLoading={transition.isPending}
						isDisabled={!valid || transition.isPending}
						onPress={() => transition.mutate()}
					/>
				</View>
			</KeyboardAvoidingView>
		</Modal>
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

import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
	Alert,
	Image,
	Platform,
	Pressable,
	ScrollView,
	View,
} from "react-native";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Combobox, type ComboboxOption } from "@/components/ui/combobox";
import { DatePicker } from "@/components/ui/date-picker";
import { GradientBackground } from "@/components/ui/gradient-background";
import { Input } from "@/components/ui/input";
import { SlotMeter } from "@/components/ui/slot-meter";
import { Text } from "@/components/ui/text";
import {
	radii,
	spacing,
	systemTypes,
	type ThemeColors,
	useThemeColors,
} from "@/constants/theme";
import { useBack } from "@/hooks/use-back";
import { useCustomToast } from "@/hooks/useCustomToast";
import {
	type Batch,
	type BatchDetail,
	type BatchTransition,
	batchesApi,
	cropsApi,
	MILESTONE_ORDER,
	type Milestone,
	milestonesForCategory,
	setupsApi,
} from "@/lib/hydro-api";
import {
	patchEntity,
	removeEntity,
	rollback,
	snapshotAndCancel,
} from "@/lib/optimistic";
import { QK, STALE } from "@/lib/query-config";
import { handleError } from "@/lib/utils";

function isoDateOnly(s: string | null | undefined): string | null {
	if (!s) return null;
	return s.slice(0, 10);
}

function timeAgo(iso: string): string {
	const diff = Date.now() - new Date(iso).getTime();
	const sec = Math.floor(diff / 1000);
	if (sec < 60) return "just now";
	const min = Math.floor(sec / 60);
	if (min < 60) return `${min}m ago`;
	const hr = Math.floor(min / 60);
	if (hr < 24) return `${hr}h ago`;
	const days = Math.floor(hr / 24);
	if (days < 7) return `${days}d ago`;
	return new Date(iso).toLocaleDateString();
}

const MILESTONE_META: Record<
	Milestone,
	{ icon: React.ComponentProps<typeof Ionicons>["name"] }
> = {
	Sowed: { icon: "ellipse-outline" },
	Germinated: { icon: "leaf-outline" },
	SeedLeaves: { icon: "leaf" },
	TrueLeaves: { icon: "rose-outline" },
	Transplanted: { icon: "git-branch" },
	Vegetative: { icon: "flower-outline" },
	Flowering: { icon: "flower" },
	FruitSet: { icon: "nutrition" },
	HarvestReady: { icon: "basket" },
	Harvested: { icon: "checkmark-done-circle" },
	Failed: { icon: "close-circle" },
};

export default function BatchDetailScreen() {
	const colors = useThemeColors();
	const { id } = useLocalSearchParams<{ id: string }>();
	const batchId = id ?? "";
	const qc = useQueryClient();
	const toast = useCustomToast();
	const goBack = useBack();

	const batch = useQuery({
		queryKey: QK.batches.detail(batchId),
		queryFn: () => batchesApi.get(batchId),
		enabled: !!batchId,
	});

	const [from, setFrom] = useState<Milestone>("Sowed");
	const [to, setTo] = useState<Milestone>("Germinated");
	const [cnt, setCnt] = useState("");
	const [notes, setNotes] = useState("");
	const [showAllSources, setShowAllSources] = useState(false);
	const [heroEditing, setHeroEditing] = useState(false);

	const transition = useMutation({
		mutationFn: (vars: {
			from: Milestone;
			to: Milestone;
			count: number;
			notes: string | null;
		}) =>
			batchesApi.transition(batchId, {
				from_milestone: vars.from,
				to_milestone: vars.to,
				count: vars.count,
				notes: vars.notes ?? undefined,
			}),
		onMutate: async (vars) => {
			const snapshot = await snapshotAndCancel(qc, [
				QK.batches.detail(batchId),
			]);
			const nowIso = new Date().toISOString();
			qc.setQueryData(QK.batches.detail(batchId), (old: unknown) => {
				if (!old) return old;
				const detail = old as BatchDetail;
				const stateCounts = [...(detail.state_counts ?? [])];
				const fromIdx = stateCounts.findIndex(
					(c) => c.milestone_code === vars.from,
				);
				if (fromIdx >= 0) {
					stateCounts[fromIdx] = {
						...stateCounts[fromIdx],
						count: Math.max(0, stateCounts[fromIdx].count - vars.count),
						updated_at: nowIso,
					};
				}
				const toIdx = stateCounts.findIndex(
					(c) => c.milestone_code === vars.to,
				);
				if (toIdx >= 0) {
					stateCounts[toIdx] = {
						...stateCounts[toIdx],
						count: stateCounts[toIdx].count + vars.count,
						updated_at: nowIso,
					};
				} else {
					stateCounts.push({
						milestone_code: vars.to,
						count: vars.count,
						updated_at: nowIso,
					});
				}
				const synthetic: BatchTransition = {
					id: `optimistic-${nowIso}`,
					from_milestone: vars.from,
					to_milestone: vars.to,
					count: vars.count,
					occurred_at: nowIso,
					notes: vars.notes,
					photo_url: null,
				};
				return {
					...detail,
					state_counts: stateCounts,
					recent_transitions: [synthetic, ...(detail.recent_transitions ?? [])],
				};
			});
			setCnt("");
			setNotes("");
			return { snapshot };
		},
		onError: (err, vars, ctx) => {
			if (ctx) rollback(qc, ctx.snapshot);
			toast.errorWithRetry(`Couldn't move phase: ${handleError(err)}`, () =>
				transition.mutate(vars),
			);
		},
		onSettled: () => {
			qc.invalidateQueries({ queryKey: QK.batches.all });
		},
	});

	const [hw, setHw] = useState("");
	const [hc, setHc] = useState("");
	const [allocSlots, setAllocSlots] = useState("");
	const [allocSeeds, setAllocSeeds] = useState("1");

	const seededAllocIdRef = useRef<string | null>(null);
	useEffect(() => {
		if (
			batch.data &&
			!batch.data.legacy &&
			seededAllocIdRef.current !== batch.data.id
		) {
			seededAllocIdRef.current = batch.data.id;
			setAllocSlots(String(batch.data.slots_used ?? ""));
			setAllocSeeds(String(batch.data.seeds_per_slot ?? "1"));
		}
	}, [batch.data]);

	const [editSetupId, setEditSetupId] = useState<string>("");
	const [editVariety, setEditVariety] = useState("");
	const [editCropId, setEditCropId] = useState<string | null>(null);
	const [editStartDate, setEditStartDate] = useState<string | null>(null);
	const [editNotes, setEditNotes] = useState("");

	const setupsQ = useQuery({
		queryKey: QK.setups.list(),
		queryFn: () => setupsApi.list(),
		staleTime: STALE.setups,
	});

	const editSetupQ = useQuery({
		queryKey: QK.setups.detail(editSetupId),
		queryFn: () => setupsApi.get(editSetupId),
		enabled: !!editSetupId && editSetupId !== batch.data?.setup_id,
	});

	const cropsQ = useQuery({
		queryKey: QK.crops(),
		queryFn: () => cropsApi.list(undefined, undefined, { limit: 1000 }),
		staleTime: STALE.crops,
	});

	const cropOptions: ComboboxOption[] = useMemo(
		() =>
			(cropsQ.data?.data ?? []).map((c) => ({
				value: c.id,
				label: c.name_en,
				subtitle: c.name_tl || c.category,
			})),
		[cropsQ.data],
	);

	const resolvedCropGuide = useMemo(() => {
		const crops = cropsQ.data?.data ?? [];
		if (crops.length === 0) return null;
		const id = batch.data?.crop_guide_id;
		if (id) {
			const byId = crops.find((c) => c.id === id);
			if (byId) return byId;
		}
		const v = batch.data?.variety_name?.toLowerCase().trim();
		if (!v) return null;
		const direct = crops.find(
			(c) => c.name_en?.toLowerCase() === v || c.name_tl?.toLowerCase() === v,
		);
		if (direct) return direct;
		return (
			crops.find((c) => {
				const en = c.name_en?.toLowerCase();
				const tl = c.name_tl?.toLowerCase();
				return (
					(en && (v.includes(en) || en.includes(v))) ||
					(tl && (v.includes(tl) || tl.includes(v)))
				);
			}) ?? null
		);
	}, [cropsQ.data, batch.data?.crop_guide_id, batch.data?.variety_name]);

	const cropCategory = resolvedCropGuide?.category ?? null;
	const cropImage = resolvedCropGuide?.image_url ?? null;
	const milestoneOrder = useMemo(
		() => milestonesForCategory(cropCategory),
		[cropCategory],
	);
	useEffect(() => {
		if (to === "Failed") return;
		const fromIdx = milestoneOrder.indexOf(from);
		const toIdx = milestoneOrder.indexOf(to);
		if (toIdx <= fromIdx) {
			const next = milestoneOrder[fromIdx + 1];
			if (next) setTo(next);
		}
	}, [from, to, milestoneOrder]);

	useEffect(() => {
		if (!milestoneOrder.includes(from)) {
			setFrom(milestoneOrder[0] ?? "Sowed");
		}
	}, [milestoneOrder, from]);

	useEffect(() => {
		if (!batch.data || showAllSources) return;
		const fromCount =
			batch.data.state_counts.find((c) => c.milestone_code === from)?.count ??
			0;
		if (fromCount > 0) return;
		const firstSource = milestoneOrder.find(
			(m) =>
				(batch.data?.state_counts.find((c) => c.milestone_code === m)?.count ??
					0) > 0,
		);
		if (firstSource && firstSource !== from) setFrom(firstSource);
	}, [batch.data, milestoneOrder, from, showAllSources]);

	const seededEditIdRef = useRef<string | null>(null);
	useEffect(() => {
		if (batch.data && seededEditIdRef.current !== batch.data.id) {
			seededEditIdRef.current = batch.data.id;
			setEditSetupId(batch.data.setup_id);
			setEditVariety(batch.data.variety_name);
			setEditCropId(batch.data.crop_guide_id);
			setEditStartDate(isoDateOnly(batch.data.started_at));
			setEditNotes(batch.data.notes ?? "");
		}
	}, [batch.data]);

	const updateBatch = useMutation({
		mutationFn: () =>
			batchesApi.update(batchId, {
				setup_id:
					editSetupId && editSetupId !== batch.data?.setup_id
						? editSetupId
						: undefined,
				variety_name: editVariety.trim(),
				crop_guide_id: editCropId,
				notes: editNotes.trim() || null,
				started_at: editStartDate
					? `${editStartDate}T00:00:00.000Z`
					: undefined,
			}),
		onMutate: async () => {
			const snapshot = await snapshotAndCancel(qc, [
				QK.batches.detail(batchId),
				QK.batches.lists(),
			]);
			const patch: Partial<Batch> = {
				setup_id:
					editSetupId && editSetupId !== batch.data?.setup_id
						? editSetupId
						: batch.data?.setup_id,
				variety_name: editVariety.trim(),
				crop_guide_id: editCropId,
				notes: editNotes.trim() || null,
				started_at: editStartDate
					? `${editStartDate}T00:00:00.000Z`
					: batch.data?.started_at,
			};
			qc.setQueryData(QK.batches.detail(batchId), (old: unknown) =>
				patchEntity<Batch>(old, batchId, patch),
			);
			qc.setQueriesData({ queryKey: QK.batches.lists() }, (old: unknown) =>
				patchEntity<Batch>(old, batchId, patch),
			);
			return { snapshot };
		},
		onError: (err, _vars, ctx) => {
			if (ctx) rollback(qc, ctx.snapshot);
			toast.errorWithRetry(`Couldn't update batch: ${handleError(err)}`, () =>
				updateBatch.mutate(),
			);
		},
		onSettled: () => {
			qc.invalidateQueries({ queryKey: QK.batches.all });
			qc.invalidateQueries({ queryKey: QK.setups.all });
		},
	});

	const setupQ = useQuery({
		queryKey: QK.setups.detail(batch.data?.setup_id ?? ""),
		queryFn: () => setupsApi.get(batch.data?.setup_id ?? ""),
		enabled: !!batch.data?.setup_id,
	});
	const emptySlots =
		setupQ.data?.slots.filter((s) => s.status === "empty" && !s.batch_id)
			.length ?? 0;

	const allocate = useMutation({
		mutationFn: (vars: { slots_used: number; seeds_per_slot: number }) =>
			batchesApi.allocateSlots(batchId, vars),
		onMutate: async (vars) => {
			const snapshot = await snapshotAndCancel(qc, [
				QK.batches.detail(batchId),
				QK.batches.lists(),
			]);
			const patch: Partial<Batch> = {
				slots_used: vars.slots_used,
				seeds_per_slot: vars.seeds_per_slot,
			};
			qc.setQueryData(QK.batches.detail(batchId), (old: unknown) =>
				patchEntity<Batch>(old, batchId, patch),
			);
			qc.setQueriesData({ queryKey: QK.batches.lists() }, (old: unknown) =>
				patchEntity<Batch>(old, batchId, patch),
			);
			return { snapshot };
		},
		onSuccess: () => {
			setAllocSlots("");
		},
		onError: (err, vars, ctx) => {
			if (ctx) rollback(qc, ctx.snapshot);
			toast.errorWithRetry(
				`Couldn't update allocation: ${handleError(err)}`,
				() => allocate.mutate(vars),
			);
		},
		onSettled: () => {
			qc.invalidateQueries({ queryKey: QK.batches.all });
			qc.invalidateQueries({ queryKey: QK.setups.all });
		},
	});

	const del = useMutation({
		mutationFn: () => batchesApi.delete(batchId),
		onMutate: async () => {
			const snapshot = await snapshotAndCancel(qc, [
				QK.batches.lists(),
				QK.batches.detail(batchId),
			]);
			qc.setQueriesData({ queryKey: QK.batches.lists() }, (old: unknown) =>
				removeEntity(old, batchId),
			);
			router.replace("/seeds");
			return { snapshot };
		},
		onError: (err, _vars, ctx) => {
			if (ctx) rollback(qc, ctx.snapshot);
			toast.error(`Couldn't delete batch: ${handleError(err)}`);
		},
		onSettled: () => {
			qc.invalidateQueries({ queryKey: QK.batches.all });
			qc.invalidateQueries({ queryKey: QK.setups.all });
		},
	});

	const saveHero = async () => {
		if (!batch.data) return;
		const bd = batch.data;
		const newSlotsNum = Number.parseInt(allocSlots, 10) || 0;
		const newSeedsNum = Number.parseInt(allocSeeds, 10) || 0;
		const slotsChanged =
			bd.legacy ||
			newSlotsNum !== (bd.slots_used ?? 0) ||
			newSeedsNum !== (bd.seeds_per_slot ?? 0);
		const effectiveStoredCropId =
			bd.crop_guide_id ?? resolvedCropGuide?.id ?? null;
		const detailsChanged =
			editSetupId !== bd.setup_id ||
			editVariety.trim() !== bd.variety_name ||
			editCropId !== effectiveStoredCropId ||
			editStartDate !== isoDateOnly(bd.started_at) ||
			(editNotes.trim() || null) !== bd.notes;
		try {
			if (slotsChanged && newSlotsNum > 0 && newSeedsNum > 0) {
				await allocate.mutateAsync({
					slots_used: newSlotsNum,
					seeds_per_slot: newSeedsNum,
				});
			}
			if (detailsChanged) {
				await updateBatch.mutateAsync();
			}
			setHeroEditing(false);
		} catch {
			// individual mutation onError already alerts
		}
	};

	const harvest = useMutation({
		mutationFn: (vars: { weight_grams: number; count: number }) =>
			batchesApi.harvest(batchId, vars),
		onMutate: async (vars) => {
			const snapshot = await snapshotAndCancel(qc, [
				QK.batches.detail(batchId),
			]);
			const nowIso = new Date().toISOString();
			qc.setQueryData(QK.batches.detail(batchId), (old: unknown) => {
				if (!old) return old;
				const detail = old as BatchDetail;
				const stateCounts = [...(detail.state_counts ?? [])];
				const idx = stateCounts.findIndex(
					(c) => c.milestone_code === "HarvestReady",
				);
				if (idx >= 0) {
					stateCounts[idx] = {
						...stateCounts[idx],
						count: Math.max(0, stateCounts[idx].count - vars.count),
						updated_at: nowIso,
					};
				}
				return { ...detail, state_counts: stateCounts };
			});
			setHw("");
			setHc("");
			return { snapshot };
		},
		onSuccess: () => {
			toast.success("Harvest recorded.");
		},
		onError: (err, vars, ctx) => {
			if (ctx) rollback(qc, ctx.snapshot);
			toast.errorWithRetry(`Couldn't record harvest: ${handleError(err)}`, () =>
				harvest.mutate(vars),
			);
		},
		onSettled: () => {
			qc.invalidateQueries({ queryKey: QK.batches.all });
			qc.invalidateQueries({ queryKey: QK.produce.all });
		},
	});

	if (batch.isLoading)
		return (
			<GradientBackground>
				<View
					style={{
						flex: 1,
						alignItems: "center",
						justifyContent: "center",
					}}
				>
					<Text tone="muted">Loading...</Text>
				</View>
			</GradientBackground>
		);
	if (!batch.data)
		return (
			<GradientBackground>
				<View
					style={{
						flex: 1,
						alignItems: "center",
						justifyContent: "center",
					}}
				>
					<Text tone="muted">Not found.</Text>
				</View>
			</GradientBackground>
		);

	const b = batch.data;
	const byMs = new Map(b.state_counts.map((c) => [c.milestone_code, c.count]));
	const age = Math.floor(
		(Date.now() - new Date(b.started_at).getTime()) / 86400000,
	);
	const available = byMs.get(from) ?? 0;
	const currentSetup = setupsQ.data?.data.find((s) => s.id === b.setup_id);
	const setupMeta = currentSetup ? systemTypes[currentSetup.type] : null;
	const totalActive = MILESTONE_ORDER.filter((m) => m !== "Failed").reduce(
		(a, m) => a + (byMs.get(m) ?? 0),
		0,
	);
	const failedCount = byMs.get("Failed") ?? 0;
	const cntNum = Number.parseInt(cnt, 10) || 0;
	const validTransition = cntNum > 0 && cntNum <= available && from !== to;
	const sourcePhases = milestoneOrder.filter((m) => (byMs.get(m) ?? 0) > 0);
	const visibleSources = showAllSources ? milestoneOrder : sourcePhases;
	const hasAnyTransitionableSource = sourcePhases.length > 0;
	const harvestReadyCount = byMs.get("HarvestReady") ?? 0;
	const harvestActive = harvestReadyCount > 0;
	const fromIdxForChips = milestoneOrder.indexOf(from);
	const forwardTargets = milestoneOrder.filter(
		(_, idx) => idx > fromIdxForChips,
	);

	return (
		<GradientBackground>
			<ScrollView
				contentContainerStyle={{
					padding: spacing.md,
					paddingBottom: spacing.xxxl,
					gap: spacing.md,
				}}
			>
				{/* Back row */}
				<View
					style={{
						flexDirection: "row",
						alignItems: "center",
						gap: spacing.xs,
					}}
				>
					<Pressable onPress={goBack} hitSlop={12}>
						<Ionicons name="arrow-back" size={24} color={colors.text} />
					</Pressable>
					<Text size="sm" tone="muted" style={{ flex: 1 }}>
						Edit batch
					</Text>
					<Pressable
						hitSlop={8}
						onPress={() => {
							const title = "Delete Batch";
							const body =
								"Delete this batch? Slots will be freed. Cannot be undone.";
							if (Platform.OS === "web") {
								if (globalThis.window?.confirm?.(`${title}\n\n${body}`)) {
									del.mutate();
								}
								return;
							}
							Alert.alert(title, body, [
								{ text: "Cancel", style: "cancel" },
								{
									text: "Delete",
									style: "destructive",
									onPress: () => del.mutate(),
								},
							]);
						}}
						disabled={del.isPending}
						style={{
							width: 36,
							height: 36,
							borderRadius: 12,
							borderWidth: 1,
							borderColor: colors.error ?? "#EF4444",
							alignItems: "center",
							justifyContent: "center",
						}}
					>
						<Ionicons
							name="trash-outline"
							size={18}
							color={colors.error ?? "#EF4444"}
						/>
					</Pressable>
				</View>

				{/* HERO — info display + inline edit */}
				<Card>
					{/* Top row: image + title + edit toggle */}
					<View style={{ flexDirection: "row", gap: spacing.md }}>
						<View
							style={{
								width: 72,
								height: 72,
								borderRadius: radii.lg,
								backgroundColor: colors.glass,
								alignItems: "center",
								justifyContent: "center",
								overflow: "hidden",
							}}
						>
							{cropImage ? (
								<Image
									source={{ uri: cropImage }}
									style={{ width: "100%", height: "100%" }}
									resizeMode="cover"
								/>
							) : (
								<Ionicons name="leaf" size={32} color={colors.primaryLight} />
							)}
						</View>
						<View style={{ flex: 1, justifyContent: "center" }}>
							<Text size="xxl" weight="bold" numberOfLines={1}>
								{b.variety_name}
							</Text>
							<View
								style={{
									flexDirection: "row",
									alignItems: "center",
									gap: spacing.xs,
									marginTop: 2,
								}}
							>
								<Ionicons
									name="time-outline"
									size={12}
									color={colors.textMuted}
								/>
								<Text size="xs" tone="muted">
									Day {age} · {b.initial_count} initial
								</Text>
							</View>
							<View
								style={{
									flexDirection: "row",
									alignItems: "center",
									gap: spacing.xs,
									marginTop: 2,
								}}
							>
								<Ionicons
									name="cash-outline"
									size={12}
									color={colors.textMuted}
								/>
								<Text size="xs" tone="muted">
									Seed cost:{" "}
									{b.seed_cost != null ? `₱${b.seed_cost.toFixed(2)}` : "—"}
								</Text>
							</View>
							{setupMeta && currentSetup ? (
								<View
									style={{
										flexDirection: "row",
										alignItems: "center",
										gap: 4,
										marginTop: spacing.xs,
										paddingHorizontal: spacing.xs,
										paddingVertical: 3,
										borderRadius: radii.full,
										backgroundColor: setupMeta.bg,
										alignSelf: "flex-start",
									}}
								>
									<Ionicons
										name={setupMeta.icon as never}
										size={11}
										color={setupMeta.color}
									/>
									<Text
										size="xs"
										weight="semibold"
										style={{ color: setupMeta.color }}
									>
										{currentSetup.name}
									</Text>
								</View>
							) : null}
						</View>
						{!heroEditing ? (
							<Pressable
								onPress={() => {
									if (batch.data) {
										setEditSetupId(batch.data.setup_id);
										setEditVariety(batch.data.variety_name);
										setEditCropId(
											batch.data.crop_guide_id ?? resolvedCropGuide?.id ?? null,
										);
										setEditStartDate(isoDateOnly(batch.data.started_at));
										setEditNotes(batch.data.notes ?? "");
									}
									setHeroEditing(true);
								}}
								hitSlop={8}
								style={({ pressed }) => ({
									flexDirection: "row",
									alignItems: "center",
									gap: 4,
									paddingHorizontal: spacing.sm,
									paddingVertical: spacing.xs,
									borderRadius: radii.full,
									borderWidth: 1,
									borderColor: colors.border,
									backgroundColor: pressed ? colors.glassHover : "transparent",
									alignSelf: "flex-start",
								})}
							>
								<Ionicons
									name="create-outline"
									size={14}
									color={colors.primary}
								/>
								<Text
									size="xs"
									weight="semibold"
									style={{ color: colors.primary }}
								>
									Edit
								</Text>
							</Pressable>
						) : null}
					</View>

					<View
						style={{
							height: 1,
							backgroundColor: colors.borderLight,
							marginVertical: spacing.md,
						}}
					/>

					{!heroEditing ? (
						/* INFO VIEW */
						<View style={{ gap: spacing.sm }}>
							<InfoRow
								icon="grid-outline"
								label="Slots × Seeds"
								value={
									b.slots_used && b.seeds_per_slot
										? `${b.slots_used} × ${b.seeds_per_slot} = ${b.slots_used * b.seeds_per_slot} seeds`
										: b.legacy
											? "Legacy — no allocation"
											: "—"
								}
								colors={colors}
							/>
							<InfoRow
								icon="calendar-outline"
								label="Started"
								value={
									editStartDate
										? new Date(editStartDate).toLocaleDateString()
										: "—"
								}
								colors={colors}
							/>
							<InfoRow
								icon="leaf-outline"
								label="Crop type"
								value={
									(editCropId
										? cropsQ.data?.data.find((c) => c.id === editCropId)
												?.name_en
										: resolvedCropGuide?.name_en) ?? "Not set"
								}
								colors={colors}
							/>
							{b.notes ? (
								<InfoRow
									icon="document-text-outline"
									label="Notes"
									value={b.notes}
									colors={colors}
									multiline
								/>
							) : null}
						</View>
					) : (
						/* EDIT FORM */
						<View>
							{(() => {
								const currentSlots = b.slots_used ?? 0;
								const newSlots = Number.parseInt(allocSlots, 10) || 0;
								const newSeeds = Number.parseInt(allocSeeds, 10) || 0;
								const maxAllowed = currentSlots + emptySlots;
								const hasTransitions = b.recent_transitions.length > 0;
								const slotsValid =
									newSlots > 0 && newSlots <= maxAllowed && newSeeds > 0;
								const detailsValid = editVariety.trim().length > 0;
								const targetEmpty =
									editSetupQ.data?.slots.filter(
										(s) => s.status === "empty" && !s.batch_id,
									).length ?? 0;
								const needSlots = b.slots_used ?? 0;
								const setupShort =
									editSetupId !== b.setup_id &&
									needSlots > 0 &&
									targetEmpty < needSlots;
								const busy = allocate.isPending || updateBatch.isPending;

								return (
									<>
										<Label>VARIETY NAME</Label>
										<Input value={editVariety} onChangeText={setEditVariety} />

										<View style={{ height: spacing.md }} />
										<Label>SETUP</Label>
										<View
											style={{
												flexDirection: "row",
												flexWrap: "wrap",
												gap: spacing.xs,
											}}
										>
											{(setupsQ.data?.data ?? []).map((s) => {
												const active = editSetupId === s.id;
												const c = systemTypes[s.type];
												return (
													<Pressable
														key={s.id}
														onPress={() => setEditSetupId(s.id)}
														style={{
															flexDirection: "row",
															alignItems: "center",
															gap: 6,
															paddingHorizontal: spacing.sm,
															paddingVertical: spacing.xs,
															borderRadius: 12,
															borderWidth: 1,
															borderColor: active ? c.color : colors.border,
															backgroundColor: active ? c.bg : "transparent",
														}}
													>
														<Ionicons
															name={c.icon as never}
															size={14}
															color={active ? c.color : colors.textMuted}
														/>
														<Text
															size="sm"
															weight="semibold"
															style={{
																color: active ? c.color : colors.text,
															}}
														>
															{s.name}
														</Text>
													</Pressable>
												);
											})}
										</View>
										{editSetupId !== b.setup_id ? (
											<Text
												size="xs"
												style={{
													marginTop: 6,
													color: setupShort ? colors.error : colors.textMuted,
												}}
											>
												{needSlots > 0
													? `Need ${needSlots} empty slots · ${targetEmpty} available in target`
													: "Moving to different setup"}
											</Text>
										) : null}

										{/* SLOTS & SEEDS inline */}
										<View style={{ height: spacing.md }} />
										<SlotMeter
											used={newSlots}
											free={maxAllowed}
											label="Slot allocation"
										/>
										<View style={{ height: spacing.sm }} />

										<View
											style={{
												flexDirection: "row",
												alignItems: "center",
												justifyContent: "space-between",
												marginBottom: 6,
											}}
										>
											<Label>SLOTS USED</Label>
											<Text size="xs" tone="muted">
												max {maxAllowed}
											</Text>
										</View>
										<View
											style={{
												flexDirection: "row",
												gap: spacing.xs,
												alignItems: "stretch",
											}}
										>
											<StepperBtn
												icon="remove"
												onPress={() =>
													setAllocSlots(String(Math.max(0, newSlots - 1)))
												}
												disabled={newSlots <= 0}
												colors={colors}
											/>
											<View style={{ flex: 1 }}>
												<Input
													keyboardType="numeric"
													value={allocSlots}
													onChangeText={setAllocSlots}
													placeholder={`Up to ${maxAllowed}`}
													style={{ textAlign: "center" }}
												/>
											</View>
											<StepperBtn
												icon="add"
												onPress={() =>
													setAllocSlots(
														String(Math.min(maxAllowed, newSlots + 1)),
													)
												}
												disabled={newSlots >= maxAllowed}
												colors={colors}
											/>
											<Pressable
												onPress={() => setAllocSlots(String(maxAllowed))}
												disabled={maxAllowed <= 0}
												style={({ pressed }) => ({
													paddingHorizontal: spacing.md,
													justifyContent: "center",
													borderRadius: radii.md,
													borderWidth: 1,
													borderColor: colors.border,
													backgroundColor: pressed
														? colors.glassHover
														: colors.glass,
													opacity: maxAllowed <= 0 ? 0.4 : 1,
												})}
											>
												<Text size="sm" weight="semibold">
													Max
												</Text>
											</Pressable>
										</View>

										<View style={{ height: spacing.sm }} />
										<Label>SEEDS PER SLOT</Label>
										<View
											style={{
												flexDirection: "row",
												gap: spacing.xs,
												alignItems: "stretch",
											}}
										>
											<StepperBtn
												icon="remove"
												onPress={() =>
													setAllocSeeds(String(Math.max(1, newSeeds - 1)))
												}
												disabled={newSeeds <= 1}
												colors={colors}
											/>
											<View style={{ flex: 1 }}>
												<Input
													keyboardType="numeric"
													value={allocSeeds}
													onChangeText={setAllocSeeds}
													style={{ textAlign: "center" }}
												/>
											</View>
											<StepperBtn
												icon="add"
												onPress={() => setAllocSeeds(String(newSeeds + 1))}
												colors={colors}
											/>
										</View>
										{hasTransitions && !b.legacy ? (
											<Text size="xs" tone="muted" style={{ marginTop: 4 }}>
												Transitions recorded — initial count will not change.
											</Text>
										) : null}

										<View style={{ height: spacing.md }} />
										<Label>CROP TYPE</Label>
										<Combobox
											value={editCropId}
											onValueChange={(v, opt) => {
												setEditCropId(v);
												if (opt && !editVariety.trim())
													setEditVariety(opt.label);
											}}
											options={cropOptions}
											placeholder="Pick a crop"
											searchPlaceholder="Search crops..."
											emptyMessage={
												cropsQ.isLoading ? "Loading crops..." : "No crops found"
											}
											allowClear
										/>

										<View style={{ height: spacing.md }} />
										<Label>START DATE</Label>
										<DatePicker
											value={editStartDate}
											onChange={setEditStartDate}
											placeholder="Today"
										/>

										<View style={{ height: spacing.md }} />
										<Label>NOTES</Label>
										<Input
											value={editNotes}
											onChangeText={setEditNotes}
											placeholder="Optional"
											multiline
										/>

										<View style={{ height: spacing.lg }} />
										<View style={{ flexDirection: "row", gap: spacing.xs }}>
											<Pressable
												onPress={() => {
													setHeroEditing(false);
													setEditSetupId(b.setup_id);
													setEditVariety(b.variety_name);
													setEditCropId(
														b.crop_guide_id ?? resolvedCropGuide?.id ?? null,
													);
													setEditStartDate(isoDateOnly(b.started_at));
													setEditNotes(b.notes ?? "");
													setAllocSlots(String(b.slots_used ?? ""));
													setAllocSeeds(String(b.seeds_per_slot ?? "1"));
												}}
												disabled={busy}
												style={({ pressed }) => ({
													flex: 1,
													height: 44,
													borderRadius: radii.md,
													borderWidth: 1,
													borderColor: colors.border,
													backgroundColor: pressed
														? colors.glassHover
														: colors.glass,
													alignItems: "center",
													justifyContent: "center",
													opacity: busy ? 0.5 : 1,
												})}
											>
												<Text size="sm" weight="semibold">
													Cancel
												</Text>
											</Pressable>
											<View style={{ flex: 2 }}>
												<Button
													label="Save Changes"
													isLoading={busy}
													isDisabled={
														!detailsValid ||
														(!b.legacy && !slotsValid) ||
														setupShort
													}
													onPress={saveHero}
												/>
											</View>
										</View>
									</>
								);
							})()}
						</View>
					)}
				</Card>

				{/* MOVE PHASE (PRIMARY) */}
				<Card>
					<View
						style={{
							flexDirection: "row",
							alignItems: "center",
							gap: spacing.xs,
							marginBottom: spacing.xxs,
						}}
					>
						<Ionicons name="leaf" size={18} color={colors.primary} />
						<Text size="lg" weight="bold" style={{ flex: 1 }}>
							Move phase
						</Text>
						<Badge
							label={`${totalActive} active`}
							color={colors.primaryLight}
							small
						/>
					</View>

					{!hasAnyTransitionableSource && !showAllSources ? (
						<View
							style={{
								paddingVertical: spacing.lg,
								alignItems: "center",
								gap: spacing.xs,
							}}
						>
							<Ionicons
								name="leaf-outline"
								size={28}
								color={colors.textMuted}
							/>
							<Text size="sm" tone="muted">
								No seeds in any phase yet.
							</Text>
							<Pressable onPress={() => setShowAllSources(true)} hitSlop={8}>
								<Text
									size="sm"
									weight="semibold"
									style={{ color: colors.primary }}
								>
									Show all phases to backfill →
								</Text>
							</Pressable>
						</View>
					) : (
						<>
							{/* Step 1: SOURCE */}
							<View
								style={{
									flexDirection: "row",
									alignItems: "center",
									justifyContent: "space-between",
									marginTop: spacing.xs,
									marginBottom: 6,
								}}
							>
								<Label>1 · FROM PHASE</Label>
								{sourcePhases.length < milestoneOrder.length ? (
									<Pressable
										onPress={() => setShowAllSources((v) => !v)}
										hitSlop={6}
									>
										<Text
											size="xs"
											weight="semibold"
											style={{ color: colors.primary }}
										>
											{showAllSources ? "Hide empty" : "Show all phases"}
										</Text>
									</Pressable>
								) : null}
							</View>
							<View style={{ gap: 6 }}>
								{visibleSources.map((m) => {
									const count = byMs.get(m) ?? 0;
									const has = count > 0;
									const active = from === m;
									const meta = MILESTONE_META[m];
									const accent = active
										? colors.primary
										: has
											? colors.text
											: colors.textMuted;
									return (
										<Pressable
											key={m}
											disabled={!has && !showAllSources}
											onPress={() => setFrom(m)}
											style={{
												flexDirection: "row",
												alignItems: "center",
												gap: spacing.sm,
												paddingHorizontal: spacing.sm,
												paddingVertical: spacing.sm,
												borderRadius: radii.md,
												borderWidth: active ? 2 : 1,
												borderColor: active ? colors.primary : colors.border,
												backgroundColor: active
													? colors.successLight
													: "transparent",
												opacity: !has && showAllSources ? 0.55 : 1,
											}}
										>
											<View
												style={{
													width: 22,
													height: 22,
													borderRadius: radii.full,
													borderWidth: 2,
													borderColor: active
														? colors.primary
														: colors.borderStrong,
													alignItems: "center",
													justifyContent: "center",
												}}
											>
												{active ? (
													<View
														style={{
															width: 10,
															height: 10,
															borderRadius: radii.full,
															backgroundColor: colors.primary,
														}}
													/>
												) : null}
											</View>
											<View
												style={{
													width: 32,
													height: 32,
													borderRadius: radii.full,
													backgroundColor: `${accent}1F`,
													alignItems: "center",
													justifyContent: "center",
												}}
											>
												<Ionicons name={meta.icon} size={16} color={accent} />
											</View>
											<Text
												size="md"
												weight="semibold"
												style={{ flex: 1, color: colors.text }}
											>
												{m}
											</Text>
											<Text
												size="lg"
												weight="bold"
												style={{
													color: has ? colors.text : colors.textMuted,
												}}
											>
												{count}
											</Text>
											<Text size="xs" tone="muted">
												{count === 1 ? "seed" : "seeds"}
											</Text>
										</Pressable>
									);
								})}
							</View>

							{/* Step 2: DESTINATION */}
							<View style={{ height: spacing.md }} />
							<Label>2 · MOVE TO</Label>
							{forwardTargets.length === 0 ? (
								<Text size="xs" tone="muted">
									{from} is the final phase.
								</Text>
							) : (
								<View
									style={{
										flexDirection: "row",
										flexWrap: "wrap",
										gap: 6,
									}}
								>
									{forwardTargets.map((m) => {
										const active = to === m;
										const meta = MILESTONE_META[m];
										return (
											<Pressable
												key={m}
												onPress={() => setTo(m)}
												style={{
													flexDirection: "row",
													alignItems: "center",
													gap: 6,
													paddingHorizontal: spacing.sm,
													paddingVertical: spacing.xs,
													borderRadius: radii.full,
													borderWidth: active ? 2 : 1,
													borderColor: active ? colors.primary : colors.border,
													backgroundColor: active
														? colors.successLight
														: "transparent",
												}}
											>
												<Ionicons
													name={meta.icon}
													size={14}
													color={active ? colors.primary : colors.textMuted}
												/>
												<Text
													size="sm"
													weight="semibold"
													style={{
														color: active ? colors.primary : colors.text,
													}}
												>
													{m}
												</Text>
											</Pressable>
										);
									})}
								</View>
							)}

							{/* Failed action (separated, destructive) */}
							<View style={{ height: spacing.xs }} />
							<Pressable
								onPress={() => setTo("Failed")}
								style={{
									flexDirection: "row",
									alignItems: "center",
									gap: 6,
									paddingHorizontal: spacing.sm,
									paddingVertical: spacing.xs,
									borderRadius: radii.full,
									borderWidth: to === "Failed" ? 2 : 1,
									borderColor: to === "Failed" ? colors.error : colors.border,
									backgroundColor:
										to === "Failed" ? colors.errorLight : "transparent",
									alignSelf: "flex-start",
								}}
							>
								<Ionicons name="close-circle" size={14} color={colors.error} />
								<Text
									size="sm"
									weight="semibold"
									style={{ color: colors.error }}
								>
									Mark as Failed
								</Text>
							</Pressable>

							{/* Step 3: COUNT */}
							<View style={{ height: spacing.md }} />
							<View
								style={{
									flexDirection: "row",
									alignItems: "center",
									justifyContent: "space-between",
									marginBottom: 6,
								}}
							>
								<Label>3 · HOW MANY?</Label>
								<Text size="xs" tone="muted">
									{available} available
								</Text>
							</View>
							<View
								style={{
									flexDirection: "row",
									alignItems: "stretch",
									gap: spacing.xs,
								}}
							>
								<StepperBtn
									icon="remove"
									onPress={() => setCnt(String(Math.max(0, cntNum - 1)))}
									disabled={cntNum <= 0}
									colors={colors}
								/>
								<View style={{ flex: 1 }}>
									<Input
										keyboardType="numeric"
										value={cnt}
										onChangeText={setCnt}
										placeholder="0"
										style={{ textAlign: "center" }}
									/>
								</View>
								<StepperBtn
									icon="add"
									onPress={() =>
										setCnt(String(Math.min(available, cntNum + 1)))
									}
									disabled={cntNum >= available}
									colors={colors}
								/>
								<Pressable
									onPress={() => setCnt(String(available))}
									disabled={available <= 0}
									style={({ pressed }) => ({
										paddingHorizontal: spacing.md,
										justifyContent: "center",
										borderRadius: radii.md,
										borderWidth: 1,
										borderColor: colors.border,
										backgroundColor: pressed ? colors.glassHover : colors.glass,
										opacity: available <= 0 ? 0.4 : 1,
									})}
								>
									<Text size="sm" weight="semibold">
										All
									</Text>
								</Pressable>
							</View>

							<View style={{ height: spacing.sm }} />
							<Label>NOTES (OPTIONAL)</Label>
							<Input
								value={notes}
								onChangeText={setNotes}
								placeholder="e.g. transplanted to bigger net pots"
							/>

							<View style={{ height: spacing.md }} />

							{/* Summary preview */}
							{validTransition ? (
								<View
									style={{
										flexDirection: "row",
										alignItems: "center",
										justifyContent: "center",
										gap: spacing.xs,
										paddingVertical: spacing.xs,
										marginBottom: spacing.xs,
										borderRadius: radii.md,
										backgroundColor:
											to === "Failed" ? colors.errorLight : colors.successLight,
									}}
								>
									<Text size="sm" weight="bold">
										{cntNum}
									</Text>
									<Text size="sm" weight="semibold">
										{from}
									</Text>
									<Ionicons
										name="arrow-forward"
										size={14}
										color={to === "Failed" ? colors.error : colors.primary}
									/>
									<Text
										size="sm"
										weight="bold"
										style={{
											color: to === "Failed" ? colors.error : colors.primary,
										}}
									>
										{to}
									</Text>
								</View>
							) : null}

							<Button
								label={
									to === "Failed"
										? `Mark ${cntNum || ""} as Failed`.trim()
										: `Move ${cntNum || ""} to ${to}`.replace(/\s+/g, " ")
								}
								variant={to === "Failed" ? "danger" : "solid"}
								isLoading={transition.isPending}
								isDisabled={!validTransition}
								onPress={() =>
									transition.mutate({
										from,
										to,
										count: cntNum,
										notes: notes.trim() || null,
									})
								}
							/>
						</>
					)}
				</Card>

				{/* CURRENT DISTRIBUTION */}
				{totalActive > 0 || failedCount > 0 ? (
					<Card>
						<Text
							size="xs"
							weight="semibold"
							tone="muted"
							style={{
								textTransform: "uppercase",
								letterSpacing: 0.5,
								marginBottom: spacing.xs,
							}}
						>
							Current distribution
						</Text>
						<View
							style={{
								flexDirection: "row",
								flexWrap: "wrap",
								gap: spacing.xs,
							}}
						>
							{MILESTONE_ORDER.filter((m) => (byMs.get(m) ?? 0) > 0).map(
								(m) => (
									<Badge
										key={m}
										label={`${m} · ${byMs.get(m)}`}
										color={colors.primaryLight}
										small
									/>
								),
							)}
							{failedCount > 0 ? (
								<Badge
									label={`Failed · ${failedCount}`}
									color={colors.error}
									small
								/>
							) : null}
						</View>
					</Card>
				) : null}

				{/* RECORD HARVEST */}
				<Card>
					<View
						style={{
							flexDirection: "row",
							alignItems: "center",
							gap: spacing.xs,
							marginBottom: spacing.xs,
						}}
					>
						<View
							style={{
								width: 32,
								height: 32,
								borderRadius: radii.full,
								backgroundColor: harvestActive
									? colors.successLight
									: colors.glass,
								alignItems: "center",
								justifyContent: "center",
							}}
						>
							<Ionicons
								name="basket"
								size={16}
								color={harvestActive ? colors.primary : colors.textMuted}
							/>
						</View>
						<Text
							size="lg"
							weight="bold"
							style={{
								flex: 1,
								color: harvestActive ? colors.text : colors.textSecondary,
							}}
						>
							Record Harvest
						</Text>
						{harvestActive ? (
							<Badge
								label={`${harvestReadyCount} ready`}
								color={colors.primary}
								small
							/>
						) : null}
					</View>
					{!harvestActive ? (
						<Text size="sm" tone="muted">
							Available when seeds reach HarvestReady.
						</Text>
					) : (
						<>
							<View
								style={{ flexDirection: "row", gap: 10, marginTop: spacing.xs }}
							>
								<View style={{ flex: 1 }}>
									<Label>WEIGHT (g)</Label>
									<Input
										keyboardType="numeric"
										value={hw}
										onChangeText={setHw}
									/>
								</View>
								<View style={{ flex: 1 }}>
									<Label>COUNT</Label>
									<Input
										keyboardType="numeric"
										value={hc}
										onChangeText={setHc}
									/>
								</View>
							</View>
							<View style={{ height: spacing.md }} />
							<Button
								label="Record Harvest"
								isLoading={harvest.isPending}
								isDisabled={
									Number.parseFloat(hw) <= 0 || Number.parseInt(hc, 10) <= 0
								}
								onPress={() =>
									harvest.mutate({
										weight_grams: Number.parseFloat(hw) || 0,
										count: Number.parseInt(hc, 10) || 0,
									})
								}
							/>
						</>
					)}
				</Card>

				{/* RECENT TRANSITIONS TIMELINE */}
				<Card>
					<View
						style={{
							flexDirection: "row",
							alignItems: "center",
							gap: spacing.xs,
							marginBottom: spacing.sm,
						}}
					>
						<Ionicons name="time" size={18} color={colors.primary} />
						<Text size="lg" weight="bold" style={{ flex: 1 }}>
							History
						</Text>
						{b.recent_transitions.length > 0 ? (
							<Text size="xs" tone="muted">
								{b.recent_transitions.length} entries
							</Text>
						) : null}
					</View>
					{b.recent_transitions.length === 0 ? (
						<View
							style={{
								paddingVertical: spacing.md,
								alignItems: "center",
								gap: 4,
							}}
						>
							<Ionicons
								name="hourglass-outline"
								size={24}
								color={colors.textMuted}
							/>
							<Text size="sm" tone="muted">
								No transitions yet.
							</Text>
						</View>
					) : (
						<View>
							{b.recent_transitions.map((t, idx) => {
								const isLast = idx === b.recent_transitions.length - 1;
								const failed = t.to_milestone === "Failed";
								const dotColor = failed ? colors.error : colors.primary;
								return (
									<View
										key={t.id}
										style={{ flexDirection: "row", gap: spacing.sm }}
									>
										<View style={{ alignItems: "center", width: 16 }}>
											<View
												style={{
													width: 10,
													height: 10,
													borderRadius: radii.full,
													backgroundColor: dotColor,
													marginTop: 4,
												}}
											/>
											{!isLast ? (
												<View
													style={{
														flex: 1,
														width: 2,
														backgroundColor: colors.borderLight,
														marginTop: 2,
													}}
												/>
											) : null}
										</View>
										<View
											style={{
												flex: 1,
												paddingBottom: isLast ? 0 : spacing.sm,
											}}
										>
											<View
												style={{
													flexDirection: "row",
													alignItems: "center",
													gap: 4,
													flexWrap: "wrap",
												}}
											>
												<Text size="sm" weight="semibold">
													{t.from_milestone}
												</Text>
												<Ionicons
													name="arrow-forward"
													size={12}
													color={colors.textMuted}
												/>
												<Text
													size="sm"
													weight="semibold"
													style={{
														color: failed ? colors.error : colors.text,
													}}
												>
													{t.to_milestone}
												</Text>
												<Badge label={`${t.count}`} color={dotColor} small />
											</View>
											<Text size="xs" tone="muted" style={{ marginTop: 2 }}>
												{timeAgo(t.occurred_at)}
											</Text>
											{t.notes ? (
												<Text size="xs" style={{ marginTop: 2 }}>
													{t.notes}
												</Text>
											) : null}
										</View>
									</View>
								);
							})}
						</View>
					)}
				</Card>
			</ScrollView>
		</GradientBackground>
	);
}

function Label({ children }: { children: React.ReactNode }) {
	return (
		<Text
			size="xs"
			weight="semibold"
			tone="subtle"
			style={{
				textTransform: "uppercase",
				letterSpacing: 0.5,
				marginBottom: 6,
			}}
		>
			{children}
		</Text>
	);
}

function StepperBtn({
	icon,
	onPress,
	disabled,
	colors,
}: {
	icon: React.ComponentProps<typeof Ionicons>["name"];
	onPress: () => void;
	disabled?: boolean;
	colors: ThemeColors;
}) {
	return (
		<Pressable
			onPress={onPress}
			disabled={disabled}
			hitSlop={6}
			style={({ pressed }) => ({
				width: 44,
				justifyContent: "center",
				alignItems: "center",
				borderRadius: radii.md,
				borderWidth: 1,
				borderColor: colors.border,
				backgroundColor: pressed ? colors.glassHover : colors.glass,
				opacity: disabled ? 0.4 : 1,
			})}
		>
			<Ionicons name={icon} size={18} color={colors.text} />
		</Pressable>
	);
}

function InfoRow({
	icon,
	label,
	value,
	colors,
	multiline,
}: {
	icon: React.ComponentProps<typeof Ionicons>["name"];
	label: string;
	value: string;
	colors: ThemeColors;
	multiline?: boolean;
}) {
	return (
		<View
			style={{
				flexDirection: "row",
				alignItems: multiline ? "flex-start" : "center",
				gap: spacing.sm,
			}}
		>
			<View
				style={{
					width: 28,
					height: 28,
					borderRadius: radii.full,
					backgroundColor: colors.glass,
					alignItems: "center",
					justifyContent: "center",
				}}
			>
				<Ionicons name={icon} size={14} color={colors.textSecondary} />
			</View>
			<View style={{ flex: 1 }}>
				<Text size="xs" tone="muted">
					{label}
				</Text>
				<Text size="sm" weight="semibold" numberOfLines={multiline ? 3 : 1}>
					{value}
				</Text>
			</View>
		</View>
	);
}

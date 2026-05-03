import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, View } from "react-native";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Combobox, type ComboboxOption } from "@/components/ui/combobox";
import { DatePicker } from "@/components/ui/date-picker";
import { GradientBackground } from "@/components/ui/gradient-background";
import { Input } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { colors, spacing, systemTypes } from "@/constants/theme";
import { useBack } from "@/hooks/use-back";
import {
	batchesApi,
	cropsApi,
	MILESTONE_ORDER,
	type Milestone,
	setupsApi,
} from "@/lib/hydro-api";

function isoDateOnly(s: string | null | undefined): string | null {
	if (!s) return null;
	return s.slice(0, 10);
}

const ALL_TARGETS: Milestone[] = [...MILESTONE_ORDER, "Failed"];

export default function BatchDetailScreen() {
	const { id } = useLocalSearchParams<{ id: string }>();
	const batchId = id ?? "";
	const qc = useQueryClient();
	const goBack = useBack();

	const batch = useQuery({
		queryKey: ["batch", batchId],
		queryFn: () => batchesApi.get(batchId),
		enabled: !!batchId,
	});

	const [from, setFrom] = useState<Milestone>("Sowed");
	const [to, setTo] = useState<Milestone>("Germinated");
	const [cnt, setCnt] = useState("");
	const [notes, setNotes] = useState("");

	useEffect(() => {
		if (to === "Failed") return;
		const fromIdx = MILESTONE_ORDER.indexOf(from);
		const toIdx = MILESTONE_ORDER.indexOf(to);
		if (toIdx <= fromIdx) {
			const next = MILESTONE_ORDER[fromIdx + 1];
			if (next) setTo(next);
		}
	}, [from, to]);

	const transition = useMutation({
		mutationFn: () =>
			batchesApi.transition(batchId, {
				from_milestone: from,
				to_milestone: to,
				count: Number.parseInt(cnt, 10) || 0,
				notes: notes.trim() || undefined,
			}),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ["batch", batchId] });
			qc.invalidateQueries({ queryKey: ["batches"] });
			setCnt("");
			setNotes("");
		},
		onError: (e: Error) => Alert.alert("Error", e.message),
	});

	const [hw, setHw] = useState("");
	const [hc, setHc] = useState("");
	const [allocSlots, setAllocSlots] = useState("");
	const [allocSeeds, setAllocSeeds] = useState("1");

	useEffect(() => {
		if (batch.data && !batch.data.legacy) {
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
		queryKey: ["setups"],
		queryFn: () => setupsApi.list(),
	});

	const editSetupQ = useQuery({
		queryKey: ["setup", editSetupId],
		queryFn: () => setupsApi.get(editSetupId),
		enabled: !!editSetupId && editSetupId !== batch.data?.setup_id,
	});

	const cropsQ = useQuery({
		queryKey: ["crops"],
		queryFn: () => cropsApi.list(),
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

	useEffect(() => {
		if (batch.data) {
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
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ["batch", batchId] });
			qc.invalidateQueries({ queryKey: ["batches"] });
			qc.invalidateQueries({ queryKey: ["setup"] });
			Alert.alert("Saved", "Batch updated.");
		},
		onError: (e: Error) => Alert.alert("Update failed", e.message),
	});

	const setupQ = useQuery({
		queryKey: ["setup", batch.data?.setup_id],
		queryFn: () => setupsApi.get(batch.data?.setup_id ?? ""),
		enabled: !!batch.data?.setup_id,
	});
	const emptySlots =
		setupQ.data?.slots.filter((s) => s.status === "empty" && !s.batch_id)
			.length ?? 0;

	const allocate = useMutation({
		mutationFn: () =>
			batchesApi.allocateSlots(batchId, {
				slots_used: Number.parseInt(allocSlots, 10) || 0,
				seeds_per_slot: Number.parseInt(allocSeeds, 10) || 0,
			}),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ["batch", batchId] });
			qc.invalidateQueries({ queryKey: ["batches"] });
			qc.invalidateQueries({ queryKey: ["setup"] });
			setAllocSlots("");
		},
		onError: (e: Error) => Alert.alert("Allocate failed", e.message),
	});

	const del = useMutation({
		mutationFn: () => batchesApi.delete(batchId),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ["batches"] });
			qc.invalidateQueries({ queryKey: ["setup"] });
			router.back();
		},
		onError: (e: Error) => Alert.alert("Delete failed", e.message),
	});

	const harvest = useMutation({
		mutationFn: () =>
			batchesApi.harvest(batchId, {
				weight_grams: Number.parseFloat(hw) || 0,
				count: Number.parseInt(hc, 10) || 0,
			}),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ["batch", batchId] });
			setHw("");
			setHc("");
			Alert.alert("Saved", "Harvest recorded.");
		},
		onError: (e: Error) => Alert.alert("Error", e.message),
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

	return (
		<GradientBackground>
			<ScrollView
				contentContainerStyle={{
					padding: spacing.md,
					paddingBottom: spacing.xxxl,
				}}
			>
				<View
					style={{
						flexDirection: "row",
						alignItems: "center",
						gap: spacing.xs,
						marginBottom: spacing.xs,
					}}
				>
					<Pressable onPress={goBack}>
						<Ionicons name="arrow-back" size={24} color={colors.text} />
					</Pressable>
					<View style={{ flex: 1 }}>
						<Text size="xxl" weight="bold">
							{b.variety_name}
						</Text>
						<Text size="xs" tone="muted">
							Day {age} · {b.initial_count} units initial
							{b.slots_used && b.seeds_per_slot
								? ` · ${b.slots_used} slots × ${b.seeds_per_slot}`
								: ""}
						</Text>
					</View>
					<Pressable
						hitSlop={8}
						onPress={() =>
							Alert.alert(
								"Delete Batch",
								"Delete this batch? Slots will be freed. Cannot be undone.",
								[
									{ text: "Cancel", style: "cancel" },
									{
										text: "Delete",
										style: "destructive",
										onPress: () => del.mutate(),
									},
								],
							)
						}
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

				<Card>
					{b.legacy ? (
						<View
							style={{
								flexDirection: "row",
								alignItems: "center",
								gap: spacing.xs,
								marginBottom: spacing.sm,
							}}
						>
							<Badge
								label="Legacy"
								color={colors.textMuted}
								bg={colors.glass}
								small
							/>
							<Text size="sm" tone="muted" style={{ flex: 1 }}>
								No slot allocation. Assign slots to track.
							</Text>
						</View>
					) : (
						<Text size="lg" weight="bold" style={{ marginBottom: spacing.xs }}>
							Slots & Seeds
						</Text>
					)}
					{(() => {
						const currentSlots = b.slots_used ?? 0;
						const newSlots = Number.parseInt(allocSlots, 10) || 0;
						const delta = newSlots - currentSlots;
						const maxAllowed = currentSlots + emptySlots;
						const hasTransitions = b.recent_transitions.length > 0;
						return (
							<>
								<Label>SLOTS USED</Label>
								<Input
									keyboardType="numeric"
									value={allocSlots}
									onChangeText={setAllocSlots}
									placeholder={`Up to ${maxAllowed}`}
								/>
								<Text size="xs" tone="muted" style={{ marginTop: 4 }}>
									{b.legacy
										? `${emptySlots} empty slots in setup`
										: `Current: ${currentSlots} · ${emptySlots} empty in setup · max ${maxAllowed}`}
								</Text>
								<View style={{ height: spacing.sm }} />
								<Label>SEEDS PER SLOT</Label>
								<Input
									keyboardType="numeric"
									value={allocSeeds}
									onChangeText={setAllocSeeds}
								/>
								{hasTransitions && !b.legacy ? (
									<Text size="xs" tone="muted" style={{ marginTop: 4 }}>
										Transitions recorded — initial count will not change.
									</Text>
								) : null}
								<View style={{ height: spacing.md }} />
								<Button
									label={b.legacy ? "Allocate Slots" : "Update Slots & Seeds"}
									isLoading={allocate.isPending}
									isDisabled={
										newSlots <= 0 ||
										newSlots > maxAllowed ||
										Number.parseInt(allocSeeds, 10) <= 0 ||
										allocate.isPending ||
										(!b.legacy &&
											delta === 0 &&
											Number.parseInt(allocSeeds, 10) ===
												(b.seeds_per_slot ?? 0))
									}
									onPress={() => allocate.mutate()}
								/>
							</>
						);
					})()}
				</Card>

				<View style={{ height: 20 }} />

				<Card>
					<Text size="lg" weight="bold" style={{ marginBottom: spacing.xs }}>
						Edit Batch
					</Text>
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
										style={{ color: active ? c.color : colors.text }}
									>
										{s.name}
									</Text>
								</Pressable>
							);
						})}
					</View>
					{editSetupId && editSetupId !== b.setup_id ? (() => {
						const targetEmpty =
							editSetupQ.data?.slots.filter(
								(s) => s.status === "empty" && !s.batch_id,
							).length ?? 0;
						const need = b.slots_used ?? 0;
						const short = need > 0 && targetEmpty < need;
						return (
							<Text
								size="xs"
								style={{
									marginTop: 6,
									color: short ? colors.error : colors.textMuted,
								}}
							>
								{need > 0
									? `Need ${need} empty slots · ${targetEmpty} available in target`
									: "Moving to different setup"}
							</Text>
						);
					})() : null}
					<View style={{ height: spacing.sm }} />
					<Label>VARIETY NAME</Label>
					<Input value={editVariety} onChangeText={setEditVariety} />
					<View style={{ height: spacing.sm }} />
					<Label>CROP GUIDE</Label>
					<Combobox
						value={editCropId}
						onValueChange={(v, opt) => {
							setEditCropId(v);
							if (opt && !editVariety.trim()) setEditVariety(opt.label);
						}}
						options={cropOptions}
						placeholder="Pick a crop"
						searchPlaceholder="Search crops..."
						emptyMessage={
							cropsQ.isLoading ? "Loading crops..." : "No crops found"
						}
						allowClear
					/>
					<View style={{ height: spacing.sm }} />
					<Label>START DATE</Label>
					<DatePicker
						value={editStartDate}
						onChange={setEditStartDate}
						placeholder="Today"
					/>
					<View style={{ height: spacing.sm }} />
					<Label>NOTES</Label>
					<Input
						value={editNotes}
						onChangeText={setEditNotes}
						placeholder="Optional"
						multiline
					/>
					<View style={{ height: spacing.md }} />
					<Button
						label="Save Changes"
						isLoading={updateBatch.isPending}
						isDisabled={editVariety.trim().length === 0}
						onPress={() => updateBatch.mutate()}
					/>
				</Card>

				<View style={{ height: 20 }} />

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
						style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.xs }}
					>
						{MILESTONE_ORDER.filter((m) => (byMs.get(m) ?? 0) > 0).map((m) => (
							<Badge
								key={m}
								label={`${m} · ${byMs.get(m)}`}
								color={colors.primaryLight}
								small
							/>
						))}
						{(byMs.get("Failed") ?? 0) > 0 ? (
							<Badge
								label={`Failed · ${byMs.get("Failed")}`}
								color={colors.error}
								small
							/>
						) : null}
					</View>
				</Card>

				<View style={{ height: 20 }} />

				<Card>
					<Text size="lg" weight="bold">
						Record Transition
					</Text>
					<Text size="xs" tone="muted" style={{ marginBottom: spacing.sm }}>
						Nothing auto-advances. You approve each step.
					</Text>

					<Label>FROM</Label>
					<View
						style={{
							flexDirection: "row",
							flexWrap: "wrap",
							gap: 6,
							marginBottom: spacing.sm,
						}}
					>
						{MILESTONE_ORDER.map((m) => {
							const has = (byMs.get(m) ?? 0) > 0;
							const active = from === m;
							return (
								<Pressable
									key={m}
									disabled={!has}
									onPress={() => setFrom(m)}
									style={{
										paddingHorizontal: spacing.xs,
										paddingVertical: spacing.xxs,
										borderRadius: 999,
										borderWidth: 1,
										borderColor: active ? colors.primaryLight : colors.border,
										backgroundColor: active
											? `${colors.primaryLight}26`
											: "transparent",
										opacity: has ? 1 : 0.35,
									}}
								>
									<Text
										size="xs"
										weight="semibold"
										style={{
											color: active ? colors.primaryLight : colors.text,
										}}
									>
										{m}
										{has ? ` (${byMs.get(m)})` : ""}
									</Text>
								</Pressable>
							);
						})}
					</View>

					<Label>TO</Label>
					<View
						style={{
							flexDirection: "row",
							flexWrap: "wrap",
							gap: 6,
							marginBottom: spacing.sm,
						}}
					>
						{ALL_TARGETS.map((m) => {
							const active = to === m;
							const err = m === "Failed";
							const col = err ? colors.error : colors.primaryLight;
							const fromIdx = MILESTONE_ORDER.indexOf(from);
							const toIdx = MILESTONE_ORDER.indexOf(m);
							const disabled = !err && toIdx >= 0 && toIdx <= fromIdx;
							return (
								<Pressable
									key={m}
									disabled={disabled}
									onPress={() => setTo(m)}
									style={{
										paddingHorizontal: spacing.xs,
										paddingVertical: spacing.xxs,
										borderRadius: 999,
										borderWidth: 1,
										borderColor: active ? col : colors.border,
										backgroundColor: active ? `${col}26` : "transparent",
										opacity: disabled ? 0.35 : 1,
									}}
								>
									<Text
										size="xs"
										weight="semibold"
										style={{ color: active ? col : colors.text }}
									>
										{m}
									</Text>
								</Pressable>
							);
						})}
					</View>

					<Label>{`COUNT (max ${available})`}</Label>
					<View
						style={{
							flexDirection: "row",
							alignItems: "stretch",
							gap: spacing.xs,
						}}
					>
						<View style={{ flex: 1 }}>
							<Input
								keyboardType="numeric"
								value={cnt}
								onChangeText={setCnt}
								placeholder={`How many ${from} → ${to}?`}
							/>
						</View>
						<Pressable
							onPress={() => setCnt(String(available))}
							disabled={available <= 0}
							style={({ pressed }) => ({
								paddingHorizontal: spacing.md,
								justifyContent: "center",
								borderRadius: 12,
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

					<View style={{ height: 12 }} />
					<Label>NOTES</Label>
					<Input value={notes} onChangeText={setNotes} placeholder="Optional" />

					<View style={{ height: 16 }} />
					<Button
						label="Save Transition"
						isLoading={transition.isPending}
						isDisabled={
							Number.parseInt(cnt, 10) <= 0 ||
							Number.parseInt(cnt, 10) > available ||
							from === to
						}
						onPress={() => transition.mutate()}
					/>
				</Card>

				<View style={{ height: 20 }} />

				<Card>
					<Text size="lg" weight="bold">
						Record Harvest
					</Text>
					<Text size="xs" tone="muted" style={{ marginBottom: spacing.sm }}>
						Available in HarvestReady: {byMs.get("HarvestReady") ?? 0}
					</Text>
					<View style={{ flexDirection: "row", gap: 10 }}>
						<View style={{ flex: 1 }}>
							<Label>WEIGHT (g)</Label>
							<Input keyboardType="numeric" value={hw} onChangeText={setHw} />
						</View>
						<View style={{ flex: 1 }}>
							<Label>COUNT</Label>
							<Input keyboardType="numeric" value={hc} onChangeText={setHc} />
						</View>
					</View>
					<View style={{ height: 16 }} />
					<Button
						label="Record Harvest"
						isLoading={harvest.isPending}
						isDisabled={
							Number.parseFloat(hw) <= 0 || Number.parseInt(hc, 10) <= 0
						}
						onPress={() => harvest.mutate()}
					/>
				</Card>

				<View style={{ height: 20 }} />

				<Card>
					<Text size="lg" weight="bold" style={{ marginBottom: spacing.xs }}>
						Recent Transitions
					</Text>
					{b.recent_transitions.length === 0 ? (
						<Text size="sm" tone="muted">
							No transitions yet.
						</Text>
					) : (
						<View style={{ gap: 10 }}>
							{b.recent_transitions.map((t) => (
								<View
									key={t.id}
									style={{
										borderWidth: 1,
										borderColor: colors.borderLight,
										borderRadius: 12,
										padding: spacing.sm,
									}}
								>
									<Text size="sm" weight="semibold">
										{t.from_milestone} → {t.to_milestone} · {t.count}
									</Text>
									<Text size="xs" tone="muted">
										{new Date(t.occurred_at).toLocaleString()}
									</Text>
									{t.notes ? (
										<Text size="xs" style={{ marginTop: spacing.xxs }}>
											{t.notes}
										</Text>
									) : null}
								</View>
							))}
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

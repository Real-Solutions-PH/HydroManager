import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, View } from "react-native";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Combobox, type ComboboxOption } from "@/components/ui/combobox";
import { DatePicker } from "@/components/ui/date-picker";
import { GradientBackground } from "@/components/ui/gradient-background";
import { Input } from "@/components/ui/input";
import { SlotMeter } from "@/components/ui/slot-meter";
import { Text } from "@/components/ui/text";
import { colors, spacing, systemTypes } from "@/constants/theme";
import { useBack } from "@/hooks/use-back";
import { batchesApi, cropsApi, setupsApi } from "@/lib/hydro-api";

function todayIso(): string {
	const d = new Date();
	const y = d.getFullYear();
	const m = String(d.getMonth() + 1).padStart(2, "0");
	const day = String(d.getDate()).padStart(2, "0");
	return `${y}-${m}-${day}`;
}

export default function NewBatchScreen() {
	const { setup: setupParam } = useLocalSearchParams<{ setup?: string }>();
	const qc = useQueryClient();
	const goBack = useBack();
	const setups = useQuery({
		queryKey: ["setups"],
		queryFn: () => setupsApi.list(),
	});
	const crops = useQuery({
		queryKey: ["crops"],
		queryFn: () => cropsApi.list(),
	});

	const [setupId, setSetupId] = useState(setupParam ?? "");
	const [cropId, setCropId] = useState<string | null>(null);
	const [variety, setVariety] = useState("");
	const [startDate, setStartDate] = useState<string | null>(todayIso());
	const [slotsUsed, setSlotsUsed] = useState("4");
	const [seedsPerSlot, setSeedsPerSlot] = useState("1");
	const [notes, setNotes] = useState("");

	const selectedSetup = useQuery({
		queryKey: ["setup", setupId],
		queryFn: () => setupsApi.get(setupId),
		enabled: !!setupId,
	});
	const emptySlots =
		selectedSetup.data?.slots.filter((s) => s.status === "empty" && !s.batch_id)
			.length ?? 0;

	const slotsUsedNum = Number.parseInt(slotsUsed, 10) || 0;
	const seedsPerSlotNum = Number.parseInt(seedsPerSlot, 10) || 0;
	const totalSeeds = slotsUsedNum * seedsPerSlotNum;
	const overCapacity = setupId.length > 0 && slotsUsedNum > emptySlots;

	const cropOptions: ComboboxOption[] = useMemo(
		() =>
			(crops.data?.data ?? []).map((c) => ({
				value: c.id,
				label: c.name_en,
				subtitle: c.name_tl || c.category,
			})),
		[crops.data],
	);

	const selectedCrop = useMemo(
		() => (crops.data?.data ?? []).find((c) => c.id === cropId) ?? null,
		[crops.data, cropId],
	);

	const create = useMutation({
		mutationFn: () =>
			batchesApi.create({
				setup_id: setupId,
				variety_name: variety.trim(),
				slots_used: slotsUsedNum,
				seeds_per_slot: seedsPerSlotNum,
				crop_guide_id: cropId,
				notes: notes.trim() || undefined,
				started_at: startDate
					? `${startDate}T00:00:00.000Z`
					: undefined,
			}),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ["batches"] });
			qc.invalidateQueries({ queryKey: ["setup", setupId] });
			goBack();
		},
		onError: (e: Error) => Alert.alert("Error", e.message),
	});

	const valid =
		setupId.length > 0 &&
		variety.trim().length > 0 &&
		slotsUsedNum > 0 &&
		seedsPerSlotNum > 0 &&
		!overCapacity;

	return (
		<GradientBackground>
			<ScrollView
				contentContainerStyle={{
					padding: spacing.md,
					paddingBottom: spacing.xxxl,
				}}
				keyboardShouldPersistTaps="handled"
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
					<Text size="xxl" weight="bold">
						New Batch
					</Text>
				</View>

				<Card>
					<Field label="Setup">
						<View
							style={{
								flexDirection: "row",
								flexWrap: "wrap",
								gap: spacing.xs,
							}}
						>
							{(setups.data?.data ?? []).map((s) => {
								const active = setupId === s.id;
								const c = systemTypes[s.type];
								return (
									<Pressable
										key={s.id}
										onPress={() => setSetupId(s.id)}
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
						{(setups.data?.data ?? []).length === 0 ? (
							<Text size="xs" tone="muted">
								Create a setup first.
							</Text>
						) : null}
					</Field>

					<Field label="Variety (Crop)">
						<Combobox
							value={cropId}
							onValueChange={(v, opt) => {
								setCropId(v);
								setVariety(opt?.label ?? "");
							}}
							options={cropOptions}
							placeholder="Pick a crop"
							searchPlaceholder="Search crops..."
							emptyMessage={
								crops.isLoading ? "Loading crops..." : "No crops found"
							}
							allowClear
						/>
						{selectedCrop ? (
							<Text size="xs" tone="muted" style={{ marginTop: 6 }}>
								Crop guide: {selectedCrop.name_en} ·{" "}
								{selectedCrop.days_to_harvest_min}-
								{selectedCrop.days_to_harvest_max} days to harvest
							</Text>
						) : null}
					</Field>

					<Field label="Variety Name">
						<Input
							placeholder="e.g. Pechay Black Behi"
							value={variety}
							onChangeText={setVariety}
						/>
					</Field>

					<Field label="Start Date">
						<DatePicker
							value={startDate}
							onChange={setStartDate}
							placeholder="Today"
						/>
						<Text size="xs" tone="muted" style={{ marginTop: 4 }}>
							Defaults to today if left blank.
						</Text>
					</Field>

					<Field label="Slots Used">
						<Input
							keyboardType="numeric"
							value={slotsUsed}
							onChangeText={setSlotsUsed}
							invalid={overCapacity}
						/>
						{setupId ? (
							<View style={{ marginTop: 8 }}>
								<SlotMeter
									used={slotsUsedNum}
									free={emptySlots}
									label="Slot usage"
								/>
							</View>
						) : null}
					</Field>

					<Field label="Seeds per Slot">
						<Input
							keyboardType="numeric"
							value={seedsPerSlot}
							onChangeText={setSeedsPerSlot}
						/>
						{slotsUsedNum > 0 && seedsPerSlotNum > 0 ? (
							<Text size="xs" tone="muted" style={{ marginTop: 4 }}>
								Total seeds (Sowed): {totalSeeds}
							</Text>
						) : null}
					</Field>

					<Field label="Notes">
						<Input
							placeholder="Optional"
							value={notes}
							onChangeText={setNotes}
							multiline
						/>
					</Field>
				</Card>

				<View style={{ gap: spacing.xs, marginTop: spacing.lg }}>
					<Button
						label="Start Batch"
						isLoading={create.isPending}
						isDisabled={
							!valid || create.isPending || setups.isLoading || crops.isLoading
						}
						onPress={() => create.mutate()}
					/>
					<Button variant="ghost" label="Cancel" onPress={goBack} />
				</View>
			</ScrollView>
		</GradientBackground>
	);
}

function Field({
	label,
	children,
}: {
	label: string;
	children: React.ReactNode;
}) {
	return (
		<View style={{ gap: 6, marginBottom: spacing.md }}>
			<Text
				size="xs"
				weight="semibold"
				tone="subtle"
				style={{ textTransform: "uppercase", letterSpacing: 0.5 }}
			>
				{label}
			</Text>
			{children}
		</View>
	);
}

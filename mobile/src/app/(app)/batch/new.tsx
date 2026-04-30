import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Alert, Pressable, ScrollView, View } from "react-native";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { GradientBackground } from "@/components/ui/gradient-background";
import { Input } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { colors, spacing, systemTypes } from "@/constants/theme";
import { useBack } from "@/hooks/use-back";
import { batchesApi, cropsApi, setupsApi } from "@/lib/hydro-api";

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
	const [variety, setVariety] = useState("");
	const [cropId, setCropId] = useState<string | null>(null);
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

	const create = useMutation({
		mutationFn: () =>
			batchesApi.create({
				setup_id: setupId,
				variety_name: variety.trim(),
				slots_used: slotsUsedNum,
				seeds_per_slot: seedsPerSlotNum,
				crop_guide_id: cropId,
				notes: notes.trim() || undefined,
			}),
		onSuccess: (b) => {
			qc.invalidateQueries({ queryKey: ["batches"] });
			qc.invalidateQueries({ queryKey: ["setup", setupId] });
			router.replace(`/batch/${b.id}`);
		},
		onError: (e: Error) => Alert.alert("Error", e.message),
	});

	const valid =
		setupId.length > 0 &&
		variety.trim().length > 0 &&
		slotsUsedNum > 0 &&
		seedsPerSlotNum > 0 &&
		slotsUsedNum <= emptySlots;

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

					<Field label="Variety">
						<Input
							placeholder="e.g. Pechay Black Behi"
							value={variety}
							onChangeText={setVariety}
						/>
					</Field>

					<Field label="Crop Guide (optional)">
						<View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
							<CropChip
								label="None"
								active={cropId === null}
								onPress={() => setCropId(null)}
							/>
							{(crops.data?.data ?? []).map((c) => (
								<CropChip
									key={c.id}
									label={c.name_en}
									active={cropId === c.id}
									onPress={() => {
										setCropId(c.id);
										if (!variety) setVariety(c.name_en);
									}}
								/>
							))}
						</View>
					</Field>

					<Field label="Slots Used">
						<Input
							keyboardType="numeric"
							value={slotsUsed}
							onChangeText={setSlotsUsed}
						/>
						{setupId ? (
							<Text size="xs" tone="muted" style={{ marginTop: 4 }}>
								{emptySlots} empty slots available
							</Text>
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

function CropChip({
	label,
	active,
	onPress,
}: {
	label: string;
	active: boolean;
	onPress: () => void;
}) {
	return (
		<Pressable
			onPress={onPress}
			style={{
				paddingHorizontal: 10,
				paddingVertical: 5,
				borderRadius: 999,
				borderWidth: 1,
				borderColor: active ? colors.primaryLight : colors.border,
				backgroundColor: active ? `${colors.primaryLight}26` : "transparent",
			}}
		>
			<Text
				size="xs"
				weight="semibold"
				style={{ color: active ? colors.primaryLight : colors.text }}
			>
				{label}
			</Text>
		</Pressable>
	);
}

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
import { colors, systemTypes } from "@/constants/theme";
import { batchesApi, cropsApi, setupsApi } from "@/lib/hydro-api";

export default function NewBatchScreen() {
	const { setup: setupParam } = useLocalSearchParams<{ setup?: string }>();
	const qc = useQueryClient();
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
	const [count, setCount] = useState("20");
	const [notes, setNotes] = useState("");

	const create = useMutation({
		mutationFn: () =>
			batchesApi.create({
				setup_id: setupId,
				variety_name: variety.trim(),
				initial_count: Number.parseInt(count, 10) || 0,
				crop_guide_id: cropId,
				notes: notes.trim() || undefined,
			}),
		onSuccess: (b) => {
			qc.invalidateQueries({ queryKey: ["batches"] });
			router.replace(`/batch/${b.id}`);
		},
		onError: (e: Error) => Alert.alert("Error", e.message),
	});

	const valid =
		setupId.length > 0 &&
		variety.trim().length > 0 &&
		Number.parseInt(count, 10) > 0;

	return (
		<GradientBackground>
			<ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
				<View
					style={{
						flexDirection: "row",
						alignItems: "center",
						gap: 8,
						marginBottom: 8,
					}}
				>
					<Pressable onPress={() => router.back()}>
						<Ionicons name="arrow-back" size={24} color={colors.text} />
					</Pressable>
					<Text size="xxl" weight="bold">
						New Batch
					</Text>
				</View>

				<Card>
					<Field label="Setup">
						<View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
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
											paddingHorizontal: 12,
											paddingVertical: 8,
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

					<Field label="Initial Count (Sowed)">
						<Input
							keyboardType="numeric"
							value={count}
							onChangeText={setCount}
						/>
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

				<View style={{ gap: 8, marginTop: 20 }}>
					<Button
						label="Start Batch"
						isLoading={create.isPending}
						isDisabled={
							!valid || create.isPending || setups.isLoading || crops.isLoading
						}
						onPress={() => create.mutate()}
					/>
					<Button
						variant="ghost"
						label="Cancel"
						onPress={() => router.back()}
					/>
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
		<View style={{ gap: 6, marginBottom: 16 }}>
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

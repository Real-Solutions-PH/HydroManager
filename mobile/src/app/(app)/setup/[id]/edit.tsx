import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, View } from "react-native";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { GradientBackground } from "@/components/ui/gradient-background";
import { Input } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { colors, spacing, systemTypes } from "@/constants/theme";
import { useBack } from "@/hooks/use-back";
import { type SetupType, setupsApi } from "@/lib/hydro-api";

const TYPES: SetupType[] = ["DFT", "NFT", "DutchBucket", "Kratky", "SNAP"];

export default function EditSetupScreen() {
	const { id } = useLocalSearchParams<{ id: string }>();
	const setupId = id ?? "";
	const qc = useQueryClient();
	const goBack = useBack();

	const setup = useQuery({
		queryKey: ["setup", setupId],
		queryFn: () => setupsApi.get(setupId),
		enabled: !!setupId,
	});

	const [name, setName] = useState("");
	const [type, setType] = useState<SetupType>("DFT");
	const [slotCount, setSlotCount] = useState("0");
	const [location, setLocation] = useState("");
	const [notes, setNotes] = useState("");
	const [hydrated, setHydrated] = useState(false);

	useEffect(() => {
		if (!hydrated && setup.data) {
			setName(setup.data.name);
			setType(setup.data.type);
			setSlotCount(String(setup.data.slot_count));
			setLocation(setup.data.location_label ?? "");
			setNotes(setup.data.notes ?? "");
			setHydrated(true);
		}
	}, [setup.data, hydrated]);

	const update = useMutation({
		mutationFn: () => {
			const parsed = Number.parseInt(slotCount, 10) || 0;
			return setupsApi.update(setupId, {
				name: name.trim(),
				type,
				slot_count: parsed,
				location_label: location.trim() || null,
				notes: notes.trim() || null,
			});
		},
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ["setup", setupId] });
			qc.invalidateQueries({ queryKey: ["setups"] });
			router.back();
		},
		onError: (e: Error) => Alert.alert("Update failed", e.message),
	});

	const valid =
		name.trim().length > 0 && Number.parseInt(slotCount, 10) > 0;

	if (setup.isLoading || !hydrated)
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
						Edit Setup
					</Text>
				</View>

				<Card>
					<Field label="Name">
						<Input value={name} onChangeText={setName} />
					</Field>

					<Field label="Setup Type">
						<View
							style={{
								flexDirection: "row",
								flexWrap: "wrap",
								gap: spacing.xs,
							}}
						>
							{TYPES.map((tv) => {
								const active = type === tv;
								const c = systemTypes[tv];
								return (
									<Pressable
										key={tv}
										onPress={() => setType(tv)}
										style={{
											flexDirection: "row",
											alignItems: "center",
											gap: 6,
											paddingHorizontal: spacing.sm,
											paddingVertical: spacing.xs,
											borderRadius: 999,
											borderWidth: active ? 2 : 1,
											borderColor: active ? c.color : colors.border,
											backgroundColor: active ? c.bg : "transparent",
										}}
									>
										<Ionicons
											name={c.icon as never}
											size={16}
											color={active ? c.color : colors.textMuted}
										/>
										<Text
											size="sm"
											weight="semibold"
											style={{ color: active ? c.color : colors.text }}
										>
											{tv}
										</Text>
									</Pressable>
								);
							})}
						</View>
					</Field>

					<Field label="Slot Count">
						<Input
							keyboardType="numeric"
							value={slotCount}
							onChangeText={setSlotCount}
						/>
						<Text size="xs" tone="muted" style={{ marginTop: 4 }}>
							Shrinking only allowed if trailing slots empty.
						</Text>
					</Field>

					<Field label="Location">
						<Input value={location} onChangeText={setLocation} />
					</Field>

					<Field label="Notes">
						<Input
							value={notes}
							onChangeText={setNotes}
							multiline
							placeholder="Optional"
						/>
					</Field>
				</Card>

				<View style={{ gap: spacing.xs, marginTop: spacing.lg }}>
					<Button
						label="Save Changes"
						isLoading={update.isPending}
						isDisabled={!valid || update.isPending}
						onPress={() => update.mutate()}
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

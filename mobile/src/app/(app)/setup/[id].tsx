import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, router, useLocalSearchParams } from "expo-router";
import { Alert, Pressable, ScrollView, View } from "react-native";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { GradientBackground } from "@/components/ui/gradient-background";
import { Text } from "@/components/ui/text";
import { colors, systemTypes } from "@/constants/theme";
import { batchesApi, setupsApi } from "@/lib/hydro-api";

export default function SetupDetailScreen() {
	const { id } = useLocalSearchParams<{ id: string }>();
	const setupId = id ?? "";
	const qc = useQueryClient();

	const setup = useQuery({
		queryKey: ["setup", setupId],
		queryFn: () => setupsApi.get(setupId),
		enabled: !!setupId,
	});
	const batches = useQuery({
		queryKey: ["batches", { setup_id: setupId }],
		queryFn: () => batchesApi.list({ setup_id: setupId }),
		enabled: !!setupId,
	});

	const archive = useMutation({
		mutationFn: () => setupsApi.archive(setupId),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ["setups"] });
			router.back();
		},
	});
	const del = useMutation({
		mutationFn: () => setupsApi.delete(setupId),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ["setups"] });
			router.back();
		},
	});

	if (setup.isLoading)
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
	if (!setup.data)
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

	const s = setup.data;
	const c = systemTypes[s.type];
	const filled = s.slots.filter((x) => x.status !== "empty").length;
	const util = s.slot_count > 0 ? (filled / s.slot_count) * 100 : 0;

	return (
		<GradientBackground>
			<ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
				<View
					style={{
						flexDirection: "row",
						alignItems: "center",
						gap: 8,
						marginBottom: 12,
					}}
				>
					<Pressable onPress={() => router.back()}>
						<Ionicons name="arrow-back" size={24} color={colors.text} />
					</Pressable>
					<View style={{ flex: 1 }}>
						<Text size="xxl" weight="bold">
							{s.name}
						</Text>
						<Text size="xs" tone="muted">
							{s.location_label ?? "No location"}
						</Text>
					</View>
					<Badge label={s.type} color={c.color} bg={c.bg} />
				</View>

				<Card>
					<Text
						size="xs"
						weight="semibold"
						tone="muted"
						style={{ textTransform: "uppercase", letterSpacing: 0.5 }}
					>
						Utilization
					</Text>
					<View
						style={{
							flexDirection: "row",
							alignItems: "center",
							justifyContent: "space-between",
							marginTop: 8,
						}}
					>
						<Text size="xl" weight="bold">
							{filled}/{s.slot_count} slots
						</Text>
						<Text tone="muted">{util.toFixed(0)}%</Text>
					</View>
					<View
						style={{
							marginTop: 8,
							height: 8,
							backgroundColor: colors.glass,
							borderRadius: 999,
							overflow: "hidden",
						}}
					>
						<View
							style={{
								width: `${util}%`,
								height: 8,
								backgroundColor: c.color,
								borderRadius: 999,
							}}
						/>
					</View>
				</Card>

				<View style={{ marginTop: 20 }}>
					<View
						style={{
							flexDirection: "row",
							justifyContent: "space-between",
							alignItems: "center",
							marginBottom: 8,
							paddingHorizontal: 4,
						}}
					>
						<Text size="lg" weight="bold">
							Batches
						</Text>
						<Link href={`/batch/new?setup=${s.id}`} asChild>
							<Pressable
								style={{
									flexDirection: "row",
									alignItems: "center",
									gap: 4,
									backgroundColor: colors.buttonSolidBg,
									paddingHorizontal: 10,
									paddingVertical: 6,
									borderRadius: 12,
								}}
							>
								<Ionicons name="add" size={14} color="#FFFFFF" />
								<Text size="xs" weight="semibold">
									New
								</Text>
							</Pressable>
						</Link>
					</View>
					{(batches.data?.data ?? []).length === 0 ? (
						<Card variant="outlined">
							<Text tone="muted">No batches yet.</Text>
						</Card>
					) : (
						<View style={{ gap: 10 }}>
							{(batches.data?.data ?? []).map((b) => (
								<Link key={b.id} href={`/batch/${b.id}`} asChild>
									<Pressable>
										<Card>
											<Text weight="semibold">{b.variety_name}</Text>
											<Text size="xs" tone="muted">
												{b.initial_count} units · started{" "}
												{new Date(b.started_at).toLocaleDateString()}
											</Text>
										</Card>
									</Pressable>
								</Link>
							))}
						</View>
					)}
				</View>

				<View style={{ marginTop: 20, paddingHorizontal: 4 }}>
					<Text size="lg" weight="bold" style={{ marginBottom: 8 }}>
						Slots
					</Text>
					<View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
						{s.slots.slice(0, 60).map((slot) => {
							const empty = slot.status === "empty";
							return (
								<View
									key={slot.id}
									style={{
										minWidth: 52,
										paddingHorizontal: 6,
										paddingVertical: 6,
										borderRadius: 8,
										borderWidth: 1,
										borderColor: empty ? colors.border : c.color,
										backgroundColor: empty ? colors.glass : c.bg,
										alignItems: "center",
									}}
								>
									<Text
										size="xs"
										style={{
											color: empty ? colors.textMuted : c.color,
										}}
									>
										{slot.slot_code}
									</Text>
								</View>
							);
						})}
						{s.slots.length > 60 ? (
							<View
								style={{
									borderWidth: 1,
									borderColor: colors.border,
									borderRadius: 8,
									paddingHorizontal: 6,
									paddingVertical: 6,
									alignItems: "center",
									justifyContent: "center",
								}}
							>
								<Text size="xs" tone="muted">
									+{s.slots.length - 60}
								</Text>
							</View>
						) : null}
					</View>
				</View>

				<View
					style={{
						marginTop: 28,
						gap: 8,
						borderTopWidth: 1,
						borderTopColor: colors.borderLight,
						paddingTop: 20,
					}}
				>
					<Button
						variant="outline"
						label={archive.isPending ? "Archiving..." : "Archive Setup"}
						onPress={() =>
							Alert.alert("Archive", "Archive this setup?", [
								{ text: "Cancel", style: "cancel" },
								{ text: "Archive", onPress: () => archive.mutate() },
							])
						}
					/>
					<Button
						variant="danger"
						label={del.isPending ? "Deleting..." : "Delete Permanently"}
						onPress={() =>
							Alert.alert(
								"Delete",
								"Delete this setup and all its batches? Cannot be undone.",
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
					/>
				</View>
			</ScrollView>
		</GradientBackground>
	);
}

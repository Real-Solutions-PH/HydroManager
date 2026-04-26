import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, router, useLocalSearchParams } from "expo-router";
import { useMemo } from "react";
import { Alert, Pressable, ScrollView, View } from "react-native";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { GradientBackground } from "@/components/ui/gradient-background";
import { Text } from "@/components/ui/text";
import { colors, spacing, systemTypes } from "@/constants/theme";
import { useBack } from "@/hooks/use-back";
import { type Batch, batchesApi, setupsApi } from "@/lib/hydro-api";

const BATCH_PALETTE = [
	"#34D399",
	"#60A5FA",
	"#F472B6",
	"#FBBF24",
	"#A78BFA",
	"#F87171",
	"#22D3EE",
	"#FB923C",
];

export default function SetupDetailScreen() {
	const { id } = useLocalSearchParams<{ id: string }>();
	const setupId = id ?? "";
	const qc = useQueryClient();
	const goBack = useBack();

	const setup = useQuery({
		queryKey: ["setup", setupId],
		queryFn: () => setupsApi.get(setupId),
		enabled: !!setupId,
	});
	const batches = useQuery({
		queryKey: ["batches", { setup_id: setupId, all: true }],
		queryFn: () =>
			batchesApi.list({ setup_id: setupId, include_archived: true }),
		enabled: !!setupId,
	});

	const archive = useMutation({
		mutationFn: () => setupsApi.archive(setupId),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ["setups"] });
			qc.invalidateQueries({ queryKey: ["setup", setupId] });
		},
	});
	const del = useMutation({
		mutationFn: () => setupsApi.delete(setupId),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ["setups"] });
			router.back();
		},
		onError: (e: Error) => Alert.alert("Delete failed", e.message),
	});

	const batchColor = useMemo(() => {
		const map = new Map<string, string>();
		const list = batches.data?.data ?? [];
		const active = list.filter((b) => !b.archived_at && !b.legacy);
		active.forEach((b, i) =>
			map.set(b.id, BATCH_PALETTE[i % BATCH_PALETTE.length]),
		);
		return map;
	}, [batches.data]);

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

	const allBatches = batches.data?.data ?? [];
	const activeBatches = allBatches.filter((b) => !b.archived_at && !b.legacy);
	const historyBatches = allBatches.filter((b) => b.archived_at || b.legacy);

	const archived = !!s.archived_at;
	const dangerColor = (colors as Record<string, string>).danger ?? "#EF4444";

	function confirmArchive() {
		Alert.alert("Archive", "Archive this setup?", [
			{ text: "Cancel", style: "cancel" },
			{ text: "Archive", onPress: () => archive.mutate() },
		]);
	}
	function confirmDelete() {
		if (!archived) {
			Alert.alert(
				"Archive first",
				"You must archive the setup before deleting it.",
			);
			return;
		}
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
		);
	}

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
						marginBottom: spacing.sm,
					}}
				>
					<Pressable onPress={goBack}>
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
					<Link href={`/setup/${s.id}/edit`} asChild>
						<Pressable
							hitSlop={8}
							style={{
								width: 36,
								height: 36,
								borderRadius: 12,
								borderWidth: 1,
								borderColor: colors.border,
								alignItems: "center",
								justifyContent: "center",
							}}
						>
							<Ionicons name="create-outline" size={18} color={colors.text} />
						</Pressable>
					</Link>
					<Pressable
						hitSlop={8}
						onPress={confirmArchive}
						disabled={archived || archive.isPending}
						style={{
							width: 36,
							height: 36,
							borderRadius: 12,
							borderWidth: 1,
							borderColor: colors.border,
							alignItems: "center",
							justifyContent: "center",
							opacity: archived ? 0.4 : 1,
						}}
					>
						<Ionicons name="archive-outline" size={18} color={colors.text} />
					</Pressable>
					<Pressable
						hitSlop={8}
						onPress={confirmDelete}
						disabled={!archived || del.isPending}
						style={{
							width: 36,
							height: 36,
							borderRadius: 12,
							borderWidth: 1,
							borderColor: archived ? dangerColor : colors.border,
							alignItems: "center",
							justifyContent: "center",
							opacity: archived ? 1 : 0.4,
						}}
					>
						<Ionicons
							name="trash-outline"
							size={18}
							color={archived ? dangerColor : colors.textMuted}
						/>
					</Pressable>
				</View>

				<View
					style={{
						flexDirection: "row",
						gap: spacing.xs,
						marginBottom: spacing.sm,
						flexWrap: "wrap",
					}}
				>
					<Badge label={s.type} color={c.color} bg={c.bg} />
					{archived ? (
						<Badge
							label="Archived"
							color={colors.textMuted}
							bg={colors.glass}
						/>
					) : null}
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
							marginTop: spacing.xs,
						}}
					>
						<Text size="xl" weight="bold">
							{filled}/{s.slot_count} slots
						</Text>
						<Text tone="muted">{util.toFixed(0)}%</Text>
					</View>
					<View
						style={{
							marginTop: spacing.xs,
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

				{s.notes ? (
					<View style={{ marginTop: spacing.md }}>
						<Card>
							<Text
								size="xs"
								weight="semibold"
								tone="muted"
								style={{ textTransform: "uppercase", letterSpacing: 0.5 }}
							>
								Notes
							</Text>
							<Text style={{ marginTop: spacing.xs }}>{s.notes}</Text>
						</Card>
					</View>
				) : null}

				<View style={{ marginTop: spacing.lg }}>
					<View
						style={{
							flexDirection: "row",
							justifyContent: "space-between",
							alignItems: "center",
							marginBottom: spacing.xs,
							paddingHorizontal: spacing.xxs,
						}}
					>
						<Text size="lg" weight="bold">
							Active Batches
						</Text>
						{!archived ? (
							<Link href={`/batch/new?setup=${s.id}`} asChild>
								<Pressable
									style={{
										flexDirection: "row",
										alignItems: "center",
										gap: spacing.xxs,
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
						) : null}
					</View>
					{activeBatches.length === 0 ? (
						<Card variant="outlined">
							<Text tone="muted">No active batches.</Text>
						</Card>
					) : (
						<View style={{ gap: 10 }}>
							{activeBatches.map((b) => (
								<BatchRow
									key={b.id}
									batch={b}
									dotColor={batchColor.get(b.id)}
								/>
							))}
						</View>
					)}
				</View>

				{historyBatches.length > 0 ? (
					<View style={{ marginTop: spacing.lg }}>
						<Text
							size="lg"
							weight="bold"
							style={{ marginBottom: spacing.xs, paddingHorizontal: spacing.xxs }}
						>
							History
						</Text>
						<View style={{ gap: 10 }}>
							{historyBatches.map((b) => (
								<BatchRow key={b.id} batch={b} legacy />
							))}
						</View>
					</View>
				) : null}

				<View style={{ marginTop: spacing.lg, paddingHorizontal: spacing.xxs }}>
					<Text size="lg" weight="bold" style={{ marginBottom: spacing.xs }}>
						Slots
					</Text>
					<View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
						{s.slots.slice(0, 60).map((slot) => {
							const empty = slot.status === "empty";
							const tint = slot.batch_id
								? batchColor.get(slot.batch_id)
								: undefined;
							const borderColor = tint ?? (empty ? colors.border : c.color);
							const bg = tint ? `${tint}33` : empty ? colors.glass : c.bg;
							const fg = tint ?? (empty ? colors.textMuted : c.color);
							return (
								<View
									key={slot.id}
									style={{
										minWidth: 52,
										paddingHorizontal: 6,
										paddingVertical: 6,
										borderRadius: 8,
										borderWidth: 1,
										borderColor,
										backgroundColor: bg,
										alignItems: "center",
									}}
								>
									<Text size="xs" style={{ color: fg }}>
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
			</ScrollView>
		</GradientBackground>
	);
}

function BatchRow({
	batch,
	dotColor,
	legacy,
}: {
	batch: Batch;
	dotColor?: string;
	legacy?: boolean;
}) {
	return (
		<Link href={`/batch/${batch.id}`} asChild>
			<Pressable>
				<Card>
					<View
						style={{
							flexDirection: "row",
							alignItems: "center",
							gap: spacing.xs,
						}}
					>
						{dotColor ? (
							<View
								style={{
									width: 10,
									height: 10,
									borderRadius: 5,
									backgroundColor: dotColor,
								}}
							/>
						) : null}
						<View style={{ flex: 1 }}>
							<Text weight="semibold">{batch.variety_name}</Text>
							<Text size="xs" tone="muted">
								{batch.slots_used && batch.seeds_per_slot
									? `${batch.slots_used} slots × ${batch.seeds_per_slot} seeds · `
									: ""}
								{batch.initial_count} units · started{" "}
								{new Date(batch.started_at).toLocaleDateString()}
							</Text>
						</View>
						{legacy && batch.legacy ? (
							<Badge
								label="Legacy"
								color={colors.textMuted}
								bg={colors.glass}
								small
							/>
						) : null}
						{batch.archived_at ? (
							<Badge
								label="Archived"
								color={colors.textMuted}
								bg={colors.glass}
								small
							/>
						) : null}
					</View>
				</Card>
			</Pressable>
		</Link>
	);
}

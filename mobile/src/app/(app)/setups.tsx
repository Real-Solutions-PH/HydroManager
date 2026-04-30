import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { Link } from "expo-router";
import { useMemo, useState } from "react";
import { FlatList, Image, Pressable, View } from "react-native";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { GradientBackground } from "@/components/ui/gradient-background";
import { Text } from "@/components/ui/text";
import { colors, spacing, systemTypes } from "@/constants/theme";
import { batchesApi, type Setup, setupsApi } from "@/lib/hydro-api";

const FILTERS = ["All", "Active", "Archived"] as const;
type Filter = (typeof FILTERS)[number];

const SETUP_LABEL: Record<Setup["type"], string> = {
	NFT: "NFT",
	DFT: "DFT",
	DutchBucket: "Dutch Bucket",
	Kratky: "Kratky",
	SNAP: "SNAP",
};

export default function SetupsScreen() {
	const [filter, setFilter] = useState<Filter>("All");

	const setupsQ = useQuery({
		queryKey: ["setups", "all-with-archived"],
		queryFn: () => setupsApi.list(true),
	});
	const batchesQ = useQuery({
		queryKey: ["batches", "all"],
		queryFn: () => batchesApi.list({ include_archived: false }),
	});

	const all = setupsQ.data?.data ?? [];
	const batches = batchesQ.data?.data ?? [];

	const bySetup = useMemo(() => {
		const m = new Map<string, { used: number; varieties: Set<string> }>();
		for (const b of batches) {
			if (b.archived_at || b.legacy) continue;
			const cur = m.get(b.setup_id) ?? { used: 0, varieties: new Set() };
			cur.used += b.slots_used ?? 0;
			cur.varieties.add(b.variety_name);
			m.set(b.setup_id, cur);
		}
		return m;
	}, [batches]);

	const totals = useMemo(() => {
		const active = all.filter((s) => !s.archived_at);
		const totalSlots = active.reduce((a, s) => a + s.slot_count, 0);
		const usedSlots = active.reduce(
			(a, s) => a + (bySetup.get(s.id)?.used ?? 0),
			0,
		);
		const util = totalSlots > 0 ? (usedSlots / totalSlots) * 100 : 0;
		return { count: active.length, totalSlots, util };
	}, [all, bySetup]);

	const rows = all.filter((s) =>
		filter === "Active"
			? !s.archived_at
			: filter === "Archived"
				? !!s.archived_at
				: true,
	);

	return (
		<GradientBackground>
			<View
				style={{
					flexDirection: "row",
					alignItems: "center",
					justifyContent: "space-between",
					paddingHorizontal: spacing.md,
					paddingTop: spacing.xs,
				}}
			>
				<Text size="xxl" weight="bold">
					My Setups
				</Text>
				<Link href="/setup/new" asChild>
					<Button
						size="sm"
						label="Add"
						leftIcon={<Ionicons name="add" size={18} color="#FFFFFF" />}
						style={{ borderRadius: 999, flexShrink: 0 }}
					/>
				</Link>
			</View>

			<View style={{ paddingHorizontal: spacing.md, paddingTop: spacing.md }}>
				<View
					style={{
						flexDirection: "row",
						borderRadius: 16,
						borderWidth: 1,
						borderColor: colors.border,
						backgroundColor: colors.surfaceVariant,
						paddingVertical: spacing.md,
					}}
				>
					<TotalCell value={String(totals.count)} label="Total Setups" />
					<Divider />
					<TotalCell value={String(totals.totalSlots)} label="Total Slots" />
					<Divider />
					<TotalCell value={`${totals.util.toFixed(0)}%`} label="Utilization" />
				</View>
			</View>

			<View
				style={{
					flexDirection: "row",
					gap: spacing.xs,
					paddingHorizontal: spacing.md,
					paddingTop: spacing.md,
					paddingBottom: spacing.xxs,
				}}
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

			<FlatList
				data={rows}
				keyExtractor={(s) => s.id}
				refreshing={setupsQ.isRefetching || batchesQ.isRefetching}
				onRefresh={() => {
					setupsQ.refetch();
					batchesQ.refetch();
				}}
				contentContainerStyle={{
					padding: spacing.md,
					paddingBottom: spacing.xxxl,
					gap: spacing.md,
				}}
				ListEmptyComponent={
					setupsQ.isLoading ? (
						<Text tone="muted">Loading setups...</Text>
					) : (
						<View
							style={{ alignItems: "center", paddingVertical: spacing.jumbo }}
						>
							<Ionicons
								name="grid-outline"
								size={48}
								color={colors.textMuted}
							/>
							<Text tone="muted" style={{ marginTop: spacing.sm }}>
								No setups yet. Tap "+ Add".
							</Text>
						</View>
					)
				}
				renderItem={({ item }) => {
					const stats = bySetup.get(item.id);
					return (
						<SetupCard
							setup={item}
							used={stats?.used ?? 0}
							varieties={Array.from(stats?.varieties ?? [])}
						/>
					);
				}}
			/>
		</GradientBackground>
	);
}

function TotalCell({ value, label }: { value: string; label: string }) {
	return (
		<View style={{ flex: 1, alignItems: "center" }}>
			<Text size="xxl" weight="bold">
				{value}
			</Text>
			<Text size="xs" tone="muted" style={{ marginTop: 2 }}>
				{label}
			</Text>
		</View>
	);
}

function Divider() {
	return (
		<View
			style={{ width: 1, backgroundColor: colors.border, marginVertical: 4 }}
		/>
	);
}

function SetupCard({
	setup,
	used,
	varieties,
}: {
	setup: Setup;
	used: number;
	varieties: string[];
}) {
	const c = systemTypes[setup.type];
	const pct = setup.slot_count > 0 ? (used / setup.slot_count) * 100 : 0;
	const archived = !!setup.archived_at;

	return (
		<Link href={`/setup/${setup.id}`} asChild>
			<Pressable>
				<Card>
					<View
						style={{
							flexDirection: "row",
							alignItems: "flex-start",
							gap: spacing.sm,
						}}
					>
						{setup.primary_photo_url ? (
							<Image
								source={{ uri: setup.primary_photo_url }}
								style={{
									width: 44,
									height: 44,
									borderRadius: 12,
									backgroundColor: c.bg,
								}}
							/>
						) : (
							<View
								style={{
									width: 44,
									height: 44,
									borderRadius: 12,
									backgroundColor: c.bg,
									alignItems: "center",
									justifyContent: "center",
								}}
							>
								<Ionicons name={c.icon as never} size={22} color={c.color} />
							</View>
						)}
						<View style={{ flex: 1 }}>
							<View
								style={{
									flexDirection: "row",
									alignItems: "center",
									justifyContent: "space-between",
								}}
							>
								<Text
									size="lg"
									weight="bold"
									numberOfLines={1}
									style={{ flex: 1 }}
								>
									{setup.name}
								</Text>
								<Ionicons
									name="chevron-forward"
									size={18}
									color={colors.textMuted}
								/>
							</View>
							<View
								style={{ flexDirection: "row", gap: spacing.xxs, marginTop: 4 }}
							>
								<View
									style={{
										paddingHorizontal: 10,
										paddingVertical: 3,
										borderRadius: 999,
										backgroundColor: c.bg,
									}}
								>
									<Text size="xs" weight="semibold" style={{ color: c.color }}>
										{SETUP_LABEL[setup.type]}
									</Text>
								</View>
								{archived ? (
									<View
										style={{
											paddingHorizontal: 10,
											paddingVertical: 3,
											borderRadius: 999,
											backgroundColor: colors.glass,
										}}
									>
										<Text size="xs" weight="semibold" tone="muted">
											Archived
										</Text>
									</View>
								) : null}
							</View>
						</View>
					</View>

					<View
						style={{
							flexDirection: "row",
							gap: spacing.md,
							marginTop: spacing.sm,
							paddingHorizontal: spacing.sm,
							paddingVertical: spacing.xs,
							borderRadius: 12,
							borderWidth: 1,
							borderColor: colors.border,
							backgroundColor: colors.cardGlassOverlay,
						}}
					>
						<MetaItem
							icon="layers-outline"
							label={`${setup.slot_count} slots`}
						/>
						<MetaItem
							icon="location-outline"
							label={setup.location_label ?? "No location"}
						/>
					</View>

					{varieties.length > 0 ? (
						<View
							style={{
								flexDirection: "row",
								flexWrap: "wrap",
								gap: spacing.xxs,
								marginTop: spacing.sm,
							}}
						>
							{varieties.slice(0, 4).map((v) => (
								<View
									key={v}
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
										{v}
									</Text>
								</View>
							))}
							{varieties.length > 4 ? (
								<View
									style={{
										paddingHorizontal: 10,
										paddingVertical: 4,
										borderRadius: 999,
										backgroundColor: colors.glass,
									}}
								>
									<Text size="xs" weight="semibold" tone="muted">
										+{varieties.length - 4}
									</Text>
								</View>
							) : null}
						</View>
					) : null}

					<View
						style={{
							flexDirection: "row",
							justifyContent: "space-between",
							alignItems: "center",
							marginTop: spacing.sm,
						}}
					>
						<Text size="sm" tone="muted">
							Slot utilization
						</Text>
						<Text size="sm" weight="semibold" style={{ color: c.color }}>
							{used}/{setup.slot_count} ({pct.toFixed(0)}%)
						</Text>
					</View>
					<View
						style={{
							marginTop: 6,
							height: 6,
							backgroundColor: colors.glass,
							borderRadius: 999,
							overflow: "hidden",
						}}
					>
						<View
							style={{
								width: `${Math.min(100, pct)}%`,
								height: 6,
								backgroundColor: c.color,
								borderRadius: 999,
							}}
						/>
					</View>

					{setup.installed_at ? (
						<Text size="xs" tone="muted" style={{ marginTop: spacing.sm }}>
							Installed{" "}
							{new Date(setup.installed_at).toLocaleDateString(undefined, {
								month: "short",
								day: "numeric",
								year: "numeric",
							})}
						</Text>
					) : null}
				</Card>
			</Pressable>
		</Link>
	);
}

function MetaItem({
	icon,
	label,
}: {
	icon: React.ComponentProps<typeof Ionicons>["name"];
	label: string;
}) {
	return (
		<View
			style={{
				flexDirection: "row",
				alignItems: "center",
				gap: spacing.xxs,
				flex: 1,
			}}
		>
			<Ionicons name={icon} size={14} color={colors.textMuted} />
			<Text size="sm" tone="subtle" numberOfLines={1}>
				{label}
			</Text>
		</View>
	);
}

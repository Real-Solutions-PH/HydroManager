import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { Link } from "expo-router";
import { useState } from "react";
import { FlatList, Image, Pressable, View } from "react-native";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { GradientBackground } from "@/components/ui/gradient-background";
import { Text } from "@/components/ui/text";
import { colors, spacing, systemTypes } from "@/constants/theme";
import { setupsApi } from "@/lib/hydro-api";

const FILTERS = ["All", "Active", "Archived"] as const;
type Filter = (typeof FILTERS)[number];

export default function SetupsScreen() {
	const [filter, setFilter] = useState<Filter>("Active");
	const { data, isLoading, refetch, isRefetching } = useQuery({
		queryKey: ["setups", filter],
		queryFn: () => setupsApi.list(filter !== "Active"),
	});
	const rows = (data?.data ?? []).filter((s) =>
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
					Setups
				</Text>
				<Link href="/setup/new" asChild>
					<Pressable
						style={{
							flexDirection: "row",
							alignItems: "center",
							gap: spacing.xxs,
							backgroundColor: colors.buttonSolidBg,
							paddingHorizontal: spacing.sm,
							paddingVertical: spacing.xs,
							borderRadius: 12,
						}}
					>
						<Ionicons name="add" size={18} color="#FFFFFF" />
						<Text weight="semibold">New</Text>
					</Pressable>
				</Link>
			</View>

			<View
				style={{
					flexDirection: "row",
					gap: spacing.xs,
					paddingHorizontal: spacing.md,
					paddingTop: spacing.sm,
					paddingBottom: spacing.xxs,
				}}
			>
				{FILTERS.map((f) => (
					<Pressable
						key={f}
						onPress={() => setFilter(f)}
						style={{
							paddingHorizontal: 14,
							paddingVertical: 6,
							borderRadius: 999,
							borderWidth: 1,
							borderColor: filter === f ? colors.primaryLight : colors.border,
							backgroundColor:
								filter === f ? `${colors.primaryLight}26` : "transparent",
						}}
					>
						<Text
							size="sm"
							weight="semibold"
							style={{
								color: filter === f ? colors.primaryLight : colors.text,
							}}
						>
							{f}
						</Text>
					</Pressable>
				))}
			</View>

			<FlatList
				data={rows}
				keyExtractor={(s) => s.id}
				refreshing={isRefetching}
				onRefresh={refetch}
				contentContainerStyle={{ padding: spacing.md, gap: spacing.sm }}
				ListEmptyComponent={
					isLoading ? (
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
								No setups yet. Tap "+ New".
							</Text>
						</View>
					)
				}
				renderItem={({ item }) => {
					const c = systemTypes[item.type];
					return (
						<Link href={`/setup/${item.id}`} asChild>
							<Pressable>
								<Card>
									<View
										style={{
											flexDirection: "row",
											alignItems: "center",
											gap: spacing.sm,
										}}
									>
										{item.primary_photo_url ? (
											<Image
												source={{ uri: item.primary_photo_url }}
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
												<Ionicons
													name={c.icon as never}
													size={22}
													color={c.color}
												/>
											</View>
										)}
										<View style={{ flex: 1 }}>
											<Text size="lg" weight="semibold">
												{item.name}
											</Text>
											<Text size="xs" tone="muted">
												{item.location_label ?? "No location"}
											</Text>
										</View>
										<Badge label={item.type} color={c.color} bg={c.bg} small />
										<Ionicons
											name="chevron-forward"
											size={18}
											color={colors.textMuted}
										/>
									</View>
									<View
										style={{
											flexDirection: "row",
											gap: spacing.md,
											marginTop: spacing.sm,
										}}
									>
										<InlineStat
											icon="leaf"
											label={`${item.slot_count} slots`}
										/>
										{item.installed_at ? (
											<InlineStat
												icon="calendar"
												label={new Date(item.installed_at).toLocaleDateString()}
											/>
										) : null}
									</View>
								</Card>
							</Pressable>
						</Link>
					);
				}}
			/>
		</GradientBackground>
	);
}

function InlineStat({
	icon,
	label,
}: {
	icon: React.ComponentProps<typeof Ionicons>["name"];
	label: string;
}) {
	return (
		<View
			style={{ flexDirection: "row", alignItems: "center", gap: spacing.xxs }}
		>
			<Ionicons name={icon} size={14} color={colors.textMuted} />
			<Text size="sm" tone="muted">
				{label}
			</Text>
		</View>
	);
}

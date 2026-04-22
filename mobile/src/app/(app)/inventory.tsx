import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { Link } from "expo-router";
import { useState } from "react";
import { FlatList, Pressable, View } from "react-native";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { GradientBackground } from "@/components/ui/gradient-background";
import { SearchBar } from "@/components/ui/search-bar";
import { Text } from "@/components/ui/text";
import { colors, inventoryCategoryMeta, spacing } from "@/constants/theme";
import { type InventoryCategory, inventoryApi } from "@/lib/hydro-api";
import { capitalize } from "@/lib/utils";

const CATEGORIES: InventoryCategory[] = [
	"seeds",
	"media",
	"nutrients",
	"equipment",
	"packaging",
	"other",
];

export default function InventoryScreen() {
	const [query, setQuery] = useState("");
	const [category, setCategory] = useState<InventoryCategory | null>(null);
	const { data, isLoading, refetch, isRefetching } = useQuery({
		queryKey: ["inventory", category],
		queryFn: () => inventoryApi.list(category ?? undefined),
	});
	const items = (data?.data ?? []).filter((it) =>
		query ? it.name.toLowerCase().includes(query.toLowerCase()) : true,
	);

	return (
		<GradientBackground>
			<View
				style={{
					paddingHorizontal: spacing.md,
					paddingTop: spacing.xs,
					gap: spacing.sm,
				}}
			>
				<View
					style={{
						flexDirection: "row",
						justifyContent: "space-between",
						alignItems: "center",
					}}
				>
					<Text size="xxl" weight="bold">
						Inventory
					</Text>
					<Link href="/inventory-new" asChild>
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
				<SearchBar
					value={query}
					onChangeText={setQuery}
					placeholder="Search inventory"
				/>
				<View
					style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.xs }}
				>
					<Chip
						label="All"
						active={category === null}
						onPress={() => setCategory(null)}
					/>
					{CATEGORIES.map((c) => {
						const meta = inventoryCategoryMeta[c];
						return (
							<Chip
								key={c}
								label={capitalize(c)}
								active={category === c}
								accent={meta.color}
								onPress={() => setCategory(c)}
							/>
						);
					})}
				</View>
			</View>
			<FlatList
				data={items}
				keyExtractor={(it) => it.id}
				refreshing={isRefetching}
				onRefresh={refetch}
				contentContainerStyle={{ padding: spacing.md, gap: 10 }}
				ListEmptyComponent={
					isLoading ? (
						<Text tone="muted">Loading...</Text>
					) : (
						<View
							style={{ alignItems: "center", paddingVertical: spacing.jumbo }}
						>
							<Ionicons
								name="cube-outline"
								size={48}
								color={colors.textMuted}
							/>
							<Text tone="muted" style={{ marginTop: spacing.sm }}>
								No items. Tap "+ New".
							</Text>
						</View>
					)
				}
				renderItem={({ item }) => {
					const meta = inventoryCategoryMeta[item.category];
					const low = item.is_low_stock;
					return (
						<Card
							style={
								low ? { borderColor: colors.error, borderWidth: 1 } : undefined
							}
						>
							<View
								style={{
									flexDirection: "row",
									alignItems: "center",
									gap: spacing.sm,
								}}
							>
								<View
									style={{
										width: 44,
										height: 44,
										borderRadius: 12,
										backgroundColor: `${meta.color}26`,
										alignItems: "center",
										justifyContent: "center",
									}}
								>
									<Ionicons
										name={meta.icon as never}
										size={22}
										color={meta.color}
									/>
								</View>
								<View style={{ flex: 1 }}>
									<Text size="md" weight="semibold">
										{item.name}
									</Text>
									<View
										style={{
											flexDirection: "row",
											alignItems: "center",
											gap: spacing.xs,
											marginTop: 2,
										}}
									>
										<Badge label={item.category} color={meta.color} small />
										{low ? (
											<Badge label="LOW" color={colors.error} small />
										) : null}
									</View>
								</View>
								<View style={{ alignItems: "flex-end" }}>
									<Text
										size="xl"
										weight="bold"
										tone={low ? "error" : "default"}
									>
										{item.current_stock}
									</Text>
									<Text size="xs" tone="muted">
										{item.unit}
									</Text>
								</View>
							</View>
							<Text size="xs" tone="muted" style={{ marginTop: spacing.xs }}>
								Min {item.low_stock_threshold} {item.unit}
							</Text>
						</Card>
					);
				}}
			/>
		</GradientBackground>
	);
}

function Chip({
	label,
	active,
	accent,
	onPress,
}: {
	label: string;
	active: boolean;
	accent?: string;
	onPress: () => void;
}) {
	const c = accent ?? colors.primaryLight;
	return (
		<Pressable
			onPress={onPress}
			style={{
				paddingHorizontal: spacing.sm,
				paddingVertical: 6,
				borderRadius: 999,
				borderWidth: 1,
				borderColor: active ? c : colors.border,
				backgroundColor: active ? `${c}26` : "transparent",
			}}
		>
			<Text
				size="sm"
				weight="semibold"
				style={{ color: active ? c : colors.text }}
			>
				{label}
			</Text>
		</Pressable>
	);
}

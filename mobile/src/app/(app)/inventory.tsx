import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { Link, router } from "expo-router";
import { useState } from "react";
import { FlatList, Pressable, View } from "react-native";
import { InventoryMovementSheet } from "@/components/inventory/movement-sheet";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { GradientBackground } from "@/components/ui/gradient-background";
import { useTabBarClearance } from "@/components/ui/interactive-menu";
import { SearchBar } from "@/components/ui/search-bar";
import { Text } from "@/components/ui/text";
import {
	colors,
	expiryStatusMeta,
	inventoryCategoryMeta,
	produceStatusMeta,
	spacing,
} from "@/constants/theme";
import {
	type InventoryCategory,
	type InventoryItem,
	inventoryApi,
	type Produce,
	type ProduceStatus,
	produceApi,
} from "@/lib/hydro-api";
import { capitalize } from "@/lib/utils";

const CATEGORIES: InventoryCategory[] = [
	"seeds",
	"media",
	"nutrients",
	"equipment",
	"packaging",
	"other",
];

const PRODUCE_FILTERS: (ProduceStatus | "all")[] = [
	"all",
	"ready",
	"reserved",
	"sold",
];

type Tab = "materials" | "produce";

export default function InventoryScreen() {
	const [tab, setTab] = useState<Tab>("materials");
	const [query, setQuery] = useState("");
	const [category, setCategory] = useState<InventoryCategory | null>(null);
	const [nearExpiryOnly, setNearExpiryOnly] = useState(false);
	const [produceStatus, setProduceStatus] = useState<ProduceStatus | "all">(
		"all",
	);
	const [movementItem, setMovementItem] = useState<InventoryItem | null>(null);
	const tabBarClearance = useTabBarClearance();

	const inventory = useQuery({
		queryKey: ["inventory", category, nearExpiryOnly],
		queryFn: () =>
			inventoryApi.list({
				category: category ?? undefined,
				near_expiry: nearExpiryOnly,
			}),
		enabled: tab === "materials",
	});

	const produce = useQuery({
		queryKey: ["produce", produceStatus, nearExpiryOnly],
		queryFn: () =>
			produceApi.list({
				status: produceStatus,
				near_expiry: nearExpiryOnly,
			}),
		enabled: tab === "produce",
	});

	const items =
		tab === "materials"
			? (inventory.data?.data ?? []).filter((it) =>
					query ? it.name.toLowerCase().includes(query.toLowerCase()) : true,
				)
			: (produce.data?.data ?? []).filter((it) =>
					query ? it.name.toLowerCase().includes(query.toLowerCase()) : true,
				);

	const isLoading =
		tab === "materials" ? inventory.isLoading : produce.isLoading;
	const isRefetching =
		tab === "materials" ? inventory.isRefetching : produce.isRefetching;
	const refetch = tab === "materials" ? inventory.refetch : produce.refetch;

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
					<Link
						href={tab === "materials" ? "/inventory-new" : "/produce-new"}
						asChild
					>
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

				<SegmentedControl
					value={tab}
					onChange={(v) => {
						setTab(v);
						setQuery("");
						setNearExpiryOnly(false);
					}}
				/>

				<SearchBar
					value={query}
					onChangeText={setQuery}
					placeholder={
						tab === "materials" ? "Search materials" : "Search produce"
					}
				/>

				<View
					style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.xs }}
				>
					{tab === "materials" ? (
						<>
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
						</>
					) : (
						PRODUCE_FILTERS.map((s) => {
							const meta = s === "all" ? null : produceStatusMeta[s];
							return (
								<Chip
									key={s}
									label={s === "all" ? "All" : (meta?.label ?? capitalize(s))}
									active={produceStatus === s}
									accent={meta?.color}
									onPress={() => setProduceStatus(s)}
								/>
							);
						})
					)}
					<Chip
						label="Near expiry"
						active={nearExpiryOnly}
						accent={colors.warning}
						onPress={() => setNearExpiryOnly((v) => !v)}
					/>
				</View>
			</View>

			<FlatList
				data={items as (InventoryItem | Produce)[]}
				keyExtractor={(it) => it.id}
				refreshing={isRefetching}
				onRefresh={refetch}
				contentContainerStyle={{
					padding: spacing.md,
					paddingBottom: tabBarClearance,
					gap: 10,
				}}
				ListEmptyComponent={
					isLoading ? (
						<Text tone="muted">Loading...</Text>
					) : (
						<View
							style={{ alignItems: "center", paddingVertical: spacing.jumbo }}
						>
							<Ionicons
								name={tab === "materials" ? "cube-outline" : "leaf-outline"}
								size={48}
								color={colors.textMuted}
							/>
							<Text tone="muted" style={{ marginTop: spacing.sm }}>
								{tab === "materials"
									? 'No items. Tap "+ New".'
									: 'No produce yet. Tap "+ New" after harvest.'}
							</Text>
						</View>
					)
				}
				renderItem={({ item }) =>
					tab === "materials" ? (
						<MaterialRow
							item={item as InventoryItem}
							onLongPress={() => setMovementItem(item as InventoryItem)}
						/>
					) : (
						<ProduceRow item={item as Produce} />
					)
				}
			/>

			<InventoryMovementSheet
				item={movementItem}
				onClose={() => setMovementItem(null)}
			/>
		</GradientBackground>
	);
}

function MaterialRow({
	item,
	onLongPress,
}: {
	item: InventoryItem;
	onLongPress: () => void;
}) {
	const meta = inventoryCategoryMeta[item.category];
	const low = item.is_low_stock;
	const expiry = item.expiry_status;
	const expired = expiry === "expired";
	const warn = expiry === "warning";
	const borderColor = expired
		? colors.error
		: warn
			? colors.warning
			: low
				? colors.error
				: undefined;

	return (
		<Card
			onPress={() => router.push(`/inventory/${item.id}`)}
			style={borderColor ? { borderColor, borderWidth: 1 } : undefined}
		>
			<Pressable onLongPress={onLongPress} delayLongPress={300}>
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
						<Ionicons name={meta.icon as never} size={22} color={meta.color} />
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
								flexWrap: "wrap",
							}}
						>
							<Badge label={item.category} color={meta.color} small />
							{low ? <Badge label="LOW" color={colors.error} small /> : null}
							<ExpiryPill
								status={item.expiry_status}
								days={item.days_until_expiry}
							/>
						</View>
					</View>
					<View style={{ alignItems: "flex-end" }}>
						<Text
							size="xl"
							weight="bold"
							tone={low || expired ? "error" : "default"}
						>
							{item.current_stock}
						</Text>
						<Text size="xs" tone="muted">
							{item.unit}
						</Text>
					</View>
				</View>
				<View
					style={{
						flexDirection: "row",
						alignItems: "center",
						justifyContent: "space-between",
						marginTop: spacing.xs,
						gap: spacing.xs,
					}}
				>
					<Text size="xs" tone="muted" style={{ flex: 1 }}>
						Min {item.low_stock_threshold} {item.unit} · long-press to record
						movement
					</Text>
					<Pressable
						onPress={(e) => {
							e.stopPropagation?.();
							router.push(`/inventory/${item.id}`);
						}}
						hitSlop={8}
						style={({ pressed }) => ({
							flexDirection: "row",
							alignItems: "center",
							gap: 4,
							paddingHorizontal: 10,
							paddingVertical: 6,
							borderRadius: 8,
							borderWidth: 1,
							borderColor: colors.border,
							backgroundColor: pressed ? colors.glassHover : "transparent",
						})}
					>
						<Ionicons name="create-outline" size={14} color={colors.text} />
						<Text size="xs" weight="semibold">
							Edit
						</Text>
					</Pressable>
				</View>
			</Pressable>
		</Card>
	);
}

function ProduceRow({ item }: { item: Produce }) {
	const meta = produceStatusMeta[item.status];
	const expired = item.expiry_status === "expired";
	const warn = item.expiry_status === "warning";
	const borderColor = expired
		? colors.error
		: warn
			? colors.warning
			: undefined;
	return (
		<Card
			onPress={() => router.push(`/produce/${item.id}`)}
			style={borderColor ? { borderColor, borderWidth: 1 } : undefined}
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
					<Ionicons name={meta.icon as never} size={22} color={meta.color} />
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
							flexWrap: "wrap",
						}}
					>
						<Badge label={meta.label} color={meta.color} small />
						<ExpiryPill
							status={item.expiry_status}
							days={item.days_until_expiry}
						/>
					</View>
				</View>
				<View style={{ alignItems: "flex-end" }}>
					<Text size="xl" weight="bold">
						{item.quantity}
					</Text>
					<Text size="xs" tone="muted">
						{item.unit}
					</Text>
				</View>
			</View>
			<Text size="xs" tone="muted" style={{ marginTop: spacing.xs }}>
				Harvested {new Date(item.harvested_at).toLocaleDateString()}
				{item.expiry_date
					? ` · Expires ${new Date(item.expiry_date).toLocaleDateString()}`
					: ""}
			</Text>
		</Card>
	);
}

export function ExpiryPill({
	status,
	days,
}: {
	status: "ok" | "warning" | "expired";
	days: number | null;
}) {
	if (status === "ok") return null;
	const meta = expiryStatusMeta[status];
	if (!meta) return null;
	const label =
		status === "expired"
			? "EXPIRED"
			: typeof days === "number"
				? `EXPIRES IN ${days}D`
				: "EXPIRES SOON";
	return <Badge label={label} color={meta.color} small />;
}

function SegmentedControl({
	value,
	onChange,
}: {
	value: Tab;
	onChange: (v: Tab) => void;
}) {
	const opts: { key: Tab; label: string; icon: string }[] = [
		{ key: "materials", label: "Materials", icon: "cube" },
		{ key: "produce", label: "Produce", icon: "leaf" },
	];
	return (
		<View
			style={{
				flexDirection: "row",
				backgroundColor: colors.surfaceVariant,
				borderRadius: 12,
				padding: 4,
				borderWidth: 1,
				borderColor: colors.border,
			}}
		>
			{opts.map((o) => {
				const active = value === o.key;
				return (
					<Pressable
						key={o.key}
						onPress={() => onChange(o.key)}
						style={{
							flex: 1,
							flexDirection: "row",
							alignItems: "center",
							justifyContent: "center",
							gap: 6,
							paddingVertical: 8,
							borderRadius: 8,
							backgroundColor: active ? colors.buttonSolidBg : "transparent",
						}}
					>
						<Ionicons
							name={o.icon as never}
							size={16}
							color={active ? "#FFFFFF" : colors.textMuted}
						/>
						<Text
							size="sm"
							weight="semibold"
							style={{ color: active ? "#FFFFFF" : colors.textMuted }}
						>
							{o.label}
						</Text>
					</Pressable>
				);
			})}
		</View>
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

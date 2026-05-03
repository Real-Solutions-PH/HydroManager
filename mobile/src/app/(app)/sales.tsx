import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "expo-router";
import { useMemo, useState } from "react";
import {
	Alert,
	Pressable,
	ScrollView,
	useWindowDimensions,
	View,
} from "react-native";
import Svg, { Circle, Defs, G, LinearGradient, Path, Stop } from "react-native-svg";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { GradientBackground } from "@/components/ui/gradient-background";
import { useTabBarClearance } from "@/components/ui/interactive-menu";
import { Text } from "@/components/ui/text";
import { colors, spacing } from "@/constants/theme";
import { useCustomToast } from "@/hooks/useCustomToast";
import {
	type InventoryCategory,
	inventoryApi,
	type Sale,
	type SaleChannel,
	salesApi,
	usersApi,
} from "@/lib/hydro-api";
import { useT } from "@/lib/i18n";
import { QK, STALE } from "@/lib/query-config";
import { formatPHP, handleError } from "@/lib/utils";

type Period = "month" | "90d" | "ytd";

const CROP_COLORS = [
	colors.primaryLight,
	colors.info,
	colors.warning,
	"#CE93D8",
	colors.textMuted,
];

const CATEGORY_META: Record<InventoryCategory, { label: string; color: string }> = {
	seeds: { label: "Seeds", color: colors.primaryLight },
	media: { label: "Media", color: colors.info },
	nutrients: { label: "Nutrients", color: colors.warning },
	equipment: { label: "Equipment", color: "#CE93D8" },
	packaging: { label: "Packaging", color: colors.success },
	other: { label: "Other", color: colors.textMuted },
};

const CHANNEL_META: Record<SaleChannel, { label: string; color: string }> = {
	market: { label: "Kadiwa", color: colors.primaryLight },
	direct: { label: "Direct", color: colors.info },
	resto: { label: "Restaurant", color: colors.warning },
	delivery: { label: "Online", color: "#CE93D8" },
	other: { label: "Other", color: colors.textMuted },
};

export default function SalesScreen() {
	const { t } = useT();
	const toast = useCustomToast();
	const qc = useQueryClient();
	const me = useQuery({
		queryKey: QK.me(),
		queryFn: () => usersApi.me(),
		staleTime: STALE.me,
	});
	const [period, setPeriod] = useState<Period>("month");
	const tabBarClearance = useTabBarClearance();

	const sales = useQuery({
		queryKey: QK.sales.list(),
		queryFn: () => salesApi.list(),
	});
	const dashboard = useQuery({
		queryKey: QK.sales.dashboard(),
		queryFn: () => salesApi.dashboard(),
		staleTime: STALE.salesDashboard,
	});
	const inventory = useQuery({
		queryKey: QK.inventory.list(),
		queryFn: () => inventoryApi.list(),
		staleTime: STALE.inventory,
	});

	const del = useMutation({
		mutationFn: (id: string) => salesApi.delete(id),
		onSuccess: () => {
			toast.success("Sale deleted");
			qc.invalidateQueries({ queryKey: QK.sales.all });
		},
		onError: (err) => toast.error(handleError(err)),
	});

	function confirmDelete(id: string, label: string) {
		Alert.alert(
			t("sales.delete_confirm_title"),
			t("sales.delete_confirm_body", { label }),
			[
				{ text: t("actions.cancel"), style: "cancel" },
				{
					text: t("actions.delete"),
					style: "destructive",
					onPress: () => del.mutate(id),
				},
			],
		);
	}

	const d = dashboard.data;
	const allSales = sales.data?.data ?? [];

	const periodSales = useMemo(
		() => filterSalesByPeriod(allSales, period),
		[allSales, period],
	);
	const trendPoints = useMemo(
		() => buildTrendSeries(periodSales, period),
		[periodSales, period],
	);
	const channelTotals = useMemo(() => {
		const list = (d?.channel_revenue ?? []).map((c) => ({
			channel: c.channel as SaleChannel,
			revenue: c.revenue,
		}));
		const total = list.reduce((s, c) => s + c.revenue, 0);
		return { list, total };
	}, [d]);

	const expenseByCategory = useMemo(() => {
		const items = inventory.data?.data ?? [];
		const totals = new Map<InventoryCategory, number>();
		for (const it of items) {
			const value = (it.unit_cost ?? 0) * it.current_stock;
			if (value <= 0) continue;
			totals.set(it.category, (totals.get(it.category) ?? 0) + value);
		}
		return Array.from(totals.entries())
			.map(([category, value]) => ({ category, value }))
			.sort((a, b) => b.value - a.value);
	}, [inventory.data]);

	if (!me.data)
		return (
			<GradientBackground>
				<View
					style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
				>
					<Text tone="muted">Loading...</Text>
				</View>
			</GradientBackground>
		);

	const gross =
		period === "month"
			? (d?.gross_current_month ?? 0)
			: period === "90d"
				? (d?.gross_last_90_days ?? 0)
				: (d?.gross_ytd ?? 0);
	const cogs =
		period === "month"
			? (d?.cogs_current_month ?? 0)
			: period === "90d"
				? (d?.cogs_last_90_days ?? 0)
				: (d?.cogs_ytd ?? 0);
	const net =
		period === "month"
			? (d?.net_current_month ?? 0)
			: period === "90d"
				? (d?.net_last_90_days ?? 0)
				: (d?.net_ytd ?? 0);
	const margin = gross > 0 ? (net / gross) * 100 : 0;

	const totalExpense = (inventory.data?.data ?? []).reduce(
		(s, it) => s + (it.unit_cost ?? 0) * it.current_stock,
		0,
	);

	const topCrops = d?.top_crops ?? [];
	const topCropsMax = topCrops.reduce((m, c) => Math.max(m, c.revenue), 0);

	const tierLabel =
		me.data.tier === "pro"
			? "Pro tier — Full analytics"
			: me.data.tier === "grower"
				? "Grower tier — Core analytics"
				: "Free tier — Basic analytics";

	return (
		<GradientBackground>
			<ScrollView
				contentContainerStyle={{
					paddingBottom: tabBarClearance,
					paddingHorizontal: spacing.md,
					gap: spacing.md,
				}}
			>
				<View
					style={{
						flexDirection: "row",
						justifyContent: "space-between",
						alignItems: "flex-start",
						paddingTop: spacing.xs,
					}}
				>
					<View style={{ flex: 1, paddingRight: spacing.sm }}>
						<Text size="xxl" weight="bold">
							Sales & COGS
						</Text>
						<Text size="sm" tone="muted" style={{ marginTop: 2 }}>
							{tierLabel}
						</Text>
					</View>
					<Link href="/sale-new" asChild>
						<Button
							size="sm"
							label="Record"
							leftIcon={
								<Ionicons name="add" size={18} color="#FFFFFF" />
							}
							style={{ borderRadius: 999, flexShrink: 0 }}
						/>
					</Link>
				</View>

				<PeriodChips value={period} onChange={setPeriod} />

				<View style={{ flexDirection: "row", gap: spacing.sm }}>
					<KpiCard
						label="GROSS SALES"
						value={formatPHP(gross, 0)}
						icon="trending-up"
						iconColor={colors.primaryLight}
					/>
					<KpiCard
						label="COGS"
						value={formatPHP(cogs, 0)}
						icon="trending-down"
						iconColor={colors.error}
						subtitle="Seeds + nutrients"
					/>
					<KpiCard
						label="NET"
						value={`${margin.toFixed(0)}%`}
						valueColor={colors.primaryLight}
						icon="cash-outline"
						iconColor={colors.primaryLight}
						subtitle={`${formatPHP(net, 0)} profit`}
					/>
				</View>

				<View style={{ flexDirection: "row", gap: spacing.sm }}>
					<KpiCard
						label="TOTAL EXPENSE"
						value={formatPHP(totalExpense, 0)}
						icon="cube-outline"
						iconColor={colors.warning}
						subtitle="Inventory on hand"
					/>
				</View>

				<Card>
					<Text size="lg" weight="bold">
						Expense by Category
					</Text>
					<Text size="sm" tone="muted" style={{ marginTop: 2 }}>
						Inventory cost composition
					</Text>
					<ExpensePieChart
						slices={expenseByCategory}
						total={totalExpense}
					/>
				</Card>

				<Card>
					<Text size="lg" weight="bold">
						Revenue Trend
					</Text>
					<Text size="sm" tone="muted" style={{ marginTop: 2 }}>
						{trendLabel(period)}
					</Text>
					<TrendChart points={trendPoints} />
				</Card>

				<View style={{ gap: spacing.sm }}>
					<Text size="lg" weight="bold">
						Top Crops by Revenue
					</Text>
					<Card>
						{topCrops.length === 0 ? (
							<Text tone="muted">No crop revenue yet.</Text>
						) : (
							topCrops
								.slice(0, 5)
								.map((c, idx) => (
									<CropRow
										key={c.crop}
										name={c.crop}
										revenue={c.revenue}
										max={topCropsMax}
										color={CROP_COLORS[idx] ?? colors.textMuted}
										isLast={idx === Math.min(topCrops.length, 5) - 1}
									/>
								))
						)}
					</Card>
				</View>

				{channelTotals.list.length > 0 ? (
					<View style={{ gap: spacing.sm }}>
						<Text size="lg" weight="bold">
							By Sales Channel
						</Text>
						<View
							style={{
								flexDirection: "row",
								flexWrap: "wrap",
								gap: spacing.sm,
							}}
						>
							{channelTotals.list.map((c) => (
								<ChannelCard
									key={c.channel}
									channel={c.channel}
									revenue={c.revenue}
									total={channelTotals.total}
								/>
							))}
						</View>
					</View>
				) : null}

				<View style={{ gap: spacing.sm }}>
					<View
						style={{
							flexDirection: "row",
							justifyContent: "space-between",
							alignItems: "center",
						}}
					>
						<Text size="lg" weight="bold">
							Recent Sales
						</Text>
						<Pressable
							onPress={() => toast.info("CSV export coming soon")}
							hitSlop={8}
						>
							<Text weight="semibold" style={{ color: colors.primaryLight }}>
								Export CSV
							</Text>
						</Pressable>
					</View>
					{allSales.length === 0 ? (
						<Text tone="muted">{t("sales.empty")}</Text>
					) : (
						allSales
							.slice(0, 8)
							.map((sale) => (
								<RecentSaleCard
									key={sale.id}
									sale={sale}
									onDelete={() =>
										confirmDelete(sale.id, sale.buyer_label ?? "unnamed buyer")
									}
									disabled={del.isPending}
								/>
							))
					)}
				</View>
			</ScrollView>
		</GradientBackground>
	);
}

function PeriodChips({
	value,
	onChange,
}: {
	value: Period;
	onChange: (p: Period) => void;
}) {
	const opts: { key: Period; label: string }[] = [
		{ key: "month", label: "Month" },
		{ key: "90d", label: "90 Days" },
		{ key: "ytd", label: "YTD" },
	];
	return (
		<View style={{ flexDirection: "row", gap: spacing.xs }}>
			{opts.map((o) => {
				const active = o.key === value;
				return (
					<Pressable
						key={o.key}
						onPress={() => onChange(o.key)}
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
							{o.label}
						</Text>
					</Pressable>
				);
			})}
		</View>
	);
}

function KpiCard({
	label,
	value,
	icon,
	iconColor,
	valueColor,
	subtitle,
}: {
	label: string;
	value: string;
	icon: React.ComponentProps<typeof Ionicons>["name"];
	iconColor: string;
	valueColor?: string;
	subtitle?: string;
}) {
	return (
		<View
			style={{
				flex: 1,
				padding: spacing.sm,
				borderRadius: 16,
				borderWidth: 1,
				borderColor: colors.border,
				backgroundColor: colors.surfaceVariant,
				gap: 6,
			}}
		>
			<View
				style={{ flexDirection: "row", alignItems: "center", gap: spacing.xxs }}
			>
				<Ionicons name={icon} size={14} color={iconColor} />
				<Text
					size="xs"
					tone="muted"
					weight="semibold"
					style={{ letterSpacing: 0.5 }}
				>
					{label}
				</Text>
			</View>
			<Text
				size="lg"
				weight="bold"
				style={valueColor ? { color: valueColor } : undefined}
				numberOfLines={1}
				adjustsFontSizeToFit
			>
				{value}
			</Text>
			{subtitle ? (
				<Text size="xs" tone="muted" numberOfLines={2}>
					{subtitle}
				</Text>
			) : null}
		</View>
	);
}

function CropRow({
	name,
	revenue,
	max,
	color,
	isLast,
}: {
	name: string;
	revenue: number;
	max: number;
	color: string;
	isLast: boolean;
}) {
	const pct = max > 0 ? Math.max(4, (revenue / max) * 100) : 0;
	return (
		<View style={{ marginBottom: isLast ? 0 : spacing.sm }}>
			<View
				style={{
					flexDirection: "row",
					justifyContent: "space-between",
					alignItems: "center",
					marginBottom: 6,
				}}
			>
				<View
					style={{
						flexDirection: "row",
						alignItems: "center",
						gap: spacing.xs,
					}}
				>
					<View
						style={{
							width: 8,
							height: 8,
							borderRadius: 4,
							backgroundColor: color,
						}}
					/>
					<Text>{name}</Text>
				</View>
				<Text weight="semibold">{formatPHP(revenue, 0)}</Text>
			</View>
			<View
				style={{
					height: 4,
					borderRadius: 2,
					backgroundColor: colors.surfaceVariant,
					overflow: "hidden",
				}}
			>
				<View
					style={{
						width: `${pct}%`,
						height: "100%",
						backgroundColor: color,
						borderRadius: 2,
					}}
				/>
			</View>
		</View>
	);
}

function ChannelCard({
	channel,
	revenue,
	total,
}: {
	channel: SaleChannel;
	revenue: number;
	total: number;
}) {
	const meta = CHANNEL_META[channel] ?? CHANNEL_META.other;
	const pct = total > 0 ? (revenue / total) * 100 : 0;
	return (
		<View
			style={{
				flexBasis: "48%",
				flexGrow: 1,
				padding: spacing.sm,
				borderRadius: 16,
				borderWidth: 1,
				borderColor: colors.border,
				backgroundColor: colors.surfaceVariant,
				gap: spacing.xs,
			}}
		>
			<View
				style={{
					flexDirection: "row",
					justifyContent: "space-between",
					alignItems: "center",
				}}
			>
				<View
					style={{
						paddingHorizontal: 10,
						paddingVertical: 3,
						borderRadius: 999,
						backgroundColor: `${meta.color}26`,
					}}
				>
					<Text size="xs" weight="semibold" style={{ color: meta.color }}>
						{meta.label}
					</Text>
				</View>
				<Text size="xs" tone="muted">
					{pct.toFixed(0)}%
				</Text>
			</View>
			<Text size="lg" weight="bold">
				{formatPHP(revenue, 0)}
			</Text>
			<View
				style={{
					height: 3,
					borderRadius: 2,
					backgroundColor: colors.cardGlassOverlay,
					overflow: "hidden",
				}}
			>
				<View
					style={{
						width: `${Math.max(4, pct)}%`,
						height: "100%",
						backgroundColor: meta.color,
					}}
				/>
			</View>
		</View>
	);
}

function RecentSaleCard({
	sale,
	onDelete,
	disabled,
}: {
	sale: Sale;
	onDelete: () => void;
	disabled: boolean;
}) {
	const meta = CHANNEL_META[sale.channel] ?? CHANNEL_META.other;
	const total = sale.items.reduce(
		(s, it) => s + it.quantity * it.unit_price,
		0,
	);
	const statusColor =
		sale.payment_status === "paid"
			? colors.success
			: sale.payment_status === "pending"
				? colors.warning
				: colors.error;
	const statusIcon =
		sale.payment_status === "paid"
			? "checkmark-circle-outline"
			: sale.payment_status === "pending"
				? "time-outline"
				: "close-circle-outline";

	return (
		<Card>
			<View
				style={{
					flexDirection: "row",
					justifyContent: "space-between",
					alignItems: "flex-start",
					gap: spacing.sm,
				}}
			>
				<View style={{ flex: 1, gap: spacing.xs }}>
					<Text size="lg" weight="bold">
						{sale.buyer_label ?? "unnamed buyer"}
					</Text>
					<View
						style={{
							alignSelf: "flex-start",
							paddingHorizontal: 10,
							paddingVertical: 3,
							borderRadius: 999,
							backgroundColor: `${meta.color}26`,
						}}
					>
						<Text size="xs" weight="semibold" style={{ color: meta.color }}>
							{meta.label}
						</Text>
					</View>
					<View
						style={{
							flexDirection: "row",
							flexWrap: "wrap",
							gap: spacing.xxs,
						}}
					>
						{sale.items.map((it) => (
							<View
								key={it.id}
								style={{
									paddingHorizontal: 10,
									paddingVertical: 4,
									borderRadius: 8,
									backgroundColor: colors.surfaceVariant,
									borderWidth: 1,
									borderColor: colors.border,
								}}
							>
								<Text size="xs" tone="subtle">
									{formatQty(it.quantity)} {it.unit} {it.crop_name}
								</Text>
							</View>
						))}
					</View>
					<Text size="xs" tone="muted">
						{new Date(sale.sold_at).toLocaleDateString(undefined, {
							month: "short",
							day: "numeric",
							year: "numeric",
						})}
					</Text>
				</View>
				<View style={{ alignItems: "flex-end", gap: spacing.xs }}>
					<Text size="lg" weight="bold">
						{formatPHP(total, 0)}
					</Text>
					<View
						style={{
							flexDirection: "row",
							alignItems: "center",
							gap: 4,
						}}
					>
						<Ionicons name={statusIcon} size={14} color={statusColor} />
						<Text size="xs" style={{ color: statusColor }}>
							{sale.payment_status}
						</Text>
					</View>
					<Pressable onPress={onDelete} hitSlop={10} disabled={disabled}>
						<Ionicons name="trash-outline" size={16} color={colors.textMuted} />
					</Pressable>
				</View>
			</View>
		</Card>
	);
}

function ExpensePieChart({
	slices,
	total,
}: {
	slices: { category: InventoryCategory; value: number }[];
	total: number;
}) {
	const size = 160;
	const radius = size / 2;
	const stroke = 28;
	const innerR = radius - stroke / 2;
	const cx = radius;
	const cy = radius;

	if (total <= 0 || slices.length === 0) {
		return (
			<View
				style={{
					height: size,
					alignItems: "center",
					justifyContent: "center",
					marginTop: spacing.sm,
				}}
			>
				<Text tone="muted" size="sm">
					No inventory expenses yet
				</Text>
			</View>
		);
	}

	let cumulative = 0;
	const arcs = slices.map((s) => {
		const fraction = s.value / total;
		const start = cumulative;
		cumulative += fraction;
		return { ...s, fraction, start, end: cumulative };
	});

	return (
		<View
			style={{
				flexDirection: "row",
				alignItems: "center",
				gap: spacing.md,
				marginTop: spacing.sm,
			}}
		>
			<Svg width={size} height={size}>
				<G rotation={-90} originX={cx} originY={cy}>
					{arcs.length === 1 ? (
						<Circle
							cx={cx}
							cy={cy}
							r={innerR}
							stroke={CATEGORY_META[arcs[0].category].color}
							strokeWidth={stroke}
							fill="none"
						/>
					) : (
						arcs.map((a) => {
							const meta = CATEGORY_META[a.category];
							const startAngle = a.start * 2 * Math.PI;
							const endAngle = a.end * 2 * Math.PI;
							const x1 = cx + innerR * Math.cos(startAngle);
							const y1 = cy + innerR * Math.sin(startAngle);
							const x2 = cx + innerR * Math.cos(endAngle);
							const y2 = cy + innerR * Math.sin(endAngle);
							const largeArc = a.fraction > 0.5 ? 1 : 0;
							const d = `M ${x1} ${y1} A ${innerR} ${innerR} 0 ${largeArc} 1 ${x2} ${y2}`;
							return (
								<Path
									key={a.category}
									d={d}
									stroke={meta.color}
									strokeWidth={stroke}
									fill="none"
								/>
							);
						})
					)}
				</G>
			</Svg>
			<View style={{ flex: 1, gap: spacing.xs }}>
				{arcs.map((a) => {
					const meta = CATEGORY_META[a.category];
					return (
						<View
							key={a.category}
							style={{
								flexDirection: "row",
								alignItems: "center",
								gap: spacing.xs,
							}}
						>
							<View
								style={{
									width: 10,
									height: 10,
									borderRadius: 5,
									backgroundColor: meta.color,
								}}
							/>
							<Text size="sm" style={{ flex: 1 }}>
								{meta.label}
							</Text>
							<Text size="sm" weight="semibold">
								{formatPHP(a.value, 0)}
							</Text>
							<Text size="xs" tone="muted" style={{ width: 36, textAlign: "right" }}>
								{(a.fraction * 100).toFixed(0)}%
							</Text>
						</View>
					);
				})}
			</View>
		</View>
	);
}

function TrendChart({ points }: { points: { x: string; y: number }[] }) {
	const { width: winW } = useWindowDimensions();
	const width = winW - spacing.md * 4;
	const height = 140;
	const padX = 4;
	const padTop = 8;
	const padBottom = 22;

	if (points.length === 0) {
		return (
			<View
				style={{
					height,
					alignItems: "center",
					justifyContent: "center",
				}}
			>
				<Text tone="muted" size="sm">
					No revenue in this period
				</Text>
			</View>
		);
	}

	const ys = points.map((p) => p.y);
	const max = Math.max(1, ...ys);
	const innerW = width - padX * 2;
	const innerH = height - padTop - padBottom;
	const stepX = points.length > 1 ? innerW / (points.length - 1) : 0;

	const coords = points.map((p, i) => ({
		x: padX + i * stepX,
		y: padTop + innerH - (p.y / max) * innerH,
	}));

	const linePath = coords.reduce((acc, c, i) => {
		if (i === 0) return `M ${c.x} ${c.y}`;
		const prev = coords[i - 1];
		const cx = (prev.x + c.x) / 2;
		return `${acc} C ${cx} ${prev.y} ${cx} ${c.y} ${c.x} ${c.y}`;
	}, "");
	const fillPath = `${linePath} L ${coords[coords.length - 1].x} ${
		padTop + innerH
	} L ${coords[0].x} ${padTop + innerH} Z`;

	const labelIndices = pickLabelIndices(points.length, 6);

	return (
		<View style={{ marginTop: spacing.sm }}>
			<Svg width={width} height={height}>
				<Defs>
					<LinearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
						<Stop
							offset="0"
							stopColor={colors.primaryLight}
							stopOpacity={0.4}
						/>
						<Stop offset="1" stopColor={colors.primaryLight} stopOpacity={0} />
					</LinearGradient>
				</Defs>
				<Path d={fillPath} fill="url(#trendFill)" />
				<Path
					d={linePath}
					stroke={colors.primaryLight}
					strokeWidth={2}
					fill="none"
				/>
			</Svg>
			<View
				style={{
					flexDirection: "row",
					justifyContent: "space-between",
					marginTop: -16,
					paddingHorizontal: padX,
				}}
			>
				{labelIndices.map((i) => (
					<Text key={i} size="xs" tone="muted">
						{points[i]?.x ?? ""}
					</Text>
				))}
			</View>
		</View>
	);
}

function pickLabelIndices(n: number, max: number): number[] {
	if (n <= max) return Array.from({ length: n }, (_, i) => i);
	const step = (n - 1) / (max - 1);
	return Array.from({ length: max }, (_, i) => Math.round(i * step));
}

function trendLabel(period: Period): string {
	const now = new Date();
	if (period === "month")
		return now.toLocaleDateString(undefined, {
			month: "long",
			year: "numeric",
		});
	if (period === "90d") return "Last 90 days";
	return `Year ${now.getFullYear()}`;
}

function filterSalesByPeriod(sales: Sale[], period: Period): Sale[] {
	const now = new Date();
	let start: Date;
	if (period === "month") {
		start = new Date(now.getFullYear(), now.getMonth(), 1);
	} else if (period === "90d") {
		start = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
	} else {
		start = new Date(now.getFullYear(), 0, 1);
	}
	return sales.filter((s) => new Date(s.sold_at) >= start);
}

function buildTrendSeries(
	sales: Sale[],
	period: Period,
): { x: string; y: number }[] {
	const now = new Date();
	let start: Date;
	let bucketDays: number;
	if (period === "month") {
		start = new Date(now.getFullYear(), now.getMonth(), 1);
		bucketDays = 1;
	} else if (period === "90d") {
		start = new Date(now.getTime() - 89 * 24 * 60 * 60 * 1000);
		bucketDays = 7;
	} else {
		start = new Date(now.getFullYear(), 0, 1);
		bucketDays = 30;
	}
	start.setHours(0, 0, 0, 0);
	const end = new Date(now);
	end.setHours(23, 59, 59, 999);

	const buckets: { date: Date; total: number }[] = [];
	for (
		let t = start.getTime();
		t <= end.getTime();
		t += bucketDays * 24 * 60 * 60 * 1000
	) {
		buckets.push({ date: new Date(t), total: 0 });
	}

	for (const sale of sales) {
		const d = new Date(sale.sold_at);
		if (d < start || d > end) continue;
		const idx = Math.min(
			buckets.length - 1,
			Math.floor((d.getTime() - start.getTime()) / (bucketDays * 86400000)),
		);
		const total = sale.items.reduce(
			(s, it) => s + it.quantity * it.unit_price,
			0,
		);
		buckets[idx].total += total;
	}

	return buckets.map((b) => ({
		x: b.date.toLocaleDateString(undefined, {
			month: "short",
			day: "numeric",
		}),
		y: b.total,
	}));
}

function formatQty(n: number): string {
	if (Number.isInteger(n)) return String(n);
	return n.toFixed(n < 1 ? 2 : 1);
}

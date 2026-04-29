import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { Link, router, type Href } from "expo-router";
import { Pressable, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AlertCard, type AlertSeverity } from "@/components/ui/alert-card";
import { Card } from "@/components/ui/card";
import { GradientBackground } from "@/components/ui/gradient-background";
import { ProgressRing } from "@/components/ui/progress-ring";
import { Text } from "@/components/ui/text";
import { colors, radii, spacing } from "@/constants/theme";
import {
	batchesApi,
	checklistApi,
	inventoryApi,
	setupsApi,
	usersApi,
} from "@/lib/hydro-api";
import { useT } from "@/lib/i18n";

// TODO: replace with real data once checklist completion tracking lands.
const TASKS_PROGRESS_MOCK = 0.67;
const TASKS_DONE_MOCK = 8;
const TASKS_TOTAL_MOCK = 12;

// TODO: source from crop guide (days_to_harvest_min/max) instead of a flat fallback.
const FALLBACK_DAYS_TO_HARVEST = 30;

interface ActivityItem {
	id: string;
	icon: React.ComponentProps<typeof Ionicons>["name"];
	iconBg: string;
	iconColor: string;
	title: string;
	timeAgo: string;
}

const ACTIVITY_MOCK: ActivityItem[] = [
	{
		id: "a1",
		icon: "checkmark-circle",
		iconBg: colors.successLight,
		iconColor: colors.primaryLight,
		title: "pH/EC logged for DFT-A",
		timeAgo: "2h ago",
	},
	{
		id: "a2",
		icon: "leaf",
		iconBg: colors.infoLight,
		iconColor: colors.info,
		title: "Pechay Batch A-001 → Vegetative",
		timeAgo: "5h ago",
	},
	{
		id: "a3",
		icon: "cube",
		iconBg: colors.warningLight,
		iconColor: colors.warning,
		title: "Rockwool cubes restocked (50 pcs)",
		timeAgo: "1d ago",
	},
	{
		id: "a4",
		icon: "trending-up",
		iconBg: colors.salesAccentLight,
		iconColor: colors.salesAccent,
		title: "Sale recorded — ₱480 Pechay",
		timeAgo: "2d ago",
	},
];

interface HomeAlert {
	id: string;
	severity: AlertSeverity;
	icon: React.ComponentProps<typeof Ionicons>["name"];
	title: string;
	subtitle: string;
	pillLabel?: string;
	chevron?: boolean;
	onPress?: () => void;
}

function getGreetingKey(hour: number): string {
	if (hour < 12) return "home.greeting_morning";
	if (hour < 18) return "home.greeting_afternoon";
	return "home.greeting_evening";
}

export default function HomeScreen() {
	const { t, locale } = useT();
	const insets = useSafeAreaInsets();

	const userQ = useQuery({ queryKey: ["me"], queryFn: () => usersApi.me() });
	const setupsQ = useQuery({
		queryKey: ["setups"],
		queryFn: () => setupsApi.list(),
	});
	const batchesQ = useQuery({
		queryKey: ["batches"],
		queryFn: () => batchesApi.list(),
	});
	const inventoryQ = useQuery({
		queryKey: ["inventory"],
		queryFn: () => inventoryApi.list(),
	});
	const checklistQ = useQuery({
		queryKey: ["checklist"],
		queryFn: () => checklistApi.list(),
	});

	const firstName =
		userQ.data?.full_name?.split(" ")[0] ?? t("home.default_name");
	const farmName = t("home.farm_label", { name: firstName });
	const greeting = t(getGreetingKey(new Date().getHours()));

	const lowStock = (inventoryQ.data?.data ?? []).filter((i) => i.is_low_stock);
	const harvestReady = (batchesQ.data?.data ?? []).filter(
		(b) =>
			Math.floor((Date.now() - new Date(b.started_at).getTime()) / 86400000) >=
			25,
	);
	const tasksPending = checklistQ.data?.count ?? 0;

	const dateLabel = new Date().toLocaleDateString(
		locale === "tl" ? "fil-PH" : "en-US",
		{ month: "long", day: "numeric", year: "numeric" },
	);

	const alerts: HomeAlert[] = [];
	// Mock pH out-of-range alert until readings API surfaces here
	alerts.push({
		id: "ph-mock",
		severity: "urgent",
		icon: "warning",
		title: "DFT-A pH Out of Range",
		subtitle: "Current: 7.2 — Target: 5.5–6.5",
		pillLabel: t("home.alert_severity_urgent"),
	});
	const firstLow = lowStock[0];
	if (firstLow) {
		alerts.push({
			id: `low-${firstLow.id}`,
			severity: "low",
			icon: "cube",
			title: t("home.alert_low_stock_title", { name: firstLow.name }),
			subtitle: t("home.alert_low_stock_subtitle", { stock: String(firstLow.current_stock), unit: firstLow.unit, min: String(firstLow.low_stock_threshold) }),
			pillLabel: t("home.alert_severity_low"),
		});
	}
	const firstReady = harvestReady[0];
	if (firstReady) {
		const days = Math.floor(
			(Date.now() - new Date(firstReady.started_at).getTime()) / 86400000,
		);
		alerts.push({
			id: `ready-${firstReady.id}`,
			severity: "info",
			icon: "time",
			title: t("home.alert_harvest_ready_title", { variety: firstReady.variety_name }),
			subtitle: t("home.alert_harvest_ready_subtitle", { day: String(days) }),
			chevron: true,
			onPress: () => router.push("/setups"),
		});
	}

	const upcomingHarvests = (batchesQ.data?.data ?? [])
		.map((b) => {
			const days = Math.floor(
				(Date.now() - new Date(b.started_at).getTime()) / 86400000,
			);
			const daysLeft = Math.max(0, FALLBACK_DAYS_TO_HARVEST - days);
			return { batch: b, daysLeft };
		})
		.sort((a, b) => a.daysLeft - b.daysLeft)
		.slice(0, 3);

	return (
		<GradientBackground>
			<ScrollView
				contentContainerStyle={{
					paddingBottom: insets.bottom + 128,
					gap: spacing.md,
				}}
				style={{ flex: 1 }}
			>
				{/* Header */}
				<View
					style={{
						flexDirection: "row",
						alignItems: "center",
						justifyContent: "space-between",
						paddingHorizontal: spacing.md,
						paddingTop: spacing.xs,
					}}
				>
					<View style={{ flex: 1 }}>
						<Text size="sm" tone="muted">
							{greeting}
						</Text>
						<Text size="xxl" weight="bold">
							{farmName}
						</Text>
					</View>
					<View style={{ flexDirection: "row", gap: spacing.xs }}>
						<Link href="/checklist" asChild>
							<Pressable
								accessibilityLabel={t("home.a11y_notifications")}
								accessibilityRole="button"
								style={{
									width: 44,
									height: 44,
									borderRadius: radii.md,
									backgroundColor: colors.glass,
									alignItems: "center",
									justifyContent: "center",
								}}
							>
								<Ionicons
									name="notifications-outline"
									size={20}
									color={colors.text}
								/>
								{alerts.length > 0 ? (
									<View
										style={{
											position: "absolute",
											top: 8,
											right: 10,
											width: 8,
											height: 8,
											borderRadius: 4,
											backgroundColor: colors.error,
										}}
									/>
								) : null}
							</Pressable>
						</Link>
						<Link href="/settings" asChild>
							<Pressable
								accessibilityLabel={t("home.a11y_profile")}
								accessibilityRole="button"
								style={{
									width: 44,
									height: 44,
									borderRadius: radii.md,
									backgroundColor: colors.primaryDark,
									alignItems: "center",
									justifyContent: "center",
								}}
							>
								<Text weight="bold">{firstName.charAt(0).toUpperCase()}</Text>
							</Pressable>
						</Link>
					</View>
				</View>

				{/* Daily Check-in */}
				<View style={{ paddingHorizontal: spacing.md }}>
					<Card>
						<View
							style={{
								flexDirection: "row",
								gap: spacing.sm,
								alignItems: "center",
							}}
						>
							<View
								style={{
									width: 64,
									height: 64,
									borderRadius: radii.lg,
									backgroundColor: colors.successLight,
									alignItems: "center",
									justifyContent: "center",
								}}
							>
								<Ionicons name="leaf" size={32} color={colors.primaryLight} />
							</View>
							<View style={{ flex: 1 }}>
								<Text weight="bold" size="md">
									{`"${t("home.checkin_quote")}"`}
								</Text>
								<Text size="sm" tone="muted">
									{t("home.checkin_summary", {
										tasks: String(tasksPending),
										harvests: String(harvestReady.length),
										low: String(lowStock.length),
									})}
								</Text>
							</View>
						</View>
					</Card>
				</View>

				{/* Today's Tasks */}
				<View style={{ paddingHorizontal: spacing.md }}>
					<Card>
						<View
							style={{
								flexDirection: "row",
								alignItems: "center",
								justifyContent: "space-between",
							}}
						>
							<View style={{ flex: 1 }}>
								<Text weight="bold" size="lg">
									{t("home.todays_tasks")}
								</Text>
								<Text size="sm" tone="muted">
									{dateLabel}
								</Text>
							</View>
							<ProgressRing
								size={64}
								strokeWidth={6}
								progress={TASKS_PROGRESS_MOCK}
								color={colors.primaryLight}
								accessibilityLabel="Today's tasks completion"
							>
								<Text size="sm" weight="bold">
									{`${Math.round(TASKS_PROGRESS_MOCK * 100)}%`}
								</Text>
							</ProgressRing>
						</View>
						<View
							style={{
								height: 6,
								borderRadius: radii.full,
								backgroundColor: colors.glass,
								marginTop: spacing.sm,
								overflow: "hidden",
							}}
						>
							<View
								style={{
									width: `${Math.round(TASKS_PROGRESS_MOCK * 100)}%`,
									height: "100%",
									backgroundColor: colors.primaryLight,
								}}
							/>
						</View>
						<Text size="sm" tone="muted" style={{ marginTop: spacing.xs }}>
							{t("home.tasks_done_count", {
								done: String(TASKS_DONE_MOCK),
								total: String(TASKS_TOTAL_MOCK),
							})}
						</Text>
					</Card>
				</View>

				{/* KPI Grid 2x2 */}
				<View
					style={{
						flexDirection: "row",
						flexWrap: "wrap",
						gap: spacing.sm,
						paddingHorizontal: spacing.md,
					}}
				>
					<KpiTile
						icon="grid"
						iconBg={colors.successLight}
						iconColor={colors.primaryLight}
						value={setupsQ.data?.count ?? 0}
						label={t("home.kpi_active_setups")}
					/>
					<KpiTile
						icon="leaf"
						iconBg={colors.infoLight}
						iconColor={colors.info}
						value={batchesQ.data?.count ?? 0}
						label={t("home.kpi_plant_batches")}
					/>
					<KpiTile
						icon="nutrition"
						iconBg={colors.successLight}
						iconColor={colors.primaryLight}
						value={harvestReady.length}
						label={t("home.kpi_near_harvest")}
					/>
					<KpiTile
						icon="alert-circle"
						iconBg={colors.errorLight}
						iconColor={colors.error}
						value={lowStock.length}
						label={t("home.kpi_low_stock")}
					/>
				</View>

				{/* Alerts */}
				{alerts.length > 0 ? (
					<View
						style={{
							paddingHorizontal: spacing.md,
							gap: spacing.sm,
						}}
					>
						<Text size="lg" weight="bold">
							{t("home.alerts")}
						</Text>
						{alerts.map((a) => (
							<AlertCard
								key={a.id}
								severity={a.severity}
								icon={a.icon}
								title={a.title}
								subtitle={a.subtitle}
								pillLabel={a.pillLabel}
								chevron={a.chevron}
								onPress={a.onPress}
							/>
						))}
					</View>
				) : null}

				{/* Upcoming Harvests */}
				{upcomingHarvests.length > 0 ? (
					<View style={{ gap: spacing.sm }}>
						<View
							style={{
								flexDirection: "row",
								alignItems: "center",
								justifyContent: "space-between",
								paddingHorizontal: spacing.md,
							}}
						>
							<Text size="lg" weight="bold">
								{t("home.upcoming_harvests")}
							</Text>
							<Link href="/setups" asChild>
								<Pressable accessibilityRole="link">
									<Text size="sm" tone="primary">
										{t("home.see_all")}
									</Text>
								</Pressable>
							</Link>
						</View>
						<ScrollView
							horizontal
							showsHorizontalScrollIndicator={false}
							contentContainerStyle={{
								paddingHorizontal: spacing.md,
								gap: spacing.sm,
							}}
						>
							{upcomingHarvests.map(({ batch, daysLeft }) => {
								const urgent = daysLeft < 7;
								return (
									<View
										key={batch.id}
										style={{
											width: 140,
											padding: spacing.sm,
											borderRadius: radii.lg,
											backgroundColor: colors.surfaceVariant,
											borderWidth: 1,
											borderColor: colors.border,
											alignItems: "center",
											gap: spacing.xs,
										}}
									>
										<View
											style={{
												width: 44,
												height: 44,
												borderRadius: radii.md,
												backgroundColor: colors.successLight,
												alignItems: "center",
												justifyContent: "center",
											}}
										>
											<Ionicons
												name="leaf"
												size={22}
												color={colors.primaryLight}
											/>
										</View>
										<Text weight="bold">{batch.variety_name}</Text>
										<Text size="xs" tone="muted">
											{t("home.plants_count", { n: String(batch.initial_count) })}
										</Text>
										<View
											style={{
												paddingHorizontal: spacing.sm,
												paddingVertical: 4,
												borderRadius: radii.full,
												backgroundColor: urgent
													? colors.errorLight
													: colors.successLight,
											}}
										>
											<Text
												size="xs"
												weight="bold"
												style={{
													color: urgent ? colors.error : colors.primaryLight,
												}}
											>
												{t("home.days_left", {
													n: String(daysLeft),
												})}
											</Text>
										</View>
									</View>
								);
							})}
						</ScrollView>
					</View>
				) : null}

				{/* Recent Activity */}
				<View
					style={{
						paddingHorizontal: spacing.md,
						gap: spacing.sm,
					}}
				>
					<Text size="lg" weight="bold">
						{t("home.recent_activity")}
					</Text>
					<Card>
						{ACTIVITY_MOCK.map((a, idx) => (
							<View
								key={a.id}
								style={{
									flexDirection: "row",
									alignItems: "center",
									gap: spacing.sm,
									paddingVertical: spacing.sm,
									borderBottomWidth: idx === ACTIVITY_MOCK.length - 1 ? 0 : 1,
									borderBottomColor: colors.borderLight,
								}}
							>
								<View
									style={{
										width: 36,
										height: 36,
										borderRadius: radii.md,
										backgroundColor: a.iconBg,
										alignItems: "center",
										justifyContent: "center",
									}}
								>
									<Ionicons name={a.icon} size={18} color={a.iconColor} />
								</View>
								<Text style={{ flex: 1 }}>{a.title}</Text>
								<Text size="xs" tone="muted">
									{a.timeAgo}
								</Text>
							</View>
						))}
					</Card>
				</View>

				{/* Quick Actions */}
				<View
					style={{
						paddingHorizontal: spacing.md,
						gap: spacing.sm,
					}}
				>
					<Text size="lg" weight="bold">
						{t("home.quick_actions")}
					</Text>
					<QuickActionsGrid
						items={[
							{
								icon: "add",
								iconBg: colors.successLight,
								iconColor: colors.primaryLight,
								label: t("home.qa_new_batch"),
								href: "/batch/new",
							},
							{
								icon: "water",
								iconBg: colors.infoLight,
								iconColor: colors.info,
								label: t("home.qa_log_reading"),
								href: "/checklist",
							},
							{
								icon: "book",
								iconBg: colors.warningLight,
								iconColor: colors.warning,
								label: t("home.qa_crop_guide"),
								href: "/library/crops",
							},
							{
								icon: "trending-up",
								iconBg: colors.salesAccentLight,
								iconColor: colors.salesAccent,
								label: t("home.qa_add_sale"),
								href: "/sale-new",
							},
							{
								icon: "cube",
								iconBg: colors.restockAccentLight,
								iconColor: colors.restockAccent,
								label: t("home.qa_restock"),
								href: "/inventory-new",
							},
							{
								icon: "flash",
								iconBg: colors.successLight,
								iconColor: colors.primaryLight,
								label: t("home.qa_tasks"),
								href: "/checklist",
							},
							{
								icon: "library",
								iconBg: colors.warningLight,
								iconColor: colors.warning,
								label: t("home.qa_library"),
								href: "/library",
							},
						]}
					/>
				</View>
			</ScrollView>
		</GradientBackground>
	);
}

function KpiTile({
	icon,
	iconBg,
	iconColor,
	value,
	label,
}: {
	icon: React.ComponentProps<typeof Ionicons>["name"];
	iconBg: string;
	iconColor: string;
	value: number | string;
	label: string;
}) {
	return (
		<View
			style={{
				flex: 1,
				minWidth: "47%",
				padding: spacing.md,
				borderRadius: radii.lg,
				backgroundColor: colors.surfaceVariant,
				borderWidth: 1,
				borderColor: colors.border,
				gap: spacing.sm,
			}}
		>
			<View
				style={{
					width: 36,
					height: 36,
					borderRadius: radii.md,
					backgroundColor: iconBg,
					alignItems: "center",
					justifyContent: "center",
				}}
			>
				<Ionicons name={icon} size={18} color={iconColor} />
			</View>
			<Text size="xxxl" weight="bold">
				{value}
			</Text>
			<Text size="sm" tone="muted">
				{label}
			</Text>
		</View>
	);
}

interface QuickAction {
	icon: React.ComponentProps<typeof Ionicons>["name"];
	iconBg: string;
	iconColor: string;
	label: string;
	href: Href;
}

const QUICK_ACTION_COLUMNS = 3;
const QUICK_ACTION_TILE_HEIGHT = 108;

function QuickActionsGrid({ items }: { items: QuickAction[] }) {
	const rows: QuickAction[][] = [];
	for (let i = 0; i < items.length; i += QUICK_ACTION_COLUMNS) {
		rows.push(items.slice(i, i + QUICK_ACTION_COLUMNS));
	}
	return (
		<View style={{ gap: spacing.sm }}>
			{rows.map((row, rowIdx) => {
				const fillers = QUICK_ACTION_COLUMNS - row.length;
				return (
					<View
						// biome-ignore lint/suspicious/noArrayIndexKey: row order is stable
						key={rowIdx}
						style={{ flexDirection: "row", gap: spacing.sm }}
					>
						{row.map((a) => (
							<QuickActionTile key={a.label} action={a} />
						))}
						{Array.from({ length: fillers }).map((_, i) => (
							<View
								// biome-ignore lint/suspicious/noArrayIndexKey: filler slot
								key={`filler-${i}`}
								style={{ flex: 1 }}
							/>
						))}
					</View>
				);
			})}
		</View>
	);
}

function QuickActionTile({ action }: { action: QuickAction }) {
	const { icon, iconBg, iconColor, label, href } = action;
	return (
		<Link href={href} asChild>
			<Pressable
				accessibilityRole="link"
				style={({ pressed }) => ({
					flex: 1,
					height: QUICK_ACTION_TILE_HEIGHT,
					paddingVertical: spacing.sm,
					paddingHorizontal: spacing.xs,
					borderRadius: radii.lg,
					backgroundColor: pressed ? colors.glassHover : colors.surfaceVariant,
					borderWidth: 1,
					borderColor: colors.border,
					gap: spacing.sm,
					alignItems: "center",
					justifyContent: "center",
				})}
			>
				<View
					style={{
						width: 44,
						height: 44,
						borderRadius: radii.md,
						backgroundColor: iconBg,
						alignItems: "center",
						justifyContent: "center",
					}}
				>
					<Ionicons name={icon} size={22} color={iconColor} />
				</View>
				<Text weight="semibold" size="sm" numberOfLines={1}>
					{label}
				</Text>
			</Pressable>
		</Link>
	);
}

import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { Link } from "expo-router";
import { Pressable, ScrollView, View } from "react-native";
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

function getGreetingKey(hour: number): string {
	if (hour < 12) return "home.greeting_morning";
	if (hour < 18) return "home.greeting_afternoon";
	return "home.greeting_evening";
}

export default function HomeScreen() {
	const { t, locale } = useT();

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
			Math.floor(
				(Date.now() - new Date(b.started_at).getTime()) / 86400000,
			) >= 25,
	);
	const tasksPending = checklistQ.data?.count ?? 0;

	const dateLabel = new Date().toLocaleDateString(
		locale === "tl" ? "fil-PH" : "en-US",
		{ month: "long", day: "numeric", year: "numeric" },
	);

	return (
		<GradientBackground>
			<ScrollView
				contentContainerStyle={{
					paddingBottom: spacing.xxxl,
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
								accessibilityLabel="Notifications"
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
								{lowStock.length + harvestReady.length > 0 ? (
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
								accessibilityLabel="Profile"
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
								<Text weight="bold">
									{firstName.charAt(0).toUpperCase()}
								</Text>
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
								<Ionicons
									name="leaf"
									size={32}
									color={colors.primaryLight}
								/>
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
						<Text
							size="sm"
							tone="muted"
							style={{ marginTop: spacing.xs }}
						>
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

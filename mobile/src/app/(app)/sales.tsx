import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, router } from "expo-router";
import { Alert, FlatList, Pressable, ScrollView, View } from "react-native";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { GradientBackground } from "@/components/ui/gradient-background";
import { Text } from "@/components/ui/text";
import { colors, spacing } from "@/constants/theme";
import { useCustomToast } from "@/hooks/useCustomToast";
import { salesApi, usersApi } from "@/lib/hydro-api";
import { useT } from "@/lib/i18n";
import { formatPHP, handleError } from "@/lib/utils";

export default function SalesScreen() {
	const { t } = useT();
	const toast = useCustomToast();
	const qc = useQueryClient();
	const me = useQuery({ queryKey: ["me"], queryFn: () => usersApi.me() });

	const sales = useQuery({
		queryKey: ["sales"],
		queryFn: () => salesApi.list(),
	});
	const dashboard = useQuery({
		queryKey: ["sales-dashboard"],
		queryFn: () => salesApi.dashboard(),
	});

	const del = useMutation({
		mutationFn: (id: string) => salesApi.delete(id),
		onSuccess: () => {
			toast.success("Sale deleted");
			qc.invalidateQueries({ queryKey: ["sales"] });
			qc.invalidateQueries({ queryKey: ["sales-dashboard"] });
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

	const d = dashboard.data;
	const netMargin = d?.net_margin_pct ?? 0;
	const grossWeek = d?.gross_current_week ?? 0;
	const grossMonth = d?.gross_current_month ?? 0;
	const grossYtd = d?.gross_ytd ?? 0;
	const netWeek = d?.net_current_week ?? 0;
	const netMonth = d?.net_current_month ?? 0;
	const netYtd = d?.net_ytd ?? 0;
	const soldWeek = d?.sold_count_week ?? 0;
	const soldMonth = d?.sold_count_month ?? 0;
	const readyCount = d?.produce_ready_count ?? 0;
	const topCrops = d?.top_crops ?? [];

	return (
		<GradientBackground>
			<ScrollView contentContainerStyle={{ paddingBottom: spacing.xxxl }}>
				<View
					style={{
						flexDirection: "row",
						justifyContent: "space-between",
						alignItems: "center",
						padding: spacing.md,
						paddingTop: spacing.xs,
					}}
				>
					<Text size="xxl" weight="bold">
						{t("sales.title")}
					</Text>
					<Link href="/sale-new" asChild>
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
							<Text weight="semibold">{t("actions.new")}</Text>
						</Pressable>
					</Link>
				</View>

				<View style={{ paddingHorizontal: spacing.md, gap: spacing.sm }}>
					<Pressable onPress={() => router.push("/inventory?tab=produce")}>
						<Card
							style={{
								borderColor: colors.primaryLight,
								borderWidth: 1,
							}}
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
										backgroundColor: `${colors.primaryLight}26`,
										alignItems: "center",
										justifyContent: "center",
									}}
								>
									<Ionicons name="leaf" size={22} color={colors.primaryLight} />
								</View>
								<View style={{ flex: 1 }}>
									<Text size="xs" tone="muted">
										READY TO SELL
									</Text>
									<Text size="xl" weight="bold">
										{readyCount}{" "}
										<Text size="sm" tone="muted">
											produce items
										</Text>
									</Text>
								</View>
								<Ionicons
									name="chevron-forward"
									size={20}
									color={colors.textMuted}
								/>
							</View>
						</Card>
					</Pressable>

					{d ? (
						<>
							<Card>
								<Text
									size="xs"
									weight="semibold"
									tone="muted"
									style={{ textTransform: "uppercase", letterSpacing: 0.5 }}
								>
									{t("sales.net_margin")}
								</Text>
								<Text size="xxxl" weight="bold" style={{ marginTop: 6 }}>
									{netMargin.toFixed(1)}%
								</Text>
							</Card>

							<Text
								size="xs"
								weight="semibold"
								tone="muted"
								style={{
									textTransform: "uppercase",
									letterSpacing: 0.5,
									marginTop: spacing.xs,
								}}
							>
								This week
							</Text>
							<View style={{ flexDirection: "row", gap: spacing.sm }}>
								<MiniStat label="Gross" value={formatPHP(grossWeek)} />
								<MiniStat
									label="Net"
									value={formatPHP(netWeek)}
									accent={colors.primaryLight}
								/>
								<MiniStat label="Sales" value={String(soldWeek)} />
							</View>

							<Text
								size="xs"
								weight="semibold"
								tone="muted"
								style={{
									textTransform: "uppercase",
									letterSpacing: 0.5,
									marginTop: spacing.xs,
								}}
							>
								This month
							</Text>
							<View style={{ flexDirection: "row", gap: spacing.sm }}>
								<MiniStat label="Gross" value={formatPHP(grossMonth)} />
								<MiniStat
									label="Net"
									value={formatPHP(netMonth)}
									accent={colors.primaryLight}
								/>
								<MiniStat label="Sales" value={String(soldMonth)} />
							</View>

							<Text
								size="xs"
								weight="semibold"
								tone="muted"
								style={{
									textTransform: "uppercase",
									letterSpacing: 0.5,
									marginTop: spacing.xs,
								}}
							>
								Year to date
							</Text>
							<View style={{ flexDirection: "row", gap: spacing.sm }}>
								<MiniStat label="Gross" value={formatPHP(grossYtd)} />
								<MiniStat
									label="Net"
									value={formatPHP(netYtd)}
									accent={colors.primaryLight}
								/>
							</View>

							{topCrops.length > 0 ? (
								<Card>
									<Text
										size="lg"
										weight="bold"
										style={{ marginBottom: spacing.xs }}
									>
										{t("sales.top_crops_90")}
									</Text>
									{topCrops.map((c) => (
										<View
											key={c.crop}
											style={{
												flexDirection: "row",
												justifyContent: "space-between",
												paddingVertical: 6,
											}}
										>
											<Text>{c.crop}</Text>
											<Text weight="semibold">{formatPHP(c.revenue)}</Text>
										</View>
									))}
								</Card>
							) : null}
						</>
					) : null}
				</View>

				<View style={{ padding: spacing.md, gap: 10 }}>
					<Text size="lg" weight="bold">
						{t("sales.recent")}
					</Text>
					<FlatList
						data={sales.data?.data ?? []}
						keyExtractor={(s) => s.id}
						scrollEnabled={false}
						ListEmptyComponent={<Text tone="muted">{t("sales.empty")}</Text>}
						renderItem={({ item }) => (
							<Card>
								<View
									style={{
										flexDirection: "row",
										justifyContent: "space-between",
										alignItems: "center",
									}}
								>
									<View style={{ flex: 1 }}>
										<Text weight="semibold">
											{item.buyer_label ?? t("sales.unnamed_buyer")}
										</Text>
										<Text size="xs" tone="muted">
											{new Date(item.sold_at).toLocaleDateString()} ·{" "}
											{item.channel}
										</Text>
									</View>
									<View
										style={{
											flexDirection: "row",
											alignItems: "center",
											gap: spacing.xs,
										}}
									>
										<Badge
											label={item.payment_status}
											color={
												item.payment_status === "paid"
													? colors.success
													: item.payment_status === "pending"
														? colors.warning
														: colors.error
											}
											small
										/>
										<Pressable
											onPress={() =>
												confirmDelete(
													item.id,
													item.buyer_label ?? t("sales.unnamed_buyer"),
												)
											}
											hitSlop={10}
											disabled={del.isPending}
										>
											<Ionicons
												name="trash-outline"
												size={18}
												color={colors.error}
											/>
										</Pressable>
									</View>
								</View>
								<View style={{ marginTop: spacing.xs, gap: spacing.xxs }}>
									{item.items.map((it) => (
										<Text key={it.id} size="sm" tone="subtle">
											{it.crop_name} — {it.quantity} {it.unit} ×{" "}
											{formatPHP(it.unit_price)}
										</Text>
									))}
								</View>
							</Card>
						)}
					/>
				</View>
			</ScrollView>
		</GradientBackground>
	);
}

function MiniStat({
	label,
	value,
	accent,
}: {
	label: string;
	value: string;
	accent?: string;
}) {
	return (
		<View
			style={{
				flex: 1,
				padding: spacing.md,
				backgroundColor: colors.surfaceVariant,
				borderWidth: 1,
				borderColor: accent ?? colors.border,
				borderRadius: 16,
			}}
		>
			<Text
				size="xs"
				tone="muted"
				style={{ textTransform: "uppercase", letterSpacing: 0.5 }}
			>
				{label}
			</Text>
			<Text
				size="lg"
				weight="bold"
				style={{ marginTop: 6, color: accent ?? colors.text }}
			>
				{value}
			</Text>
		</View>
	);
}

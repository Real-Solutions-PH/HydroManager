import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "expo-router";
import {
	Alert,
	FlatList,
	Linking,
	Pressable,
	ScrollView,
	View,
} from "react-native";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { GradientBackground } from "@/components/ui/gradient-background";
import { Text } from "@/components/ui/text";
import { colors, spacing } from "@/constants/theme";
import { useCustomToast } from "@/hooks/useCustomToast";
import { paymongoApi, salesApi, usersApi } from "@/lib/hydro-api";
import { useT } from "@/lib/i18n";
import { formatPHP, handleError } from "@/lib/utils";

export default function SalesScreen() {
	const { t } = useT();
	const toast = useCustomToast();
	const qc = useQueryClient();
	const me = useQuery({ queryKey: ["me"], queryFn: () => usersApi.me() });
	const isPro = me.data?.tier === "pro";

	const sales = useQuery({
		queryKey: ["sales"],
		queryFn: () => salesApi.list(),
		enabled: isPro,
	});
	const dashboard = useQuery({
		queryKey: ["sales-dashboard"],
		queryFn: () => salesApi.dashboard(),
		enabled: isPro,
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

	if (!isPro) {
		return (
			<GradientBackground>
				<View style={{ padding: spacing.md, paddingTop: spacing.xs }}>
					<Text size="xxl" weight="bold">
						{t("sales.title")}
					</Text>
				</View>
				<View style={{ padding: spacing.md }}>
					<Card>
						<Ionicons
							name="lock-closed"
							size={32}
							color={colors.primaryLight}
						/>
						<Text
							size="lg"
							weight="bold"
							style={{ marginTop: spacing.sm, marginBottom: spacing.xs }}
						>
							Pro-only feature
						</Text>
						<Text tone="subtle" style={{ marginBottom: spacing.md }}>
							{t("sales.pro_required")}
						</Text>
						<Button
							label={t("sales.upgrade")}
							onPress={async () => {
								try {
									const r = await paymongoApi.checkout("pro", "monthly");
									Linking.openURL(r.checkout_url);
								} catch (e) {
									Alert.alert("Error", handleError(e));
								}
							}}
						/>
					</Card>
				</View>
			</GradientBackground>
		);
	}

	const d = dashboard.data;
	const netMargin = d?.net_margin_pct ?? 0;
	const grossMonth = d?.gross_current_month ?? 0;
	const gross90 = d?.gross_last_90_days ?? 0;
	const grossYtd = d?.gross_ytd ?? 0;
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

				{d ? (
					<View style={{ paddingHorizontal: spacing.md, gap: spacing.sm }}>
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
						<View style={{ flexDirection: "row", gap: spacing.sm }}>
							<MiniStat
								label={t("sales.gross_month")}
								value={formatPHP(grossMonth)}
							/>
							<MiniStat
								label={t("sales.gross_90")}
								value={formatPHP(gross90)}
							/>
						</View>
						<MiniStat
							label={t("sales.gross_ytd")}
							value={formatPHP(grossYtd)}
							fullWidth
						/>

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
					</View>
				) : null}

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
	fullWidth,
}: {
	label: string;
	value: string;
	fullWidth?: boolean;
}) {
	return (
		<View
			style={{
				flex: fullWidth ? undefined : 1,
				padding: spacing.md,
				backgroundColor: colors.surfaceVariant,
				borderWidth: 1,
				borderColor: colors.border,
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
			<Text size="xl" weight="bold" style={{ marginTop: 6 }}>
				{value}
			</Text>
		</View>
	);
}

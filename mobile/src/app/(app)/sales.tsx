import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { GradientBackground } from "@/components/ui/gradient-background";
import { Text } from "@/components/ui/text";
import { colors } from "@/constants/theme";
import { paymongoApi, salesApi, usersApi } from "@/lib/hydro-api";
import { useT } from "@/lib/i18n";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { Link } from "expo-router";
import {
	Alert,
	FlatList,
	Linking,
	Pressable,
	ScrollView,
	View,
} from "react-native";

export default function SalesScreen() {
	const { t } = useT();
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
				<View style={{ padding: 16, paddingTop: 8 }}>
					<Text size="xxl" weight="bold">
						{t("sales.title")}
					</Text>
				</View>
				<View style={{ padding: 16 }}>
					<Card>
						<Ionicons
							name="lock-closed"
							size={32}
							color={colors.primaryLight}
						/>
						<Text
							size="lg"
							weight="bold"
							style={{ marginTop: 12, marginBottom: 8 }}
						>
							Pro-only feature
						</Text>
						<Text tone="subtle" style={{ marginBottom: 16 }}>
							{t("sales.pro_required")}
						</Text>
						<Button
							label={t("sales.upgrade")}
							onPress={async () => {
								try {
									const r = await paymongoApi.checkout("pro", "monthly");
									Linking.openURL(r.checkout_url);
								} catch (e) {
									Alert.alert("Error", String(e));
								}
							}}
						/>
					</Card>
				</View>
			</GradientBackground>
		);
	}

	const d = dashboard.data;

	return (
		<GradientBackground>
			<ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
				<View
					style={{
						flexDirection: "row",
						justifyContent: "space-between",
						alignItems: "center",
						padding: 16,
						paddingTop: 8,
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
								gap: 4,
								backgroundColor: colors.buttonSolidBg,
								paddingHorizontal: 12,
								paddingVertical: 8,
								borderRadius: 12,
							}}
						>
							<Ionicons name="add" size={18} color="#FFFFFF" />
							<Text weight="semibold">{t("actions.new")}</Text>
						</Pressable>
					</Link>
				</View>

				{d ? (
					<View style={{ paddingHorizontal: 16, gap: 12 }}>
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
								{d.net_margin_pct}%
							</Text>
						</Card>
						<View style={{ flexDirection: "row", gap: 12 }}>
							<MiniStat
								label={t("sales.gross_month")}
								value={`₱${d.gross_current_month}`}
							/>
							<MiniStat
								label={t("sales.gross_90")}
								value={`₱${d.gross_last_90_days}`}
							/>
						</View>
						<MiniStat
							label={t("sales.gross_ytd")}
							value={`₱${d.gross_ytd}`}
							fullWidth
						/>

						{d.top_crops.length > 0 ? (
							<Card>
								<Text size="lg" weight="bold" style={{ marginBottom: 8 }}>
									Top crops (90d)
								</Text>
								{d.top_crops.map((c) => (
									<View
										key={c.crop}
										style={{
											flexDirection: "row",
											justifyContent: "space-between",
											paddingVertical: 6,
										}}
									>
										<Text>{c.crop}</Text>
										<Text weight="semibold">₱{c.revenue}</Text>
									</View>
								))}
							</Card>
						) : null}
					</View>
				) : null}

				<View style={{ padding: 16, gap: 10 }}>
					<Text size="lg" weight="bold">
						Recent sales
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
											{item.buyer_label ?? "Unnamed buyer"}
										</Text>
										<Text size="xs" tone="muted">
											{new Date(item.sold_at).toLocaleDateString()} ·{" "}
											{item.channel}
										</Text>
									</View>
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
								</View>
								<View style={{ marginTop: 8, gap: 4 }}>
									{item.items.map((it) => (
										<Text key={it.id} size="sm" tone="subtle">
											{it.crop_name} — {it.quantity} {it.unit} × ₱
											{it.unit_price.toFixed(2)}
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
}: { label: string; value: string; fullWidth?: boolean }) {
	return (
		<View
			style={{
				flex: fullWidth ? undefined : 1,
				padding: 16,
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

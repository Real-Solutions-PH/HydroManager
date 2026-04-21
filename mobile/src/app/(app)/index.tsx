import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { Link } from "expo-router";
import { Pressable, ScrollView, View } from "react-native";
import { Card } from "@/components/ui/card";
import { GradientBackground } from "@/components/ui/gradient-background";
import { SectionHeader } from "@/components/ui/section-header";
import { StatCard } from "@/components/ui/stat-card";
import { Text } from "@/components/ui/text";
import { colors, systemTypes } from "@/constants/theme";
import { batchesApi, inventoryApi, setupsApi, usersApi } from "@/lib/hydro-api";
import { useT } from "@/lib/i18n";

export default function HomeScreen() {
	const { t } = useT();
	const { data: user } = useQuery({
		queryKey: ["me"],
		queryFn: () => usersApi.me(),
	});
	const setups = useQuery({
		queryKey: ["setups"],
		queryFn: () => setupsApi.list(),
	});
	const batches = useQuery({
		queryKey: ["batches"],
		queryFn: () => batchesApi.list(),
	});
	const inventory = useQuery({
		queryKey: ["inventory"],
		queryFn: () => inventoryApi.list(),
	});

	const lowStock = (inventory.data?.data ?? []).filter((i) => i.is_low_stock);
	const harvestReady = (batches.data?.data ?? []).filter(
		(b) =>
			Math.floor((Date.now() - new Date(b.started_at).getTime()) / 86400000) >=
			25,
	);

	return (
		<GradientBackground>
			<ScrollView
				contentContainerStyle={{ paddingBottom: 40 }}
				style={{ flex: 1 }}
			>
				<View
					style={{
						flexDirection: "row",
						alignItems: "center",
						justifyContent: "space-between",
						paddingHorizontal: 16,
						paddingTop: 8,
					}}
				>
					<View>
						<Text size="sm" tone="muted">
							{t("home.greeting")}
						</Text>
						<Text size="xxl" weight="bold">
							{user?.full_name?.split(" ")[0] ?? t("home.default_name")}
						</Text>
					</View>
					<View style={{ flexDirection: "row", gap: 8 }}>
						<Link href="/crops" asChild>
							<Pressable
								style={{
									width: 40,
									height: 40,
									borderRadius: 999,
									backgroundColor: colors.glass,
									alignItems: "center",
									justifyContent: "center",
								}}
							>
								<Ionicons name="leaf-outline" size={20} color={colors.text} />
							</Pressable>
						</Link>
						<Link href="/settings" asChild>
							<Pressable
								style={{
									width: 40,
									height: 40,
									borderRadius: 999,
									backgroundColor: colors.glass,
									alignItems: "center",
									justifyContent: "center",
								}}
							>
								<Ionicons
									name="person-circle-outline"
									size={20}
									color={colors.text}
								/>
							</Pressable>
						</Link>
					</View>
				</View>

				<SectionHeader title="Today" subtitle="At-a-glance farm status" />
				<View
					style={{
						flexDirection: "row",
						flexWrap: "wrap",
						gap: 12,
						paddingHorizontal: 16,
					}}
				>
					<StatCard
						label="Setups"
						value={setups.data?.count ?? 0}
						icon="grid"
					/>
					<StatCard
						label="Batches"
						value={batches.data?.count ?? 0}
						icon="leaf"
					/>
					<StatCard
						label="Near Harvest"
						value={harvestReady.length}
						icon="nutrition"
						accent={colors.primaryLight}
					/>
					<StatCard
						label="Low Stock"
						value={lowStock.length}
						icon="alert-circle"
						accent={lowStock.length > 0 ? colors.error : undefined}
					/>
				</View>

				<SectionHeader title="Quick Actions" />
				<View style={{ paddingHorizontal: 16, gap: 10 }}>
					<QuickAction
						label="New Setup"
						icon="add-circle-outline"
						href="/setup/new"
						variant="solid"
					/>
					<QuickAction
						label="Start a Batch"
						icon="leaf-outline"
						href="/batch/new"
						variant="outline"
					/>
					<QuickAction
						label="Add Inventory Item"
						icon="cube-outline"
						href="/inventory-new"
						variant="outline"
					/>
				</View>

				{lowStock.length > 0 ? (
					<>
						<SectionHeader title="Alerts" />
						<View style={{ paddingHorizontal: 16 }}>
							<Card
								style={{
									borderLeftWidth: 4,
									borderLeftColor: colors.error,
								}}
							>
								<Text weight="semibold" tone="error">
									Low Stock
								</Text>
								{lowStock.slice(0, 3).map((it) => (
									<Text key={it.id} size="sm" tone="muted">
										{it.name}: {it.current_stock} {it.unit}
									</Text>
								))}
							</Card>
						</View>
					</>
				) : null}

				<SectionHeader title="Setups" subtitle="Your active systems" />
				<View style={{ paddingHorizontal: 16, gap: 12 }}>
					{(setups.data?.data ?? []).slice(0, 3).map((s) => {
						const c = systemTypes[s.type];
						return (
							<Link key={s.id} href={`/setup/${s.id}`} asChild>
								<Pressable>
									<Card>
										<View
											style={{
												flexDirection: "row",
												alignItems: "center",
												gap: 12,
											}}
										>
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
											<View style={{ flex: 1 }}>
												<Text weight="semibold">{s.name}</Text>
												<Text size="sm" tone="muted">
													{s.slot_count} slots ·{" "}
													{s.location_label ?? "No location"}
												</Text>
											</View>
											<Ionicons
												name="chevron-forward"
												size={18}
												color={colors.textMuted}
											/>
										</View>
									</Card>
								</Pressable>
							</Link>
						);
					})}
					{(setups.data?.data ?? []).length === 0 ? (
						<Card variant="outlined">
							<Text tone="muted">No setups yet. Add your first.</Text>
						</Card>
					) : null}
				</View>
			</ScrollView>
		</GradientBackground>
	);
}

function QuickAction({
	label,
	icon,
	href,
	variant,
}: {
	label: string;
	icon: React.ComponentProps<typeof Ionicons>["name"];
	href: string;
	variant: "solid" | "outline";
}) {
	const solid = variant === "solid";
	return (
		<Link href={href as never} asChild>
			<Pressable
				style={({ pressed }) => ({
					flexDirection: "row",
					alignItems: "center",
					justifyContent: "center",
					gap: 10,
					height: 48,
					borderRadius: 12,
					borderWidth: solid ? 0 : 1,
					borderColor: colors.borderStrong,
					backgroundColor: solid
						? pressed
							? colors.buttonSolidActive
							: colors.buttonSolidBg
						: pressed
							? colors.glassHover
							: "transparent",
				})}
			>
				<Ionicons name={icon} size={18} color={colors.text} />
				<Text weight="semibold">{label}</Text>
			</Pressable>
		</Link>
	);
}

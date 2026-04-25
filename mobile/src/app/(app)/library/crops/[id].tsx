import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Image, Pressable, ScrollView, View } from "react-native";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { GradientBackground } from "@/components/ui/gradient-background";
import { Text } from "@/components/ui/text";
import { colors, spacing } from "@/constants/theme";
import { useCrop } from "@/hooks/use-library";
import type { CropGuide } from "@/lib/hydro-api";

export default function CropDetailScreen() {
	const { id } = useLocalSearchParams<{ id: string }>();
	const router = useRouter();
	const { data: crop, isLoading } = useCrop(id);

	return (
		<GradientBackground>
			<ScrollView
				contentContainerStyle={{
					padding: spacing.md,
					paddingBottom: spacing.jumbo * 2,
					gap: spacing.md,
				}}
			>
				<Pressable
					onPress={() => router.back()}
					hitSlop={8}
					style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
				>
					<Ionicons name="chevron-back" size={22} color={colors.text} />
					<Text size="sm">Back</Text>
				</Pressable>
				{isLoading || !crop ? (
					<Text tone="muted">Loading...</Text>
				) : (
					<CropDetail crop={crop} />
				)}
			</ScrollView>
		</GradientBackground>
	);
}

function CropDetail({ crop }: { crop: CropGuide }) {
	return (
		<View style={{ gap: spacing.md }}>
			{crop.image_url ? (
				<Image
					source={{ uri: crop.image_url }}
					style={{ width: "100%", height: 200, borderRadius: 16 }}
				/>
			) : null}
			<View>
				<Text size="xxl" weight="bold">
					{crop.name_en}
				</Text>
				<Text size="sm" tone="muted">
					{crop.name_tl}
				</Text>
				<View
					style={{
						flexDirection: "row",
						gap: spacing.xs,
						marginTop: spacing.xs,
						flexWrap: "wrap",
					}}
				>
					<Badge label={crop.category} color={colors.primaryLight} small />
					<Badge
						label={`${crop.days_to_harvest_min}-${crop.days_to_harvest_max}d`}
						color={colors.info}
						small
					/>
					{crop.local_price_php_per_kg_min ? (
						<Badge
							label={`PHP ${crop.local_price_php_per_kg_min}-${crop.local_price_php_per_kg_max}/kg`}
							color={colors.warning}
							small
						/>
					) : null}
				</View>
			</View>

			<Section title="General Info">
				<StatGrid
					stats={[
						{ label: "pH", value: `${crop.ph_min}-${crop.ph_max}` },
						{ label: "EC range", value: `${crop.ec_min}-${crop.ec_max}` },
						{ label: "Sunlight", value: crop.sunlight_hours },
						{ label: "Growlight", value: crop.growlight_hours },
						{ label: "Day temp", value: crop.temperature_day_c },
						{ label: "Night temp", value: crop.temperature_night_c },
						{ label: "Water temp", value: crop.water_temp_c },
						{ label: "Humidity", value: crop.humidity_pct },
						{
							label: "Yield",
							value: crop.typical_yield_grams
								? `${crop.typical_yield_grams}g / plant`
								: null,
						},
						{ label: "Setups", value: crop.recommended_setups },
					]}
				/>
			</Section>

			{crop.ec_seedling != null ||
			crop.ec_vegetative != null ||
			crop.ec_mature != null ||
			crop.ec_fruiting != null ? (
				<Section title="EC by Stage">
					<StatGrid
						stats={[
							{
								label: "Seedling",
								value:
									crop.ec_seedling != null ? String(crop.ec_seedling) : null,
							},
							{
								label: "Vegetative",
								value:
									crop.ec_vegetative != null
										? String(crop.ec_vegetative)
										: null,
							},
							{
								label: "Mature",
								value: crop.ec_mature != null ? String(crop.ec_mature) : null,
							},
							{
								label: "Fruiting",
								value:
									crop.ec_fruiting != null ? String(crop.ec_fruiting) : null,
							},
						]}
					/>
				</Section>
			) : null}

			{crop.growth_stages?.length ? (
				<Section title="Crop Guide">
					<View style={{ gap: spacing.sm }}>
						{crop.growth_stages.map((stage, i) => (
							<Card key={`${stage.stage}-${stage.day_min}`} variant="outlined">
								<View
									style={{
										flexDirection: "row",
										justifyContent: "space-between",
										marginBottom: 4,
									}}
								>
									<Text size="md" weight="semibold">
										{i + 1}. {stage.stage}
									</Text>
									<Text size="xs" tone="muted">
										Day {stage.day_min}-{stage.day_max}
									</Text>
								</View>
								<Text size="sm" tone="subtle">
									{stage.description}
								</Text>
								{stage.actions?.length ? (
									<View style={{ marginTop: spacing.xs, gap: 2 }}>
										{stage.actions.map((a) => (
											<Text
												key={`${stage.stage}-action-${a}`}
												size="xs"
												tone="muted"
											>
												• {a}
											</Text>
										))}
									</View>
								) : null}
							</Card>
						))}
					</View>
				</Section>
			) : null}

			{crop.tips?.length ? (
				<Section title="Tips">
					<Card variant="outlined">
						<View style={{ gap: spacing.xs }}>
							{crop.tips.map((tip) => (
								<View
									key={`tip-${tip}`}
									style={{ flexDirection: "row", gap: spacing.xs }}
								>
									<Text
										size="md"
										weight="bold"
										style={{ color: colors.primaryLight }}
									>
										•
									</Text>
									<Text size="sm" tone="subtle" style={{ flex: 1 }}>
										{tip}
									</Text>
								</View>
							))}
						</View>
					</Card>
				</Section>
			) : null}

			{crop.risks?.length ? (
				<Section title="Risks & Mitigation">
					<View style={{ gap: spacing.sm }}>
						{crop.risks.map((risk) => (
							<Card key={`risk-${risk.title}`} variant="outlined">
								<Text
									size="md"
									weight="semibold"
									style={{ color: colors.warning }}
								>
									{risk.title}
								</Text>
								<Text size="sm" tone="subtle" style={{ marginTop: 4 }}>
									{risk.description}
								</Text>
								<Text
									size="xs"
									tone="muted"
									style={{ marginTop: spacing.xs, fontStyle: "italic" }}
								>
									Mitigation: {risk.mitigation}
								</Text>
							</Card>
						))}
					</View>
				</Section>
			) : null}

			{crop.harvest_indicator ? (
				<Section title="Harvest Indicator">
					<Text size="sm" tone="subtle">
						{crop.harvest_indicator}
					</Text>
				</Section>
			) : null}

			{crop.source ? (
				<Text size="xs" tone="muted" style={{ marginTop: spacing.md }}>
					Source: {crop.source}
				</Text>
			) : null}
		</View>
	);
}

function Section({
	title,
	children,
}: {
	title: string;
	children: React.ReactNode;
}) {
	return (
		<View style={{ gap: spacing.xs }}>
			<Text size="lg" weight="semibold">
				{title}
			</Text>
			{children}
		</View>
	);
}

function StatGrid({
	stats,
}: {
	stats: { label: string; value: string | null | undefined }[];
}) {
	const visible = stats.filter((s) => s.value);
	return (
		<View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.md }}>
			{visible.map((s) => (
				<View key={s.label} style={{ minWidth: "30%" }}>
					<Text
						size="xs"
						tone="muted"
						style={{ textTransform: "uppercase", letterSpacing: 0.5 }}
					>
						{s.label}
					</Text>
					<Text size="md" weight="semibold">
						{s.value}
					</Text>
				</View>
			))}
		</View>
	);
}

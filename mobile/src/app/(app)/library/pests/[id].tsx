import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Image, Pressable, ScrollView, View } from "react-native";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { GradientBackground } from "@/components/ui/gradient-background";
import { Text } from "@/components/ui/text";
import { colors, spacing } from "@/constants/theme";
import { useBack } from "@/hooks/use-back";
import { usePest } from "@/hooks/use-library";
import type { LibraryPest, PestKind, PestSeverity } from "@/lib/hydro-api";

const KIND_COLOR: Record<PestKind, string> = {
	pest: colors.warning,
	disease: colors.error,
	deficiency: colors.info,
};

const SEV_COLOR: Record<PestSeverity, string> = {
	low: colors.success,
	medium: colors.warning,
	high: colors.error,
};

export default function PestDetailScreen() {
	const { id } = useLocalSearchParams<{ id: string }>();
	const router = useRouter();
	const goBack = useBack();
	const { data: pest, isLoading } = usePest(id);

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
					onPress={goBack}
					hitSlop={8}
					style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
				>
					<Ionicons name="chevron-back" size={22} color={colors.text} />
					<Text size="sm">Back</Text>
				</Pressable>
				{isLoading || !pest ? (
					<Text tone="muted">Loading...</Text>
				) : (
					<PestDetail pest={pest} />
				)}
			</ScrollView>
		</GradientBackground>
	);
}

function PestDetail({ pest }: { pest: LibraryPest }) {
	return (
		<View style={{ gap: spacing.md }}>
			{pest.image_url ? (
				<Image
					source={{ uri: pest.image_url }}
					style={{ width: "100%", height: 200, borderRadius: 16 }}
				/>
			) : (
				<View
					style={{
						width: "100%",
						height: 200,
						borderRadius: 16,
						backgroundColor: colors.glass,
						alignItems: "center",
						justifyContent: "center",
					}}
				>
					<Ionicons name="bug" size={64} color={colors.warning} />
				</View>
			)}
			<View>
				<Text size="xxl" weight="bold">
					{pest.name}
				</Text>
				<View
					style={{
						flexDirection: "row",
						gap: spacing.xs,
						marginTop: spacing.xs,
						flexWrap: "wrap",
					}}
				>
					<Badge label={pest.kind} color={KIND_COLOR[pest.kind]} small />
					<Badge label={pest.severity} color={SEV_COLOR[pest.severity]} small />
				</View>
			</View>

			{pest.affected_crops?.length ? (
				<Section title="Affected Crops">
					<View
						style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.xs }}
					>
						{pest.affected_crops.map((c) => (
							<Badge key={c} label={c} color={colors.primaryLight} small />
						))}
					</View>
				</Section>
			) : null}

			{pest.symptoms?.length ? (
				<Section title="Symptoms">
					<BulletList items={pest.symptoms} accent={colors.warning} />
				</Section>
			) : null}

			{pest.causes?.length ? (
				<Section title="Causes">
					<BulletList items={pest.causes} accent={colors.error} />
				</Section>
			) : null}

			{pest.prevention?.length ? (
				<Section title="Prevention">
					<BulletList items={pest.prevention} accent={colors.success} />
				</Section>
			) : null}

			{pest.treatment?.length ? (
				<Section title="Treatment">
					<BulletList items={pest.treatment} accent={colors.info} />
				</Section>
			) : null}

			{pest.source ? (
				<Text size="xs" tone="muted" style={{ marginTop: spacing.md }}>
					Source: {pest.source}
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

function BulletList({ items, accent }: { items: string[]; accent: string }) {
	return (
		<Card variant="outlined">
			<View style={{ gap: spacing.xs }}>
				{items.map((item) => (
					<View
						key={`bullet-${item}`}
						style={{ flexDirection: "row", gap: spacing.xs }}
					>
						<Text size="md" weight="bold" style={{ color: accent }}>
							•
						</Text>
						<Text size="sm" tone="subtle" style={{ flex: 1 }}>
							{item}
						</Text>
					</View>
				))}
			</View>
		</Card>
	);
}

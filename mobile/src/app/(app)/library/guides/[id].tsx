import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Image, Pressable, ScrollView, View } from "react-native";
import { Badge } from "@/components/ui/badge";
import { GradientBackground } from "@/components/ui/gradient-background";
import { Text } from "@/components/ui/text";
import { colors, spacing } from "@/constants/theme";
import { useBack } from "@/hooks/use-back";
import { useGuide } from "@/hooks/use-library";
import { MarkdownRender } from "@/lib/markdown-render";

export default function GuideDetailScreen() {
	const { id } = useLocalSearchParams<{ id: string }>();
	const router = useRouter();
	const goBack = useBack();
	const { data: guide, isLoading } = useGuide(id);

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
				{isLoading || !guide ? (
					<Text tone="muted">Loading...</Text>
				) : (
					<>
						{guide.image_url ? (
							<Image
								source={{ uri: guide.image_url }}
								style={{ width: "100%", height: 200, borderRadius: 16 }}
							/>
						) : null}
						<View>
							<View
								style={{
									flexDirection: "row",
									gap: spacing.xs,
									marginBottom: spacing.xxs,
								}}
							>
								<Badge
									label={guide.category}
									color={colors.primaryLight}
									small
								/>
								{guide.read_time_min ? (
									<Badge
										label={`${guide.read_time_min} min read`}
										color={colors.textMuted}
										small
									/>
								) : null}
							</View>
							<Text size="xxl" weight="bold">
								{guide.title}
							</Text>
							<Text size="sm" tone="muted" style={{ marginTop: spacing.xxs }}>
								{guide.summary}
							</Text>
						</View>
						{guide.tags?.length ? (
							<View
								style={{
									flexDirection: "row",
									flexWrap: "wrap",
									gap: spacing.xs,
								}}
							>
								{guide.tags.map((t) => (
									<Badge key={t} label={`#${t}`} color={colors.info} small />
								))}
							</View>
						) : null}
						<MarkdownRender source={guide.body_md} />
						{guide.source ? (
							<Text size="xs" tone="muted" style={{ marginTop: spacing.md }}>
								Source: {guide.source}
							</Text>
						) : null}
					</>
				)}
			</ScrollView>
		</GradientBackground>
	);
}

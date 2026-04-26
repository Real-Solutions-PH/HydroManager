import { Ionicons } from "@expo/vector-icons";
import { Link, useRouter } from "expo-router";
import { useState } from "react";
import { FlatList, Image, Pressable, View } from "react-native";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { GradientBackground } from "@/components/ui/gradient-background";
import { SearchBar } from "@/components/ui/search-bar";
import { Text } from "@/components/ui/text";
import { colors, spacing } from "@/constants/theme";
import { useBack } from "@/hooks/use-back";
import { useGuides } from "@/hooks/use-library";
import type { GuideCategory, LibraryGuide } from "@/lib/hydro-api";
import { capitalize } from "@/lib/utils";

const CATEGORIES: GuideCategory[] = [
	"setup",
	"nutrition",
	"business",
	"safety",
	"operations",
	"other",
];

const CAT_COLOR: Record<GuideCategory, string> = {
	setup: colors.info,
	nutrition: colors.primaryLight,
	business: colors.warning,
	safety: colors.error,
	operations: colors.success,
	other: colors.textMuted,
};

export default function GuidesListScreen() {
	const router = useRouter();
	const goBack = useBack();
	const [query, setQuery] = useState("");
	const [category, setCategory] = useState<GuideCategory | null>(null);
	const { data, isLoading } = useGuides(query, category ?? undefined);

	return (
		<GradientBackground>
			<View
				style={{
					paddingHorizontal: spacing.md,
					paddingTop: spacing.xs,
					gap: spacing.sm,
				}}
			>
				<View
					style={{
						flexDirection: "row",
						alignItems: "center",
						gap: spacing.sm,
					}}
				>
					<Pressable onPress={goBack} hitSlop={8}>
						<Ionicons name="chevron-back" size={26} color={colors.text} />
					</Pressable>
					<Text size="xxl" weight="bold">
						Guides
					</Text>
				</View>
				<SearchBar
					value={query}
					onChangeText={setQuery}
					placeholder="Search guides"
				/>
				<View
					style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.xs }}
				>
					<Chip
						label="All"
						active={category === null}
						onPress={() => setCategory(null)}
					/>
					{CATEGORIES.map((c) => (
						<Chip
							key={c}
							label={capitalize(c)}
							active={category === c}
							accent={CAT_COLOR[c]}
							onPress={() => setCategory(c)}
						/>
					))}
				</View>
			</View>
			<FlatList
				data={data?.data ?? []}
				keyExtractor={(g) => g.id}
				contentContainerStyle={{
					padding: spacing.md,
					paddingBottom: spacing.jumbo * 2,
					gap: spacing.sm,
				}}
				ListEmptyComponent={
					isLoading ? (
						<Text tone="muted">Loading...</Text>
					) : (
						<View
							style={{ alignItems: "center", paddingVertical: spacing.jumbo }}
						>
							<Ionicons
								name="book-outline"
								size={48}
								color={colors.textMuted}
							/>
							<Text tone="muted" style={{ marginTop: spacing.sm }}>
								No guides matched.
							</Text>
						</View>
					)
				}
				renderItem={({ item }) => <GuideRow guide={item} />}
			/>
		</GradientBackground>
	);
}

function Chip({
	label,
	active,
	accent,
	onPress,
}: {
	label: string;
	active: boolean;
	accent?: string;
	onPress: () => void;
}) {
	const c = accent ?? colors.primaryLight;
	return (
		<Pressable
			onPress={onPress}
			style={{
				paddingHorizontal: spacing.sm,
				paddingVertical: 6,
				borderRadius: 999,
				borderWidth: 1,
				borderColor: active ? c : colors.border,
				backgroundColor: active ? `${c}26` : "transparent",
			}}
		>
			<Text
				size="sm"
				weight="semibold"
				style={{ color: active ? c : colors.text }}
			>
				{label}
			</Text>
		</Pressable>
	);
}

function GuideRow({ guide }: { guide: LibraryGuide }) {
	return (
		<Link href={`/library/guides/${guide.id}`} asChild>
			<Card onPress={() => {}}>
				<View style={{ gap: spacing.sm }}>
					{guide.image_url ? (
						<Image
							source={{ uri: guide.image_url }}
							style={{ width: "100%", height: 140, borderRadius: 12 }}
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
								color={CAT_COLOR[guide.category]}
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
						<Text size="lg" weight="semibold">
							{guide.title}
						</Text>
						<Text size="xs" tone="muted" style={{ marginTop: 2 }}>
							{guide.summary}
						</Text>
					</View>
				</View>
			</Card>
		</Link>
	);
}

import { Ionicons } from "@expo/vector-icons";
import { Link, useRouter } from "expo-router";
import { useState } from "react";
import {
	ActivityIndicator,
	FlatList,
	Image,
	Pressable,
	View,
} from "react-native";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { GradientBackground } from "@/components/ui/gradient-background";
import { SearchBar } from "@/components/ui/search-bar";
import { Text } from "@/components/ui/text";
import { spacing, type ThemeColors, useThemeColors } from "@/constants/theme";
import { useBack } from "@/hooks/use-back";
import { useGuides } from "@/hooks/use-library";
import type { GuideCategory, LibraryGuide } from "@/lib/hydro-api";
import { flattenPages } from "@/lib/paginate";
import { capitalize } from "@/lib/utils";

const CATEGORIES: GuideCategory[] = [
	"setup",
	"nutrition",
	"business",
	"safety",
	"operations",
	"other",
];

function catColor(c: GuideCategory, colors: ThemeColors): string {
	switch (c) {
		case "setup":
			return colors.info;
		case "nutrition":
			return colors.primaryLight;
		case "business":
			return colors.warning;
		case "safety":
			return colors.error;
		case "operations":
			return colors.success;
		case "other":
			return colors.neutral;
	}
}

export default function GuidesListScreen() {
	const colors = useThemeColors();
	const _router = useRouter();
	const goBack = useBack();
	const [query, setQuery] = useState("");
	const [category, setCategory] = useState<GuideCategory | null>(null);
	const guidesQ = useGuides(query, category ?? undefined);
	const { isLoading, hasNextPage, isFetchingNextPage, fetchNextPage } = guidesQ;
	const guides = flattenPages(guidesQ.data);

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
							accent={catColor(c, colors)}
							onPress={() => setCategory(c)}
						/>
					))}
				</View>
			</View>
			<FlatList
				data={guides}
				keyExtractor={(g) => g.id}
				onEndReached={() => {
					if (hasNextPage && !isFetchingNextPage) fetchNextPage();
				}}
				onEndReachedThreshold={0.4}
				ListFooterComponent={
					isFetchingNextPage ? (
						<View style={{ paddingVertical: spacing.md }}>
							<ActivityIndicator color={colors.textMuted} />
						</View>
					) : null
				}
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
	const colors = useThemeColors();
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
	const colors = useThemeColors();
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
								color={catColor(guide.category, colors)}
								small
							/>
							{guide.read_time_min ? (
								<Badge
									label={`${guide.read_time_min} min read`}
									color={colors.neutral}
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

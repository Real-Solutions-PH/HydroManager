import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { FlatList, Pressable, View } from "react-native";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { GradientBackground } from "@/components/ui/gradient-background";
import { SearchBar } from "@/components/ui/search-bar";
import { Text } from "@/components/ui/text";
import { colors, spacing } from "@/constants/theme";
import { type CropGuide, cropsApi } from "@/lib/hydro-api";
import { capitalize } from "@/lib/utils";

const CATEGORIES = ["leafy", "herb", "fruiting", "other"] as const;
type Cat = (typeof CATEGORIES)[number];

const CAT_COLOR: Record<Cat, string> = {
	leafy: colors.success,
	herb: colors.primaryLight,
	fruiting: colors.warning,
	other: colors.info,
};

export default function CropsScreen() {
	const [query, setQuery] = useState("");
	const [category, setCategory] = useState<Cat | null>(null);
	const { data, isLoading } = useQuery({
		queryKey: ["crops", query, category],
		queryFn: () => cropsApi.list(query || undefined, category ?? undefined),
	});

	return (
		<GradientBackground>
			<View
				style={{
					paddingHorizontal: spacing.md,
					paddingTop: spacing.xs,
					gap: spacing.sm,
				}}
			>
				<Text size="xxl" weight="bold">
					Crops
				</Text>
				<SearchBar
					value={query}
					onChangeText={setQuery}
					placeholder="Hanapin sa english or tagalog"
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
				keyExtractor={(c) => c.id}
				contentContainerStyle={{ padding: spacing.md, gap: spacing.sm }}
				ListEmptyComponent={
					isLoading ? (
						<Text tone="muted">Loading...</Text>
					) : (
						<View
							style={{ alignItems: "center", paddingVertical: spacing.jumbo }}
						>
							<Ionicons
								name="leaf-outline"
								size={48}
								color={colors.textMuted}
							/>
							<Text tone="muted" style={{ marginTop: spacing.sm }}>
								No crops matched.
							</Text>
						</View>
					)
				}
				renderItem={({ item }) => <CropRow crop={item} />}
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

function CropRow({ crop }: { crop: CropGuide }) {
	return (
		<Card>
			<View
				style={{
					flexDirection: "row",
					alignItems: "center",
					gap: spacing.sm,
				}}
			>
				<View
					style={{
						width: 56,
						height: 56,
						borderRadius: 12,
						backgroundColor: colors.glass,
						alignItems: "center",
						justifyContent: "center",
					}}
				>
					<Ionicons name="leaf" size={28} color={colors.primaryLight} />
				</View>
				<View style={{ flex: 1 }}>
					<Text size="lg" weight="semibold">
						{crop.name_en}
					</Text>
					<Text size="xs" tone="muted">
						{crop.name_tl} · {crop.category}
					</Text>
				</View>
				<Badge
					label={`${crop.days_to_harvest_min}-${crop.days_to_harvest_max}d`}
					color={colors.primaryLight}
					small
				/>
			</View>
			<View
				style={{
					flexDirection: "row",
					flexWrap: "wrap",
					gap: spacing.md,
					marginTop: spacing.sm,
				}}
			>
				<Stat label="pH" value={`${crop.ph_min}-${crop.ph_max}`} />
				<Stat label="EC" value={`${crop.ec_min}-${crop.ec_max}`} />
				{crop.typical_yield_grams ? (
					<Stat label="Yield" value={`${crop.typical_yield_grams}g`} />
				) : null}
			</View>
			<Text size="xs" tone="muted" style={{ marginTop: spacing.xs }}>
				Setups: {crop.recommended_setups}
			</Text>
		</Card>
	);
}

function Stat({ label, value }: { label: string; value: string }) {
	return (
		<View>
			<Text
				size="xs"
				tone="muted"
				style={{
					textTransform: "uppercase",
					letterSpacing: 0.5,
				}}
			>
				{label}
			</Text>
			<Text size="md" weight="semibold">
				{value}
			</Text>
		</View>
	);
}

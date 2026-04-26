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
import { usePests } from "@/hooks/use-library";
import type { LibraryPest, PestKind, PestSeverity } from "@/lib/hydro-api";
import { capitalize } from "@/lib/utils";

const KINDS: PestKind[] = ["pest", "disease", "deficiency"];

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

export default function PestsListScreen() {
	const router = useRouter();
	const goBack = useBack();
	const [query, setQuery] = useState("");
	const [kind, setKind] = useState<PestKind | null>(null);
	const { data, isLoading } = usePests(query, kind ?? undefined);

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
						Pests & Diseases
					</Text>
				</View>
				<SearchBar
					value={query}
					onChangeText={setQuery}
					placeholder="Search by name"
				/>
				<View
					style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.xs }}
				>
					<Chip
						label="All"
						active={kind === null}
						onPress={() => setKind(null)}
					/>
					{KINDS.map((k) => (
						<Chip
							key={k}
							label={capitalize(k)}
							active={kind === k}
							accent={KIND_COLOR[k]}
							onPress={() => setKind(k)}
						/>
					))}
				</View>
			</View>
			<FlatList
				data={data?.data ?? []}
				keyExtractor={(p) => p.id}
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
							<Ionicons name="bug-outline" size={48} color={colors.textMuted} />
							<Text tone="muted" style={{ marginTop: spacing.sm }}>
								No matches.
							</Text>
						</View>
					)
				}
				renderItem={({ item }) => (
					<PestRow pest={item} severityColor={SEV_COLOR[item.severity]} />
				)}
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

function PestRow({
	pest,
	severityColor,
}: {
	pest: LibraryPest;
	severityColor: string;
}) {
	return (
		<Link href={`/library/pests/${pest.id}`} asChild>
			<Card onPress={() => {}}>
				<View
					style={{
						flexDirection: "row",
						alignItems: "center",
						gap: spacing.sm,
					}}
				>
					{pest.image_url ? (
						<Image
							source={{ uri: pest.image_url }}
							style={{ width: 64, height: 64, borderRadius: 12 }}
						/>
					) : (
						<View
							style={{
								width: 64,
								height: 64,
								borderRadius: 12,
								backgroundColor: colors.glass,
								alignItems: "center",
								justifyContent: "center",
							}}
						>
							<Ionicons name="bug" size={28} color={colors.warning} />
						</View>
					)}
					<View style={{ flex: 1 }}>
						<Text size="lg" weight="semibold">
							{pest.name}
						</Text>
						<View
							style={{
								flexDirection: "row",
								gap: spacing.xs,
								marginTop: 4,
								flexWrap: "wrap",
							}}
						>
							<Badge label={pest.kind} color={KIND_COLOR[pest.kind]} small />
							<Badge label={pest.severity} color={severityColor} small />
						</View>
						{pest.affected_crops?.length ? (
							<Text size="xs" tone="muted" style={{ marginTop: 4 }}>
								Affects: {pest.affected_crops.slice(0, 3).join(", ")}
								{pest.affected_crops.length > 3
									? ` +${pest.affected_crops.length - 3}`
									: ""}
							</Text>
						) : null}
					</View>
				</View>
			</Card>
		</Link>
	);
}

import type { ReactNode } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { colors, spacing } from "@/constants/theme";
import { Text } from "./text";

export function FilterChip({
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

export function FilterRow({ children }: { children: ReactNode }) {
	return (
		<ScrollView
			horizontal
			showsHorizontalScrollIndicator={false}
			style={{ flexGrow: 0, flexShrink: 0 }}
			contentContainerStyle={{
				flexDirection: "row",
				alignItems: "center",
				gap: spacing.xs,
				paddingHorizontal: spacing.md,
				paddingVertical: spacing.xs,
			}}
		>
			{children}
		</ScrollView>
	);
}

export function FilterRowInline({ children }: { children: ReactNode }) {
	return (
		<View
			style={{
				flexDirection: "row",
				flexWrap: "wrap",
				gap: spacing.xs,
				rowGap: spacing.xs,
			}}
		>
			{children}
		</View>
	);
}

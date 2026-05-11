import type { ReactNode } from "react";
import { Pressable, View, type ViewProps } from "react-native";
import { spacing, useThemeColors } from "@/constants/theme";

interface CardProps extends ViewProps {
	children: ReactNode;
	variant?: "default" | "outlined";
	onPress?: () => void;
}

export function Card({
	children,
	variant = "default",
	onPress,
	style,
	...props
}: CardProps) {
	const colors = useThemeColors();
	const base = (
		<View
			style={[
				{
					overflow: "hidden",
					borderRadius: 16,
					borderWidth: 1,
					borderColor:
						variant === "outlined" ? colors.borderStrong : colors.border,
					backgroundColor: colors.surface,
					shadowColor: "#000",
					shadowOpacity: 0.04,
					shadowRadius: 6,
					shadowOffset: { width: 0, height: 1 },
					elevation: 1,
				},
				style,
			]}
			{...props}
		>
			<View style={{ padding: spacing.md }}>{children}</View>
		</View>
	);
	if (onPress) {
		return (
			<Pressable
				onPress={onPress}
				style={({ pressed }) => ({
					opacity: pressed ? 0.92 : 1,
					transform: [{ scale: pressed ? 0.99 : 1 }],
				})}
			>
				{base}
			</Pressable>
		);
	}
	return base;
}

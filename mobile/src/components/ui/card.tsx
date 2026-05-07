import { BlurView } from "expo-blur";
import type { ReactNode } from "react";
import { Platform, Pressable, View, type ViewProps } from "react-native";
import { colors, spacing } from "@/constants/theme";

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
	const base = (
		<View
			style={[
				{
					overflow: "hidden",
					borderRadius: 16,
					borderWidth: 1,
					borderColor:
						variant === "outlined" ? colors.borderStrong : colors.border,
					backgroundColor:
						Platform.OS === "web" || variant === "outlined"
							? colors.surfaceVariant
							: undefined,
				},
				style,
			]}
			{...props}
		>
			{Platform.OS !== "web" && variant === "default" ? (
				<BlurView
					intensity={25}
					tint="dark"
					style={{ position: "absolute", inset: 0 }}
				/>
			) : null}
			<View
				style={{
					position: "absolute",
					top: 0,
					left: 0,
					right: 0,
					bottom: 0,
					backgroundColor: colors.cardGlassOverlay,
				}}
			/>
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

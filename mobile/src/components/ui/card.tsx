import { BlurView } from "expo-blur";
import type { ReactNode } from "react";
import { Platform, Pressable, View, type ViewProps } from "react-native";
import { colors } from "@/constants/theme";
import { cn } from "@/lib/utils";

interface CardProps extends ViewProps {
	children: ReactNode;
	variant?: "default" | "outlined";
	onPress?: () => void;
	className?: string;
}

export function Card({
	children,
	variant = "default",
	onPress,
	className,
	style,
	...props
}: CardProps) {
	const base = (
		<View
			className={cn("overflow-hidden rounded-2xl border", className)}
			style={[
				{
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
			<View style={{ padding: 16 }}>{children}</View>
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

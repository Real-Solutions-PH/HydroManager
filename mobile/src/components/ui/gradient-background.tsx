import { LinearGradient } from "expo-linear-gradient";
import type { ReactNode } from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
	gradientEnd,
	gradientLocations,
	gradientStart,
	gradientStops,
	spacing,
} from "@/constants/theme";

interface Props {
	children: ReactNode;
	withInsets?: boolean;
}

export function GradientBackground({ children, withInsets = true }: Props) {
	const insets = useSafeAreaInsets();
	return (
		<View className="flex-1">
			<LinearGradient
				colors={
					gradientStops as unknown as readonly [string, string, ...string[]]
				}
				locations={
					gradientLocations as unknown as readonly [number, number, ...number[]]
				}
				start={gradientStart}
				end={gradientEnd}
				style={{
					position: "absolute",
					top: 0,
					left: 0,
					right: 0,
					bottom: 0,
				}}
			/>
			<LinearGradient
				colors={
					["rgba(38,77,56,0.5)", "rgba(26,60,40,0.2)", "transparent"] as const
				}
				style={{
					position: "absolute",
					top: 0,
					left: 0,
					right: 0,
					height: "55%",
				}}
			/>
			<View
				style={{
					flex: 1,
					paddingTop: withInsets ? insets.top + spacing.sm : 0,
				}}
			>
				{children}
			</View>
		</View>
	);
}

import type { ReactNode } from "react";
import { View, type ViewStyle } from "react-native";
import { Text } from "@/components/ui/text";
import { radii, spacing, useThemeColors } from "@/constants/theme";

type SpeechBubbleTone = "default" | "onBrand";

interface SpeechBubbleProps {
	title: string;
	subtitle?: ReactNode;
	style?: ViewStyle;
	tailOffset?: number;
	tone?: SpeechBubbleTone;
}

const TAIL_HALF = 8;
const TAIL_WIDTH = 10;

export function SpeechBubble({
	title,
	subtitle,
	style,
	tailOffset,
	tone = "default",
}: SpeechBubbleProps) {
	const colors = useThemeColors();
	const isOnBrand = tone === "onBrand";
	const bubbleBg = isOnBrand ? "rgba(255, 255, 255, 0.14)" : colors.glass;
	const bubbleBorder = isOnBrand ? "rgba(255, 255, 255, 0.18)" : colors.border;
	const titleColor = isOnBrand ? "#FFFFFF" : colors.text;
	const subtitleColor = isOnBrand
		? "rgba(255, 255, 255, 0.78)"
		: colors.textMuted;
	return (
		<View
			style={[
				{
					flex: 1,
					flexDirection: "row",
					alignItems: tailOffset === undefined ? "center" : "flex-start",
				},
				style,
			]}
		>
			<View
				style={{
					width: 0,
					height: 0,
					marginTop: tailOffset,
					borderTopWidth: TAIL_HALF,
					borderBottomWidth: TAIL_HALF,
					borderRightWidth: TAIL_WIDTH,
					borderTopColor: "transparent",
					borderBottomColor: "transparent",
					borderRightColor: bubbleBg,
				}}
			/>
			<View
				style={{
					flex: 1,
					marginLeft: -1,
					padding: spacing.md,
					borderRadius: radii.lg,
					backgroundColor: bubbleBg,
					borderWidth: 1,
					borderColor: bubbleBorder,
					gap: 2,
				}}
			>
				<Text weight="bold" size="md" style={{ color: titleColor }}>
					{title}
				</Text>
				{typeof subtitle === "string" ? (
					<Text size="sm" style={{ color: subtitleColor }}>
						{subtitle}
					</Text>
				) : (
					subtitle
				)}
			</View>
		</View>
	);
}

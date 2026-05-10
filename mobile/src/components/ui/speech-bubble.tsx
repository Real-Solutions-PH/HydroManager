import type { ReactNode } from "react";
import { View, type ViewStyle } from "react-native";
import { Text } from "@/components/ui/text";
import { colors, radii, spacing } from "@/constants/theme";

interface SpeechBubbleProps {
	title: string;
	subtitle?: ReactNode;
	style?: ViewStyle;
	tailOffset?: number;
}

const TAIL_HALF = 8;
const TAIL_WIDTH = 10;

export function SpeechBubble({
	title,
	subtitle,
	style,
	tailOffset,
}: SpeechBubbleProps) {
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
					borderRightColor: colors.glass,
				}}
			/>
			<View
				style={{
					flex: 1,
					marginLeft: -1,
					padding: spacing.md,
					borderRadius: radii.lg,
					backgroundColor: colors.glass,
					borderWidth: 1,
					borderColor: colors.border,
					gap: 2,
				}}
			>
				<Text weight="bold" size="md">
					{title}
				</Text>
				{typeof subtitle === "string" ? (
					<Text size="sm" tone="muted">
						{subtitle}
					</Text>
				) : (
					subtitle
				)}
			</View>
		</View>
	);
}

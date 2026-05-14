import { Text, View } from "react-native";
import { spacing, useBadgeTextColor } from "@/constants/theme";

interface BadgeProps {
	label: string;
	color?: string;
	bg?: string;
	textColor?: string;
	small?: boolean;
}

export function Badge({
	label,
	color = "#FFFFFF",
	bg,
	textColor,
	small,
}: BadgeProps) {
	const tint = useBadgeTextColor();
	const backgroundColor = bg ?? `${color}26`;
	const resolvedText = textColor ?? tint(color);
	return (
		<View
			style={{
				backgroundColor,
				paddingHorizontal: spacing.sm,
				paddingVertical: spacing.xxs,
				borderRadius: 999,
				alignSelf: "flex-start",
			}}
		>
			<Text
				style={{
					color: resolvedText,
					fontSize: small ? 11 : 13,
					fontWeight: "600",
				}}
			>
				{label}
			</Text>
		</View>
	);
}

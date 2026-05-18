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
	const isHex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(color);
	const backgroundColor = bg ?? (isHex ? `${color}26` : "rgba(128,128,128,0.18)");
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

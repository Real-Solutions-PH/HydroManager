import { Text, View } from "react-native";
import { spacing } from "@/constants/theme";

interface BadgeProps {
	label: string;
	color?: string;
	bg?: string;
	small?: boolean;
}

export function Badge({ label, color = "#FFFFFF", bg, small }: BadgeProps) {
	const backgroundColor = bg ?? `${color}26`;
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
					color,
					fontSize: small ? 11 : 13,
					fontWeight: "600",
				}}
			>
				{label}
			</Text>
		</View>
	);
}

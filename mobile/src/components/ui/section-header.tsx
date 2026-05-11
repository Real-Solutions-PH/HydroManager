import { Text, View } from "react-native";
import { spacing, useThemeColors } from "@/constants/theme";

interface Props {
	title: string;
	subtitle?: string;
}

export function SectionHeader({ title, subtitle }: Props) {
	const colors = useThemeColors();
	return (
		<View
			style={{
				paddingHorizontal: spacing.md,
				paddingTop: spacing.lg,
				paddingBottom: spacing.xs,
			}}
		>
			<Text style={{ fontSize: 17, fontWeight: "700", color: colors.text }}>
				{title}
			</Text>
			{subtitle ? (
				<Text
					style={{
						fontSize: 13,
						color: colors.textMuted,
						marginTop: spacing.xxs,
					}}
				>
					{subtitle}
				</Text>
			) : null}
		</View>
	);
}

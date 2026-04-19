import { colors } from "@/constants/theme";
import { Text, View } from "react-native";

interface Props {
	title: string;
	subtitle?: string;
}

export function SectionHeader({ title, subtitle }: Props) {
	return (
		<View style={{ paddingHorizontal: 16, paddingTop: 20, paddingBottom: 8 }}>
			<Text style={{ fontSize: 17, fontWeight: "700", color: colors.text }}>
				{title}
			</Text>
			{subtitle ? (
				<Text
					style={{
						fontSize: 13,
						color: colors.textMuted,
						marginTop: 4,
					}}
				>
					{subtitle}
				</Text>
			) : null}
		</View>
	);
}

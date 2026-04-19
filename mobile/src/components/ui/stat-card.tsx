import { colors } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";

interface Props {
	label: string;
	value: number | string;
	icon?: React.ComponentProps<typeof Ionicons>["name"];
	accent?: string;
	onPress?: () => void;
}

export function StatCard({ label, value, icon, accent, onPress }: Props) {
	const body = (
		<View
			style={{
				flex: 1,
				minWidth: "45%",
				backgroundColor: colors.surfaceVariant,
				borderWidth: 1,
				borderColor: colors.border,
				borderRadius: 16,
				padding: 16,
			}}
		>
			<View
				style={{
					flexDirection: "row",
					alignItems: "center",
					justifyContent: "space-between",
				}}
			>
				<Text
					style={{
						fontSize: 11,
						fontWeight: "500",
						color: colors.textMuted,
						textTransform: "uppercase",
						letterSpacing: 0.5,
					}}
				>
					{label}
				</Text>
				{icon ? (
					<Ionicons name={icon} size={18} color={accent ?? colors.textMuted} />
				) : null}
			</View>
			<Text
				style={{
					marginTop: 8,
					fontSize: 32,
					fontWeight: "700",
					color: accent ?? colors.text,
				}}
			>
				{value}
			</Text>
		</View>
	);
	if (onPress) {
		return (
			<Pressable
				onPress={onPress}
				style={({ pressed }) => ({
					flex: 1,
					minWidth: "45%",
					opacity: pressed ? 0.92 : 1,
					transform: [{ scale: pressed ? 0.99 : 1 }],
				})}
			>
				{body}
			</Pressable>
		);
	}
	return body;
}

import { View } from "react-native";
import { Text } from "@/components/ui/text";
import { spacing, useThemeColors } from "@/constants/theme";
import { useNetworkStore } from "@/stores/network-store";

export function OfflineBanner() {
	const isConnected = useNetworkStore((s) => s.isConnected);
	const isWifi = useNetworkStore((s) => s.isWifi);
	const colors = useThemeColors();

	if (isWifi) return null;

	return (
		<View
			style={{
				paddingHorizontal: spacing.md,
				paddingVertical: spacing.xs,
				backgroundColor: colors.warningLight,
			}}
		>
			<Text size="xs" style={{ color: colors.warning, textAlign: "center" }}>
				{isConnected
					? "On cellular — sync paused (WiFi only)"
					: "Offline — changes saved locally"}
			</Text>
		</View>
	);
}

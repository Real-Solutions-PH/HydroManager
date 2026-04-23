import { View } from "react-native";
import { Text } from "@/components/ui/text";
import { colors, spacing } from "@/constants/theme";
import { useNetworkStore } from "@/stores/network-store";

export function OfflineBanner() {
	const isConnected = useNetworkStore((s) => s.isConnected);
	const isWifi = useNetworkStore((s) => s.isWifi);

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
					? "On cellular \u2014 sync paused (WiFi only)"
					: "Offline \u2014 changes saved locally"}
			</Text>
		</View>
	);
}

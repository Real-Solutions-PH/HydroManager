import { View } from "react-native";
import { Text } from "@/components/ui/text";
import { colors } from "@/constants/theme";

interface Props {
	used: number;
	free: number;
	label?: string;
}

export function SlotMeter({ used, free, label = "Slots" }: Props) {
	const total = Math.max(free, 0);
	const safeUsed = Math.max(used, 0);
	const ratio = total === 0 ? 0 : Math.min(safeUsed / total, 1);
	const pct = Math.round(ratio * 100);
	const over = safeUsed > total;

	const barColor = over
		? colors.error
		: ratio >= 0.85
			? colors.warning
			: colors.primaryLight;

	return (
		<View style={{ gap: 6 }}>
			<View
				style={{
					flexDirection: "row",
					justifyContent: "space-between",
					alignItems: "center",
				}}
			>
				<Text size="xs" weight="semibold" tone="muted">
					{label}
				</Text>
				<Text
					size="xs"
					weight="semibold"
					style={{ color: over ? colors.error : colors.textSecondary }}
				>
					{safeUsed} / {total} {total > 0 ? `· ${pct}%` : ""}
				</Text>
			</View>
			<View
				style={{
					height: 8,
					borderRadius: 999,
					backgroundColor: colors.surfaceVariant,
					overflow: "hidden",
				}}
			>
				<View
					style={{
						width: `${over ? 100 : pct}%`,
						height: "100%",
						backgroundColor: barColor,
					}}
				/>
			</View>
			{over ? (
				<Text size="xs" weight="semibold" style={{ color: colors.error }}>
					Exceeds available slots ({total})
				</Text>
			) : null}
		</View>
	);
}

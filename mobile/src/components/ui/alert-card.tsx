import { Ionicons } from "@expo/vector-icons";
import { Pressable, View } from "react-native";
import { Card } from "@/components/ui/card";
import { Text } from "@/components/ui/text";
import { colors, radii, spacing } from "@/constants/theme";

export type AlertSeverity = "urgent" | "low" | "info";

interface AlertCardProps {
	severity: AlertSeverity;
	icon: React.ComponentProps<typeof Ionicons>["name"];
	title: string;
	subtitle: string;
	pillLabel?: string;
	onPress?: () => void;
	chevron?: boolean;
}

const SEVERITY = {
	urgent: {
		border: colors.error,
		pillBg: colors.errorLight,
		pillText: colors.error,
		iconBg: colors.errorLight,
		iconColor: colors.error,
	},
	low: {
		border: colors.warning,
		pillBg: colors.warningLight,
		pillText: colors.warning,
		iconBg: colors.warningLight,
		iconColor: colors.warning,
	},
	info: {
		border: colors.info,
		pillBg: colors.infoLight,
		pillText: colors.info,
		iconBg: colors.infoLight,
		iconColor: colors.info,
	},
} as const;

export function AlertCard({
	severity,
	icon,
	title,
	subtitle,
	pillLabel,
	onPress,
	chevron,
}: AlertCardProps) {
	const s = SEVERITY[severity];

	const body = (
		<Card
			style={{
				borderLeftWidth: 4,
				borderLeftColor: s.border,
			}}
		>
			<View
				style={{
					flexDirection: "row",
					alignItems: "center",
					gap: spacing.sm,
				}}
			>
				<View
					style={{
						width: 40,
						height: 40,
						borderRadius: radii.md,
						backgroundColor: s.iconBg,
						alignItems: "center",
						justifyContent: "center",
					}}
				>
					<Ionicons name={icon} size={20} color={s.iconColor} />
				</View>
				<View style={{ flex: 1 }}>
					<Text weight="semibold">{title}</Text>
					<Text size="sm" tone="muted">
						{subtitle}
					</Text>
				</View>
				{pillLabel ? (
					<View
						style={{
							paddingHorizontal: spacing.sm,
							paddingVertical: 4,
							borderRadius: radii.full,
							backgroundColor: s.pillBg,
						}}
					>
						<Text size="xs" weight="bold" style={{ color: s.pillText }}>
							{pillLabel}
						</Text>
					</View>
				) : null}
				{chevron ? (
					<Ionicons
						name="chevron-forward"
						size={18}
						color={colors.textMuted}
					/>
				) : null}
			</View>
		</Card>
	);

	if (onPress) {
		return (
			<Pressable
				onPress={onPress}
				accessibilityRole="button"
				style={({ pressed }) => ({
					opacity: pressed ? 0.92 : 1,
				})}
			>
				{body}
			</Pressable>
		);
	}
	return body;
}

import { Ionicons } from "@expo/vector-icons";
import { View } from "react-native";
import { Text } from "@/components/ui/text";
import { radii, spacing, useThemeColors } from "@/constants/theme";

export interface PhaseSegment {
	key: string;
	label: string;
	count: number;
	color: string;
	icon: React.ComponentProps<typeof Ionicons>["name"];
}

interface Props {
	title: string;
	phases: PhaseSegment[];
	total: number;
	totalLabel: string;
	emptyLabel?: string;
}

const BAR_HEIGHT = 8;
const BAR_GAP = 3;

export function PhaseProgressionCard({
	title,
	phases,
	total,
	totalLabel,
	emptyLabel,
}: Props) {
	const colors = useThemeColors();
	const sum = phases.reduce((a, b) => a + b.count, 0);
	const allEmpty = sum === 0;

	return (
		<View style={{ paddingHorizontal: spacing.md }}>
			<View
				style={{
					backgroundColor: colors.surface,
					borderRadius: radii.lg,
					borderWidth: 1,
					borderColor: colors.border,
					padding: spacing.md,
					gap: spacing.md,
				}}
			>
				<View
					style={{
						flexDirection: "row",
						justifyContent: "space-between",
						alignItems: "center",
					}}
				>
					<Text weight="bold" size="lg">
						{title}
					</Text>
					<View style={{ alignItems: "flex-end" }}>
						<Text size="lg" weight="bold">
							{total}
						</Text>
						<Text size="xs" tone="muted">
							{totalLabel}
						</Text>
					</View>
				</View>

				<View
					style={{
						flexDirection: "row",
						height: BAR_HEIGHT,
						gap: BAR_GAP,
					}}
				>
					{phases.map((p) => {
						const ratio = sum > 0 ? p.count / sum : 0;
						return (
							<View
								key={p.key}
								style={{
									flex: Math.max(ratio, 0.04),
									backgroundColor: p.count > 0 ? p.color : colors.borderLight,
									borderRadius: radii.full,
								}}
							/>
						);
					})}
				</View>

				<View style={{ flexDirection: "row", gap: spacing.xs }}>
					{phases.map((p) => (
						<View key={p.key} style={{ flex: 1, alignItems: "center", gap: 4 }}>
							<View
								style={{
									width: 36,
									height: 36,
									borderRadius: radii.md,
									backgroundColor: `${p.color}26`,
									alignItems: "center",
									justifyContent: "center",
								}}
							>
								<Ionicons name={p.icon} size={18} color={p.color} />
							</View>
							<Text size="lg" weight="bold">
								{p.count}
							</Text>
							<Text
								size="xs"
								tone="muted"
								numberOfLines={2}
								style={{ textAlign: "center" }}
							>
								{p.label}
							</Text>
						</View>
					))}
				</View>

				{allEmpty ? (
					<Text size="sm" tone="muted" style={{ textAlign: "center" }}>
						{emptyLabel ?? "No data"}
					</Text>
				) : null}
			</View>
		</View>
	);
}

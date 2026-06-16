import { Ionicons } from "@expo/vector-icons";
import { Modal, Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Text } from "@/components/ui/text";
import { radii, spacing, useThemeColors } from "@/constants/theme";

export interface MoreSheetLink {
	href: string;
	icon: React.ComponentProps<typeof Ionicons>["name"];
	title: string;
	subtitle: string;
}

interface MoreSheetProps {
	open: boolean;
	links: MoreSheetLink[];
	activeHref?: string | null;
	onClose: () => void;
	onSelect: (href: string) => void;
}

export function MoreSheet({
	open,
	links,
	activeHref,
	onClose,
	onSelect,
}: MoreSheetProps) {
	const colors = useThemeColors();
	const insets = useSafeAreaInsets();

	return (
		<Modal
			visible={open}
			transparent
			animationType="slide"
			onRequestClose={onClose}
			statusBarTranslucent
		>
			<Pressable style={styles.backdrop} onPress={onClose}>
				{/* Stop propagation so taps inside the sheet don't dismiss it. */}
				<Pressable
					style={[
						styles.sheet,
						{
							backgroundColor: colors.bgMid,
							borderColor: colors.border,
							paddingBottom: (insets.bottom || spacing.md) + spacing.md,
						},
					]}
					onPress={() => {}}
				>
					<View style={[styles.handle, { backgroundColor: colors.border }]} />
					<Text size="lg" weight="bold" style={{ marginBottom: spacing.xs }}>
						More
					</Text>
					<View style={{ gap: spacing.sm }}>
						{links.map((link) => {
							const isActive = activeHref === link.href;
							return (
								<Pressable
									key={link.href}
									onPress={() => onSelect(link.href)}
									style={[
										styles.row,
										{
											borderColor: isActive ? colors.border : "transparent",
											backgroundColor: isActive
												? "rgba(255,255,255,0.06)"
												: "transparent",
										},
									]}
								>
									<View
										style={[styles.iconBox, { backgroundColor: colors.glass }]}
									>
										<Ionicons
											name={link.icon}
											size={22}
											color={colors.primary}
										/>
									</View>
									<View style={{ flex: 1 }}>
										<Text size="md" weight="bold">
											{link.title}
										</Text>
										<Text size="xs" tone="muted">
											{link.subtitle}
										</Text>
									</View>
									<Ionicons
										name="chevron-forward"
										size={20}
										color={colors.textMuted}
									/>
								</Pressable>
							);
						})}
					</View>
				</Pressable>
			</Pressable>
		</Modal>
	);
}

const styles = StyleSheet.create({
	backdrop: {
		flex: 1,
		justifyContent: "flex-end",
		backgroundColor: "rgba(0,0,0,0.45)",
	},
	sheet: {
		borderTopLeftRadius: radii.xxl,
		borderTopRightRadius: radii.xxl,
		borderWidth: 1,
		paddingTop: spacing.sm,
		paddingHorizontal: spacing.md,
		gap: spacing.sm,
	},
	handle: {
		alignSelf: "center",
		width: 40,
		height: 4,
		borderRadius: 2,
		marginBottom: spacing.sm,
	},
	row: {
		flexDirection: "row",
		alignItems: "center",
		gap: spacing.md,
		padding: spacing.sm,
		borderRadius: radii.lg,
		borderWidth: 1,
	},
	iconBox: {
		width: 44,
		height: 44,
		borderRadius: radii.lg,
		alignItems: "center",
		justifyContent: "center",
	},
});

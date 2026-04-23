import type { LucideIcon } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
	useAnimatedStyle,
	useSharedValue,
	withSequence,
	withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, radii, spacing } from "@/constants/theme";

export interface InteractiveMenuItem {
	key: string;
	label: string;
	icon: LucideIcon;
	route?: string;
}

export interface InteractiveMenuProps {
	items: InteractiveMenuItem[];
	activeKey: string;
	onSelect: (key: string, route?: string) => void;
	accentColor?: string;
}

const DEFAULT_ACCENT = colors.accent;
const ICON_SIZE = 22;
const LABEL_ANIM_MS = 220;

interface MenuItemProps {
	item: InteractiveMenuItem;
	isActive: boolean;
	accentColor: string;
	onPress: () => void;
}

function MenuItem({ item, isActive, accentColor, onPress }: MenuItemProps) {
	const [labelWidth, setLabelWidth] = useState(0);
	const bounce = useSharedValue(0);
	const progress = useSharedValue(isActive ? 1 : 0);
	const measuredRef = useRef(false);

	useEffect(() => {
		progress.value = withTiming(isActive ? 1 : 0, { duration: LABEL_ANIM_MS });
	}, [isActive, progress]);

	const handlePress = () => {
		bounce.value = withSequence(
			withTiming(-4, { duration: 90 }),
			withTiming(0, { duration: 90 }),
			withTiming(-2, { duration: 80 }),
			withTiming(0, { duration: 80 }),
		);
		onPress();
	};

	const iconStyle = useAnimatedStyle(() => ({
		transform: [{ translateY: bounce.value }],
	}));

	const labelStyle = useAnimatedStyle(() => ({
		opacity: progress.value,
		maxWidth: progress.value * (labelWidth || 120),
		marginLeft: progress.value * 6,
	}));

	const underlineStyle = useAnimatedStyle(() => ({
		width: progress.value * labelWidth,
		opacity: progress.value,
	}));

	const Icon = item.icon;
	const iconColor = isActive ? accentColor : colors.textMuted;

	return (
		<Pressable
			onPress={handlePress}
			style={styles.item}
			accessibilityRole="tab"
			accessibilityState={{ selected: isActive }}
			accessibilityLabel={item.label}
			hitSlop={8}
		>
			<View style={styles.itemRow}>
				<Animated.View style={iconStyle}>
					<Icon size={ICON_SIZE} color={iconColor} strokeWidth={2.2} />
				</Animated.View>
				<Animated.View style={[styles.labelWrap, labelStyle]}>
					<Text
						numberOfLines={1}
						onLayout={(e) => {
							if (!measuredRef.current) {
								measuredRef.current = true;
								setLabelWidth(Math.ceil(e.nativeEvent.layout.width));
							}
						}}
						style={[styles.label, { color: accentColor }]}
					>
						{item.label}
					</Text>
				</Animated.View>
			</View>
			<Animated.View
				style={[
					styles.underline,
					{ backgroundColor: accentColor },
					underlineStyle,
				]}
			/>
			{labelWidth === 0 && (
				<Text
					style={styles.measure}
					onLayout={(e) => {
						if (!measuredRef.current) {
							measuredRef.current = true;
							setLabelWidth(Math.ceil(e.nativeEvent.layout.width));
						}
					}}
				>
					{item.label}
				</Text>
			)}
		</Pressable>
	);
}

export function InteractiveMenu({
	items,
	activeKey,
	onSelect,
	accentColor = DEFAULT_ACCENT,
}: InteractiveMenuProps) {
	const insets = useSafeAreaInsets();

	return (
		<View
			pointerEvents="box-none"
			style={[
				styles.wrapper,
				{ bottom: (insets.bottom || spacing.sm) + spacing.sm },
			]}
		>
			<View style={styles.bar}>
				{items.map((item) => (
					<MenuItem
						key={item.key}
						item={item}
						isActive={item.key === activeKey}
						accentColor={accentColor}
						onPress={() => onSelect(item.key, item.route)}
					/>
				))}
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	wrapper: {
		position: "absolute",
		left: spacing.md,
		right: spacing.md,
	},
	bar: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		backgroundColor: colors.tabBarBg,
		borderWidth: 1,
		borderColor: colors.border,
		borderRadius: radii.xxl,
		paddingVertical: spacing.sm,
		paddingHorizontal: spacing.sm,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 8 },
		shadowOpacity: 0.28,
		shadowRadius: 16,
		elevation: 12,
	},
	item: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		paddingVertical: spacing.xs,
		paddingHorizontal: spacing.xs,
	},
	itemRow: {
		flexDirection: "row",
		alignItems: "center",
	},
	labelWrap: {
		overflow: "hidden",
	},
	label: {
		fontSize: 13,
		fontWeight: "600",
		textTransform: "capitalize",
	},
	underline: {
		height: 2,
		borderRadius: 1,
		marginTop: 4,
	},
	measure: {
		position: "absolute",
		opacity: 0,
		fontSize: 13,
		fontWeight: "600",
	},
});

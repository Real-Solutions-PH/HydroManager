import type { LucideIcon } from "lucide-react-native";
import { useEffect } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Animated, {
	interpolateColor,
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
const ANIM_MS = 220;
const MENU_HEIGHT = 84;
const MENU_BREATHING = spacing.md;

export function useTabBarClearance() {
	const insets = useSafeAreaInsets();
	return insets.bottom + spacing.sm * 2 + MENU_HEIGHT + MENU_BREATHING;
}

interface MenuItemProps {
	item: InteractiveMenuItem;
	isActive: boolean;
	accentColor: string;
	onPress: () => void;
}

function MenuItem({ item, isActive, accentColor, onPress }: MenuItemProps) {
	const bounce = useSharedValue(0);
	const progress = useSharedValue(isActive ? 1 : 0);

	useEffect(() => {
		progress.value = withTiming(isActive ? 1 : 0, { duration: ANIM_MS });
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

	const iconBounceStyle = useAnimatedStyle(() => ({
		transform: [{ translateY: bounce.value }],
	}));

	const bubbleStyle = useAnimatedStyle(() => ({
		borderColor: interpolateColor(
			progress.value,
			[0, 1],
			["rgba(255,255,255,0)", colors.border],
		),
		backgroundColor: interpolateColor(
			progress.value,
			[0, 1],
			["rgba(255,255,255,0)", "rgba(255,255,255,0.06)"],
		),
	}));

	const labelStyle = useAnimatedStyle(() => ({
		color: interpolateColor(
			progress.value,
			[0, 1],
			[colors.textMuted, colors.text],
		),
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
			<Animated.View style={[styles.bubble, bubbleStyle]}>
				<Animated.View style={iconBounceStyle}>
					<Icon size={ICON_SIZE} color={iconColor} strokeWidth={2.2} />
				</Animated.View>
				<Animated.Text numberOfLines={1} style={[styles.label, labelStyle]}>
					{item.label}
				</Animated.Text>
			</Animated.View>
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
		paddingVertical: spacing.xxs,
		paddingHorizontal: spacing.xxs,
	},
	bubble: {
		alignItems: "center",
		justifyContent: "center",
		paddingHorizontal: spacing.sm,
		paddingVertical: spacing.xs,
		borderRadius: radii.md,
		borderWidth: 1,
	},
	label: {
		fontSize: 11,
		fontWeight: "500",
		marginTop: 4,
	},
});

import { useColorScheme } from "react-native";
import { useThemeStore } from "@/stores/theme-store";
import { tintForBadgeText } from "@/lib/utils";

export const lightColors = {
	primary: "#5C8A3A",
	primaryLight: "#8FBE5C",
	primaryDark: "#4A7028",
	primaryDeep: "#2F4A1A",
	accent: "#D49050",
	buttonSolidBg: "#5C8A3A",
	buttonSolidActive: "#4A7028",
	bg: "#FAFAFA",
	bgMid: "#F5F5F5",
	bgLight: "#EDEDED",
	headerBg: "#F5F5F5",
	surface: "#FFFFFF",
	surfaceVariant: "rgba(10, 10, 10, 0.04)",
	glass: "rgba(10, 10, 10, 0.06)",
	glassHover: "rgba(10, 10, 10, 0.10)",
	cardGlassOverlay: "rgba(10, 10, 10, 0.00)",
	text: "#0A0A0A",
	textSecondary: "rgba(10, 10, 10, 0.65)",
	textMuted: "rgba(10, 10, 10, 0.45)",
	textDisabled: "rgba(10, 10, 10, 0.30)",
	neutral: "#5C6660",
	placeholder: "rgba(10, 10, 10, 0.40)",
	border: "rgba(10, 10, 10, 0.10)",
	borderLight: "rgba(10, 10, 10, 0.06)",
	borderStrong: "rgba(10, 10, 10, 0.18)",
	borderInput: "rgba(10, 10, 10, 0.15)",
	borderError: "#C0392B",
	tabBarTopBorder: "rgba(10, 10, 10, 0.08)",
	tabBarBg: "rgba(255, 255, 255, 0.85)",
	success: "#5C8A3A",
	successLight: "rgba(92, 138, 58, 0.15)",
	warning: "#E0A040",
	warningLight: "rgba(224, 160, 64, 0.15)",
	error: "#C0392B",
	errorLight: "rgba(192, 57, 43, 0.12)",
	info: "#4FB8E8",
	infoLight: "rgba(79, 184, 232, 0.15)",
	salesAccent: "#D4A017",
	salesAccentLight: "rgba(212, 160, 23, 0.15)",
	restockAccent: "#A88500",
	restockAccentLight: "rgba(168, 133, 0, 0.15)",
} as const;

export const darkColors = {
	primary: "#8FBE5C",
	primaryLight: "#B8D67A",
	primaryDark: "#6B9A3D",
	primaryDeep: "#4A7028",
	accent: "#D49050",
	buttonSolidBg: "#5C8A3A",
	buttonSolidActive: "#4A7028",
	bg: "#0F0F0F",
	bgMid: "#171717",
	bgLight: "#262626",
	headerBg: "#171717",
	surface: "#1C1C1C",
	surfaceVariant: "rgba(250, 250, 250, 0.06)",
	glass: "rgba(250, 250, 250, 0.08)",
	glassHover: "rgba(250, 250, 250, 0.12)",
	cardGlassOverlay: "rgba(250, 250, 250, 0.00)",
	text: "#FAFAFA",
	textSecondary: "rgba(250, 250, 250, 0.72)",
	textMuted: "rgba(250, 250, 250, 0.50)",
	textDisabled: "rgba(250, 250, 250, 0.30)",
	neutral: "#B8C3BB",
	placeholder: "rgba(250, 250, 250, 0.40)",
	border: "rgba(250, 250, 250, 0.10)",
	borderLight: "rgba(250, 250, 250, 0.06)",
	borderStrong: "rgba(250, 250, 250, 0.15)",
	borderInput: "rgba(250, 250, 250, 0.15)",
	borderError: "#E05D4E",
	tabBarTopBorder: "rgba(250, 250, 250, 0.06)",
	tabBarBg: "rgba(10, 10, 10, 0.85)",
	success: "#8FBE5C",
	successLight: "rgba(143, 190, 92, 0.15)",
	warning: "#E0A040",
	warningLight: "rgba(224, 160, 64, 0.15)",
	error: "#E05D4E",
	errorLight: "rgba(224, 93, 78, 0.18)",
	info: "#4FB8E8",
	infoLight: "rgba(79, 184, 232, 0.15)",
	salesAccent: "#E8C04A",
	salesAccentLight: "rgba(232, 192, 74, 0.15)",
	restockAccent: "#E8DDA8",
	restockAccentLight: "rgba(232, 221, 168, 0.15)",
} as const;

export type ThemeColors = { readonly [K in keyof typeof darkColors]: string };

/**
 * Returns the active palette based on the stored theme mode.
 * mode === "system" follows OS color scheme; otherwise forces light/dark.
 * Defaults to dark when scheme is null/undefined and mode is "system".
 */
export function useThemeColors(): ThemeColors {
	const scheme = useColorScheme();
	const mode = useThemeStore((s) => s.mode);
	const active = mode === "system" ? scheme : mode;
	return active === "light" ? lightColors : darkColors;
}

/**
 * Returns the effective theme name ("light" | "dark") accounting for system mode.
 * Useful for StatusBar style, image variants, etc.
 */
export function useEffectiveTheme(): "light" | "dark" {
	const scheme = useColorScheme();
	const mode = useThemeStore((s) => s.mode);
	const active = mode === "system" ? scheme : mode;
	return active === "light" ? "light" : "dark";
}

/**
 * Returns a tinter that converts a brand hex color into a readable text color
 * against translucent same-hue badge backgrounds, adjusted for current theme.
 */
export function useBadgeTextColor(): (input: string) => string {
	const isDark = useEffectiveTheme() === "dark";
	return (input: string) => tintForBadgeText(input, isDark);
}

export const systemTypes = {
	NFT: { color: "#4FB8E8", bg: "rgba(79, 184, 232, 0.15)", icon: "water" },
	DFT: { color: "#8FBE5C", bg: "rgba(143, 190, 92, 0.15)", icon: "layers" },
	DutchBucket: {
		color: "#D49050",
		bg: "rgba(212, 144, 80, 0.15)",
		icon: "nutrition",
	},
	Kratky: {
		color: "#A66BC4",
		bg: "rgba(166, 107, 196, 0.15)",
		icon: "flask",
	},
	SNAP: {
		color: "#E0B23A",
		bg: "rgba(224, 178, 58, 0.15)",
		icon: "cloud",
	},
} as const;

export const inventoryCategoryMeta = {
	seeds: { color: "#8FBE5C", icon: "ellipse" },
	media: { color: "#D49050", icon: "layers" },
	nutrients: { color: "#4FB8E8", icon: "flask" },
	equipment: { color: "#E89AA5", icon: "construct" },
	packaging: { color: "#D4B85A", icon: "cube" },
	other: { color: "#9AA89E", icon: "ellipsis-horizontal" },
} as const;

export const produceStatusMeta = {
	ready: { color: "#5C8A3A", icon: "checkmark-circle", label: "Ready" },
	reserved: { color: "#D49050", icon: "time", label: "Reserved" },
	sold: { color: "rgba(128, 128, 128, 0.6)", icon: "cash", label: "Sold" },
} as const;

export const expiryStatusMeta = {
	ok: { color: "#5C8A3A", icon: "checkmark-circle", label: "OK" },
	warning: { color: "#E0A040", icon: "warning", label: "EXPIRES SOON" },
	expired: { color: "#C0392B", icon: "alert-circle", label: "EXPIRED" },
} as const;

export const spacing = {
	xxs: 4,
	xs: 8,
	sm: 12,
	md: 16,
	lg: 20,
	xl: 24,
	xxl: 32,
	xxxl: 40,
	jumbo: 48,
} as const;

export const radii = {
	sm: 8,
	md: 12,
	lg: 16,
	xl: 20,
	xxl: 24,
	full: 999,
} as const;

export const fontSize = {
	xs: 11,
	sm: 13,
	md: 15,
	lg: 17,
	xl: 20,
	xxl: 24,
	xxxl: 32,
} as const;

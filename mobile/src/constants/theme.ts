import { useColorScheme } from "react-native";
import { useThemeStore } from "@/stores/theme-store";

export const lightColors = {
	primary: "#5C8A3A",
	primaryLight: "#8FBE5C",
	primaryDark: "#4A7028",
	primaryDeep: "#2F4A1A",
	accent: "#D49050",
	buttonSolidBg: "#5C8A3A",
	buttonSolidActive: "#4A7028",
	bg: "#FFFFFF",
	bgMid: "#F0F4EB",
	bgLight: "#E2EBD3",
	headerBg: "#D9E5C7",
	surface: "#FAFAFA",
	surfaceVariant: "rgba(10, 10, 10, 0.04)",
	glass: "rgba(10, 10, 10, 0.06)",
	glassHover: "rgba(10, 10, 10, 0.10)",
	cardGlassOverlay: "rgba(10, 10, 10, 0.03)",
	text: "#0A0A0A",
	textSecondary: "rgba(10, 10, 10, 0.65)",
	textMuted: "rgba(10, 10, 10, 0.45)",
	textDisabled: "rgba(10, 10, 10, 0.30)",
	placeholder: "rgba(10, 10, 10, 0.40)",
	border: "rgba(10, 10, 10, 0.12)",
	borderLight: "rgba(10, 10, 10, 0.08)",
	borderStrong: "rgba(10, 10, 10, 0.18)",
	borderInput: "rgba(10, 10, 10, 0.15)",
	borderError: "#E89AA5",
	tabBarTopBorder: "rgba(10, 10, 10, 0.08)",
	tabBarBg: "rgba(255, 255, 255, 0.85)",
	success: "#5C8A3A",
	successLight: "rgba(92, 138, 58, 0.15)",
	warning: "#D49050",
	warningLight: "rgba(212, 144, 80, 0.15)",
	error: "#E89AA5",
	errorLight: "rgba(232, 154, 165, 0.15)",
	info: "#4FB8E8",
	infoLight: "rgba(79, 184, 232, 0.15)",
	salesAccent: "#E89AA5",
	salesAccentLight: "rgba(232, 154, 165, 0.15)",
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
	bg: "#0F1A0B",
	bgMid: "#1B2A14",
	bgLight: "#243A1B",
	headerBg: "#1B2412",
	surface: "#1B2A14",
	surfaceVariant: "rgba(250, 250, 250, 0.06)",
	glass: "rgba(250, 250, 250, 0.08)",
	glassHover: "rgba(250, 250, 250, 0.12)",
	cardGlassOverlay: "rgba(250, 250, 250, 0.04)",
	text: "#FAFAFA",
	textSecondary: "rgba(250, 250, 250, 0.72)",
	textMuted: "rgba(250, 250, 250, 0.50)",
	textDisabled: "rgba(250, 250, 250, 0.30)",
	placeholder: "rgba(250, 250, 250, 0.40)",
	border: "rgba(250, 250, 250, 0.12)",
	borderLight: "rgba(250, 250, 250, 0.08)",
	borderStrong: "rgba(250, 250, 250, 0.15)",
	borderInput: "rgba(250, 250, 250, 0.15)",
	borderError: "#E89AA5",
	tabBarTopBorder: "rgba(250, 250, 250, 0.06)",
	tabBarBg: "rgba(10, 10, 10, 0.85)",
	success: "#8FBE5C",
	successLight: "rgba(143, 190, 92, 0.15)",
	warning: "#D49050",
	warningLight: "rgba(212, 144, 80, 0.15)",
	error: "#E89AA5",
	errorLight: "rgba(232, 154, 165, 0.15)",
	info: "#4FB8E8",
	infoLight: "rgba(79, 184, 232, 0.15)",
	salesAccent: "#E89AA5",
	salesAccentLight: "rgba(232, 154, 165, 0.15)",
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

export const systemTypes = {
	NFT: { color: "#4FB8E8", bg: "rgba(79, 184, 232, 0.15)", icon: "water" },
	DFT: { color: "#8FBE5C", bg: "rgba(143, 190, 92, 0.15)", icon: "layers" },
	DutchBucket: {
		color: "#D49050",
		bg: "rgba(212, 144, 80, 0.15)",
		icon: "nutrition",
	},
	Kratky: {
		color: "#E89AA5",
		bg: "rgba(232, 154, 165, 0.15)",
		icon: "flask",
	},
	SNAP: {
		color: "#E8DDA8",
		bg: "rgba(232, 221, 168, 0.15)",
		icon: "cloud",
	},
} as const;

export const inventoryCategoryMeta = {
	seeds: { color: "#8FBE5C", icon: "ellipse" },
	media: { color: "#D49050", icon: "layers" },
	nutrients: { color: "#4FB8E8", icon: "flask" },
	equipment: { color: "#E89AA5", icon: "construct" },
	packaging: { color: "#E8DDA8", icon: "cube" },
	other: { color: "rgba(128, 128, 128, 0.6)", icon: "ellipsis-horizontal" },
} as const;

export const produceStatusMeta = {
	ready: { color: "#5C8A3A", icon: "checkmark-circle", label: "Ready" },
	reserved: { color: "#D49050", icon: "time", label: "Reserved" },
	sold: { color: "rgba(128, 128, 128, 0.6)", icon: "cash", label: "Sold" },
} as const;

export const expiryStatusMeta = {
	ok: { color: "#5C8A3A", icon: "checkmark-circle", label: "OK" },
	warning: { color: "#D49050", icon: "warning", label: "EXPIRES SOON" },
	expired: { color: "#E89AA5", icon: "alert-circle", label: "EXPIRED" },
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

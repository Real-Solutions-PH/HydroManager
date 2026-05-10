export const colors = {
	primary: "#8FBE5C",
	primaryLight: "#B8D67A",
	primaryDark: "#6B9A3D",
	primaryDeep: "#4A7028",
	accent: "#D49050",
	buttonSolidBg: "#5C8A3A",
	buttonSolidActive: "#4A7028",
	bg: "#1B2412",
	bgMid: "#2A3A1E",
	bgLight: "#3A4D2A",
	surface: "rgba(42, 58, 30, 0.85)",
	surfaceVariant: "rgba(255, 248, 220, 0.06)",
	glass: "rgba(255, 248, 220, 0.08)",
	glassHover: "rgba(255, 248, 220, 0.12)",
	cardGlassOverlay: "rgba(255, 248, 220, 0.04)",
	text: "#FAF6E8",
	textSecondary: "rgba(250, 246, 232, 0.72)",
	textMuted: "rgba(250, 246, 232, 0.5)",
	textDisabled: "rgba(250, 246, 232, 0.3)",
	placeholder: "rgba(250, 246, 232, 0.4)",
	border: "rgba(250, 246, 232, 0.12)",
	borderLight: "rgba(250, 246, 232, 0.08)",
	borderStrong: "rgba(250, 246, 232, 0.15)",
	borderInput: "rgba(250, 246, 232, 0.15)",
	borderError: "#E89AA5",
	tabBarTopBorder: "rgba(250, 246, 232, 0.06)",
	tabBarBg: "rgba(27, 36, 18, 0.6)",
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

export const gradientStops = [
	"#121A0B",
	"#1B2412",
	"#2A3A1E",
	"#1F2D14",
	"#121A0B",
] as const;

export const gradientLocations = [0, 0.25, 0.5, 0.75, 1];
export const gradientStart = { x: 0.2, y: 0 };
export const gradientEnd = { x: 0.8, y: 1 };

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
	other: { color: "rgba(250, 246, 232, 0.5)", icon: "ellipsis-horizontal" },
} as const;

export const produceStatusMeta = {
	ready: { color: "#8FBE5C", icon: "checkmark-circle", label: "Ready" },
	reserved: { color: "#D49050", icon: "time", label: "Reserved" },
	sold: { color: "rgba(250, 246, 232, 0.5)", icon: "cash", label: "Sold" },
} as const;

export const expiryStatusMeta = {
	ok: { color: "#8FBE5C", icon: "checkmark-circle", label: "OK" },
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

export const colors = {
	primary: "#4CAF50",
	primaryLight: "#66BB6A",
	primaryDark: "#388E3C",
	primaryDeep: "#2E7D32",
	accent: "#76FF03",
	buttonSolidBg: "#2D7D46",
	buttonSolidActive: "#256838",
	bg: "#0D2818",
	bgMid: "#1A3C28",
	bgLight: "#264D38",
	surface: "rgba(20, 60, 35, 0.85)",
	surfaceVariant: "rgba(255, 255, 255, 0.06)",
	glass: "rgba(255, 255, 255, 0.08)",
	glassHover: "rgba(255, 255, 255, 0.12)",
	cardGlassOverlay: "rgba(255, 255, 255, 0.04)",
	text: "#FFFFFF",
	textSecondary: "rgba(255, 255, 255, 0.7)",
	textMuted: "rgba(255, 255, 255, 0.5)",
	textDisabled: "rgba(255, 255, 255, 0.3)",
	placeholder: "rgba(255, 255, 255, 0.4)",
	border: "rgba(255, 255, 255, 0.12)",
	borderLight: "rgba(255, 255, 255, 0.08)",
	borderStrong: "rgba(255, 255, 255, 0.15)",
	borderInput: "rgba(255, 255, 255, 0.15)",
	borderError: "#F87171",
	tabBarTopBorder: "rgba(255, 255, 255, 0.06)",
	tabBarBg: "rgba(13, 40, 24, 0.55)",
	success: "#66BB6A",
	successLight: "rgba(102, 187, 106, 0.15)",
	warning: "#FFB74D",
	warningLight: "rgba(255, 183, 77, 0.15)",
	error: "#EF5350",
	errorLight: "rgba(239, 83, 80, 0.15)",
	info: "#42A5F5",
	infoLight: "rgba(66, 165, 245, 0.15)",
} as const;

export const gradientStops = [
	"#071A10",
	"#0D2818",
	"#1A3C28",
	"#0F2E1C",
	"#071A10",
] as const;

export const gradientLocations = [0, 0.25, 0.5, 0.75, 1];
export const gradientStart = { x: 0.2, y: 0 };
export const gradientEnd = { x: 0.8, y: 1 };

export const systemTypes = {
	NFT: { color: "#66BB6A", bg: "rgba(102, 187, 106, 0.15)", icon: "water" },
	DFT: { color: "#42A5F5", bg: "rgba(66, 165, 245, 0.15)", icon: "layers" },
	DutchBucket: {
		color: "#FFB74D",
		bg: "rgba(255, 183, 77, 0.15)",
		icon: "nutrition",
	},
	Kratky: {
		color: "#CE93D8",
		bg: "rgba(206, 147, 216, 0.15)",
		icon: "flask",
	},
	SNAP: {
		color: "#80DEEA",
		bg: "rgba(128, 222, 234, 0.15)",
		icon: "cloud",
	},
} as const;

export const inventoryCategoryMeta = {
	seeds: { color: "#66BB6A", icon: "ellipse" },
	media: { color: "#FFB74D", icon: "layers" },
	nutrients: { color: "#42A5F5", icon: "flask" },
	equipment: { color: "#CE93D8", icon: "construct" },
	packaging: { color: "#80DEEA", icon: "cube" },
	other: { color: "rgba(255, 255, 255, 0.5)", icon: "ellipsis-horizontal" },
} as const;

export const produceStatusMeta = {
	ready: { color: "#66BB6A", icon: "checkmark-circle", label: "Ready" },
	reserved: { color: "#FFB74D", icon: "time", label: "Reserved" },
	sold: { color: "rgba(255, 255, 255, 0.5)", icon: "cash", label: "Sold" },
} as const;

export const expiryStatusMeta = {
	ok: { color: "#66BB6A", icon: "checkmark-circle", label: "OK" },
	warning: { color: "#FFB74D", icon: "warning", label: "EXPIRES SOON" },
	expired: { color: "#EF5350", icon: "alert-circle", label: "EXPIRED" },
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

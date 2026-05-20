import { Ionicons } from "@expo/vector-icons";
import { ActivityIndicator, Pressable, View } from "react-native";
import Svg, {
	Circle,
	Defs,
	Ellipse,
	G,
	Line,
	LinearGradient as SvgLinearGradient,
	Path,
	Rect,
	Stop,
} from "react-native-svg";
import { Text } from "@/components/ui/text";
import { radii, spacing, useThemeColors } from "@/constants/theme";
import type { ClimateNormals } from "@/lib/hydro-api";

export interface TodayForecast {
	weather_code: number;
	precipitation_probability_max: number | null;
}

interface WeatherCardProps {
	data?: ClimateNormals;
	today?: TodayForecast;
	cityLabel?: string;
	loading?: boolean;
	error?: string | null;
	onRetry?: () => void;
}

export type SceneVariant =
	| "sun"
	| "partly"
	| "clouds"
	| "fog"
	| "drizzle"
	| "rain"
	| "storm"
	| "snow"
	| "clear";

export interface Scene {
	label: string;
	icon: React.ComponentProps<typeof Ionicons>["name"];
	top: string;
	mid: string;
	bottom: string;
	accent: string;
	variant: SceneVariant;
}

export function sceneFromCode(code: number | undefined): Scene {
	if (code == null)
		return {
			label: "—",
			icon: "partly-sunny",
			top: "#4A6680",
			mid: "#2E455C",
			bottom: "#14202E",
			accent: "#9FB8D0",
			variant: "clear",
		};
	if (code === 0)
		return {
			label: "Sunny",
			icon: "sunny",
			top: "#FFB347",
			mid: "#E86A3C",
			bottom: "#3D1E5E",
			accent: "#FFD580",
			variant: "sun",
		};
	if (code <= 2)
		return {
			label: "Mostly sunny",
			icon: "partly-sunny",
			top: "#74C0FC",
			mid: "#4D8DC4",
			bottom: "#1E3A5F",
			accent: "#FFD580",
			variant: "partly",
		};
	if (code === 3)
		return {
			label: "Cloudy",
			icon: "cloud",
			top: "#5B6B7C",
			mid: "#3C4A5A",
			bottom: "#1B2330",
			accent: "#C8D2DC",
			variant: "clouds",
		};
	if (code === 45 || code === 48)
		return {
			label: "Foggy",
			icon: "cloud-outline",
			top: "#8693A1",
			mid: "#5C6878",
			bottom: "#2E3640",
			accent: "#D8DEE5",
			variant: "fog",
		};
	if (code >= 51 && code <= 57)
		return {
			label: "Drizzle",
			icon: "rainy-outline",
			top: "#5A7E9C",
			mid: "#3A5A78",
			bottom: "#1A2A3A",
			accent: "#9CC6E8",
			variant: "drizzle",
		};
	if (code >= 61 && code <= 67)
		return {
			label: "Rainy",
			icon: "rainy",
			top: "#2E5C8A",
			mid: "#1B3A5C",
			bottom: "#0A1830",
			accent: "#7FB8E8",
			variant: "rain",
		};
	if (code >= 71 && code <= 77)
		return {
			label: "Snowy",
			icon: "snow",
			top: "#B8DFF0",
			mid: "#6FA3C0",
			bottom: "#2E4A60",
			accent: "#FFFFFF",
			variant: "snow",
		};
	if (code >= 80 && code <= 82)
		return {
			label: "Showers",
			icon: "rainy",
			top: "#2E5C8A",
			mid: "#1B3A5C",
			bottom: "#0A1830",
			accent: "#7FB8E8",
			variant: "rain",
		};
	if (code >= 85 && code <= 86)
		return {
			label: "Snow showers",
			icon: "snow",
			top: "#B8DFF0",
			mid: "#6FA3C0",
			bottom: "#2E4A60",
			accent: "#FFFFFF",
			variant: "snow",
		};
	if (code >= 95)
		return {
			label: "Thunderstorm",
			icon: "thunderstorm",
			top: "#3A2A52",
			mid: "#1F1430",
			bottom: "#07020F",
			accent: "#F4D03F",
			variant: "storm",
		};
	return {
		label: "Mixed",
		icon: "partly-sunny",
		top: "#4A6680",
		mid: "#2E455C",
		bottom: "#14202E",
		accent: "#9FB8D0",
		variant: "clear",
	};
}

interface MetaPill {
	label: string;
	color: string;
}

export function rainChanceMeta(pct: number | null | undefined): MetaPill {
	if (pct == null) return { label: "—", color: "rgba(255,255,255,0.55)" };
	if (pct < 10) return { label: "No rain", color: "#A3E8B0" };
	if (pct < 30) return { label: "Low", color: "#A3E8B0" };
	if (pct < 60) return { label: "Moderate", color: "#FFD580" };
	if (pct < 85) return { label: "High", color: "#FFB088" };
	return { label: "Very high", color: "#FF8A8A" };
}

export function humidityMeta(pct: number | null | undefined): MetaPill {
	if (pct == null) return { label: "—", color: "rgba(255,255,255,0.55)" };
	if (pct < 40) return { label: "Low", color: "#FFD580" };
	if (pct < 70) return { label: "Medium", color: "#A3E8B0" };
	return { label: "High", color: "#9CC6E8" };
}

export const TEXT_PRIMARY = "#FFFFFF";
export const TEXT_SECONDARY = "rgba(255,255,255,0.78)";
export const TEXT_MUTED = "rgba(255,255,255,0.58)";
export const GLASS_BG = "rgba(255,255,255,0.10)";
export const GLASS_BORDER = "rgba(255,255,255,0.18)";

export function fmtNum(v: number | null | undefined, digits = 0): string {
	if (v == null || Number.isNaN(v)) return "—";
	return v.toFixed(digits);
}

const VB_W = 360;
const VB_H = 220;

export function SceneBackground({ scene }: { scene: Scene }) {
	return (
		<Svg
			width="100%"
			height="100%"
			viewBox={`0 0 ${VB_W} ${VB_H}`}
			preserveAspectRatio="xMidYMid slice"
		>
			<Defs>
				<SvgLinearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
					<Stop offset="0" stopColor={scene.top} />
					<Stop offset="0.55" stopColor={scene.mid} />
					<Stop offset="1" stopColor={scene.bottom} />
				</SvgLinearGradient>
				<SvgLinearGradient id="scrim" x1="0" y1="1" x2="0" y2="0">
					<Stop offset="0" stopColor="#000" stopOpacity="0.45" />
					<Stop offset="1" stopColor="#000" stopOpacity="0" />
				</SvgLinearGradient>
			</Defs>

			<Rect x={0} y={0} width={VB_W} height={VB_H} fill="url(#sky)" />

			<SceneDecor scene={scene} />

			<Rect x={0} y={VB_H * 0.35} width={VB_W} height={VB_H} fill="url(#scrim)" />
		</Svg>
	);
}

function SceneDecor({ scene }: { scene: Scene }) {
	switch (scene.variant) {
		case "sun":
			return (
				<G opacity={0.95}>
					<Circle cx={300} cy={50} r={56} fill={scene.accent} opacity={0.18} />
					<Circle cx={300} cy={50} r={40} fill={scene.accent} opacity={0.28} />
					<Circle cx={300} cy={50} r={26} fill="#FFFFFF" opacity={0.85} />
					{[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
						<Line
							key={deg}
							x1={300}
							y1={50}
							x2={300 + 80 * Math.cos((deg * Math.PI) / 180)}
							y2={50 + 80 * Math.sin((deg * Math.PI) / 180)}
							stroke="#FFFFFF"
							strokeOpacity={0.12}
							strokeWidth={1}
						/>
					))}
				</G>
			);
		case "partly":
			return (
				<G>
					<Circle cx={310} cy={48} r={22} fill="#FFFFFF" opacity={0.85} />
					<Circle cx={310} cy={48} r={36} fill="#FFFFFF" opacity={0.15} />
					<Ellipse cx={220} cy={70} rx={56} ry={18} fill="#FFFFFF" opacity={0.22} />
					<Ellipse cx={250} cy={60} rx={38} ry={12} fill="#FFFFFF" opacity={0.28} />
				</G>
			);
		case "clouds":
			return (
				<G opacity={0.75}>
					<Ellipse cx={90} cy={60} rx={70} ry={20} fill="#FFFFFF" opacity={0.18} />
					<Ellipse cx={140} cy={50} rx={50} ry={16} fill="#FFFFFF" opacity={0.22} />
					<Ellipse cx={270} cy={70} rx={70} ry={20} fill="#FFFFFF" opacity={0.16} />
					<Ellipse cx={300} cy={58} rx={48} ry={14} fill="#FFFFFF" opacity={0.20} />
				</G>
			);
		case "fog":
			return (
				<G opacity={0.7}>
					{[40, 80, 120, 160].map((y) => (
						<Rect
							key={y}
							x={0}
							y={y}
							width={VB_W}
							height={6}
							fill="#FFFFFF"
							opacity={0.10}
						/>
					))}
				</G>
			);
		case "drizzle":
			return (
				<G>
					<Ellipse cx={250} cy={50} rx={70} ry={18} fill="#FFFFFF" opacity={0.18} />
					{Array.from({ length: 10 }).map((_, i) => {
						const x = 30 + i * 32;
						return (
							<Line
								key={i}
								x1={x}
								y1={90 + (i % 2) * 12}
								x2={x - 4}
								y2={105 + (i % 2) * 12}
								stroke={scene.accent}
								strokeOpacity={0.55}
								strokeWidth={1.5}
								strokeLinecap="round"
							/>
						);
					})}
				</G>
			);
		case "rain":
			return (
				<G>
					<Ellipse cx={120} cy={45} rx={80} ry={20} fill="#FFFFFF" opacity={0.18} />
					<Ellipse cx={260} cy={55} rx={70} ry={18} fill="#FFFFFF" opacity={0.14} />
					{Array.from({ length: 18 }).map((_, i) => {
						const x = 20 + i * 20 + (i % 3) * 4;
						const y = 80 + (i % 4) * 18;
						return (
							<Line
								key={i}
								x1={x}
								y1={y}
								x2={x - 8}
								y2={y + 24}
								stroke={scene.accent}
								strokeOpacity={0.65}
								strokeWidth={1.6}
								strokeLinecap="round"
							/>
						);
					})}
				</G>
			);
		case "storm":
			return (
				<G>
					<Ellipse cx={140} cy={50} rx={90} ry={22} fill="#FFFFFF" opacity={0.12} />
					<Ellipse cx={260} cy={60} rx={70} ry={18} fill="#FFFFFF" opacity={0.10} />
					<Path
						d="M180 70 L160 130 L185 130 L170 180 L215 110 L190 110 L210 70 Z"
						fill={scene.accent}
						opacity={0.95}
					/>
					{Array.from({ length: 12 }).map((_, i) => {
						const x = 40 + i * 26;
						const y = 100 + (i % 3) * 16;
						return (
							<Line
								key={i}
								x1={x}
								y1={y}
								x2={x - 6}
								y2={y + 18}
								stroke="#FFFFFF"
								strokeOpacity={0.35}
								strokeWidth={1.2}
								strokeLinecap="round"
							/>
						);
					})}
				</G>
			);
		case "snow":
			return (
				<G opacity={0.9}>
					{Array.from({ length: 22 }).map((_, i) => {
						const x = (i * 53) % VB_W;
						const y = 30 + ((i * 37) % 150);
						const r = 1.5 + ((i * 7) % 3);
						return (
							<Circle
								key={i}
								cx={x}
								cy={y}
								r={r}
								fill="#FFFFFF"
								opacity={0.65}
							/>
						);
					})}
				</G>
			);
		case "clear":
			return (
				<G>
					{Array.from({ length: 24 }).map((_, i) => {
						const x = (i * 71) % VB_W;
						const y = (i * 53) % 130;
						return (
							<Circle key={i} cx={x} cy={y} r={0.9} fill="#FFFFFF" opacity={0.45} />
						);
					})}
				</G>
			);
	}
}

export function WeatherCard({
	data,
	today,
	cityLabel,
	loading,
	error,
	onRetry,
}: WeatherCardProps) {
	const colors = useThemeColors();
	const scene = sceneFromCode(today?.weather_code);
	const rain = rainChanceMeta(today?.precipitation_probability_max ?? null);
	const humidity = humidityMeta(data?.humidity_pct_avg ?? null);

	return (
		<View style={{ paddingHorizontal: spacing.md }}>
			<View
				style={{
					overflow: "hidden",
					borderRadius: 16,
					borderWidth: 1,
					borderColor: colors.borderStrong,
					backgroundColor: scene.bottom,
					shadowColor: "#000",
					shadowOpacity: 0.18,
					shadowRadius: 12,
					shadowOffset: { width: 0, height: 4 },
					elevation: 4,
				}}
			>
				<View
					pointerEvents="none"
					style={{
						position: "absolute",
						top: 0,
						left: 0,
						right: 0,
						bottom: 0,
					}}
				>
					<SceneBackground scene={scene} />
				</View>

				<View style={{ padding: spacing.md }}>
					<View style={{ marginBottom: spacing.sm }}>
						<View
							style={{
								flexDirection: "row",
								alignItems: "center",
								gap: 6,
								marginBottom: 2,
							}}
						>
							<Ionicons name={scene.icon} size={14} color={scene.accent} />
							<Text
								size="xs"
								weight="bold"
								style={{
									color: TEXT_SECONDARY,
									letterSpacing: 1.2,
									textTransform: "uppercase",
								}}
							>
								{scene.label}
							</Text>
						</View>
						<Text size="lg" weight="bold" style={{ color: TEXT_PRIMARY }}>
							Grow Climate
						</Text>
						<Text size="xs" style={{ color: TEXT_MUTED }}>
							{cityLabel ?? "Locating…"}
						</Text>
					</View>

					{loading ? (
						<View
							style={{ paddingVertical: spacing.lg, alignItems: "center" }}
						>
							<ActivityIndicator color={TEXT_PRIMARY} />
						</View>
					) : error || !data ? (
						<View style={{ paddingVertical: spacing.md, gap: spacing.xs }}>
							<Text size="sm" style={{ color: TEXT_SECONDARY }}>
								{error ??
									"Enable location to see climate data for your grow site."}
							</Text>
							{onRetry ? (
								<Pressable
									onPress={onRetry}
									accessibilityRole="button"
									style={({ pressed }) => ({
										alignSelf: "flex-start",
										paddingHorizontal: spacing.sm,
										paddingVertical: 6,
										borderRadius: radii.full,
										backgroundColor: pressed
											? "rgba(255,255,255,0.20)"
											: GLASS_BG,
										borderWidth: 1,
										borderColor: GLASS_BORDER,
									})}
								>
									<Text
										size="xs"
										weight="semibold"
										style={{ color: TEXT_PRIMARY }}
									>
										Retry
									</Text>
								</Pressable>
							) : null}
						</View>
					) : (
						<View style={{ gap: spacing.sm }}>
							<View
								style={{
									flexDirection: "row",
									alignItems: "flex-end",
									gap: spacing.sm,
								}}
							>
								<Text
									size="xxxl"
									weight="heavy"
									style={{
										color: TEXT_PRIMARY,
										fontVariant: ["tabular-nums"],
										letterSpacing: -1,
									}}
								>
									{fmtNum(data.air_temp_c_avg, 1)}°
								</Text>
								<View style={{ paddingBottom: 8 }}>
									<Text
										size="xs"
										weight="semibold"
										style={{
											color: TEXT_SECONDARY,
											letterSpacing: 0.8,
											textTransform: "uppercase",
										}}
									>
										Avg air temp
									</Text>
									<Text
										size="xs"
										style={{
											color: TEXT_MUTED,
											fontVariant: ["tabular-nums"],
										}}
									>
										{fmtNum(data.air_temp_c_min, 0)}° /{" "}
										{fmtNum(data.air_temp_c_max, 0)}°
									</Text>
								</View>
							</View>

							<View style={{ flexDirection: "row", gap: spacing.xs }}>
								<MetricTile
									icon="water"
									iconColor="#9CC6E8"
									label="Humidity"
									value={humidity.label}
									valueColor={humidity.color}
									subtext={
										data.humidity_pct_avg != null
											? `${fmtNum(data.humidity_pct_avg, 0)}%`
											: undefined
									}
								/>
								<MetricTile
									icon={scene.icon}
									iconColor={scene.accent}
									label="Today"
									value={scene.label}
									subtext={
										data.sunlight_hours_avg != null
											? `${fmtNum(data.sunlight_hours_avg, 1)} h sun`
											: undefined
									}
								/>
								<MetricTile
									icon="rainy"
									iconColor="#7FB8E8"
									label="Rain"
									value={rain.label}
									valueColor={rain.color}
									subtext={
										today?.precipitation_probability_max != null
											? `${fmtNum(today.precipitation_probability_max, 0)}%`
											: undefined
									}
								/>
							</View>
						</View>
					)}
				</View>
			</View>
		</View>
	);
}

export function MetricTile({
	icon,
	iconColor,
	label,
	value,
	valueColor,
	subtext,
}: {
	icon: React.ComponentProps<typeof Ionicons>["name"];
	iconColor: string;
	label: string;
	value: string;
	valueColor?: string;
	subtext?: string;
}) {
	return (
		<View
			style={{
				flex: 1,
				padding: spacing.sm,
				borderRadius: radii.md,
				backgroundColor: GLASS_BG,
				borderWidth: 1,
				borderColor: GLASS_BORDER,
				gap: 4,
				justifyContent: "space-between",
			}}
		>
			<View style={{ gap: 4 }}>
				<View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
					<Ionicons name={icon} size={12} color={iconColor} />
					<Text
						size="xs"
						style={{
							color: TEXT_MUTED,
							letterSpacing: 0.8,
							textTransform: "uppercase",
						}}
					>
						{label}
					</Text>
				</View>
				<Text
					weight="bold"
					size="sm"
					numberOfLines={1}
					adjustsFontSizeToFit
					minimumFontScale={0.7}
					style={{ color: valueColor ?? TEXT_PRIMARY }}
				>
					{value}
				</Text>
			</View>
			<Text
				size="xs"
				numberOfLines={1}
				adjustsFontSizeToFit
				minimumFontScale={0.8}
				style={{
					color: TEXT_MUTED,
					fontVariant: ["tabular-nums"],
				}}
			>
				{subtext ?? " "}
			</Text>
		</View>
	);
}

export default WeatherCard;

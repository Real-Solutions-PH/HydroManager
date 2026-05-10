import { Ionicons } from "@expo/vector-icons";
import { ActivityIndicator, Pressable, View } from "react-native";
import { Card } from "@/components/ui/card";
import { Text } from "@/components/ui/text";
import { colors, radii, spacing } from "@/constants/theme";
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

const MONTH_LABELS = [
	"Jan",
	"Feb",
	"Mar",
	"Apr",
	"May",
	"Jun",
	"Jul",
	"Aug",
	"Sep",
	"Oct",
	"Nov",
	"Dec",
];

function fmtNum(v: number | null | undefined, digits = 0): string {
	if (v == null || Number.isNaN(v)) return "—";
	return v.toFixed(digits);
}

interface ConditionMeta {
	label: string;
	icon: React.ComponentProps<typeof Ionicons>["name"];
	color: string;
}

// WMO weather codes → label + icon.
function conditionFromCode(code: number | undefined): ConditionMeta {
	if (code == null) return { label: "—", icon: "partly-sunny", color: colors.textMuted };
	if (code === 0) return { label: "Sunny", icon: "sunny", color: colors.warning };
	if (code <= 2) return { label: "Mostly sunny", icon: "partly-sunny", color: colors.warning };
	if (code === 3) return { label: "Cloudy", icon: "cloud", color: colors.textSecondary };
	if (code === 45 || code === 48) return { label: "Foggy", icon: "cloud-outline", color: colors.textSecondary };
	if (code >= 51 && code <= 57) return { label: "Drizzle", icon: "rainy-outline", color: colors.restockAccent };
	if (code >= 61 && code <= 67) return { label: "Rainy", icon: "rainy", color: colors.info };
	if (code >= 71 && code <= 77) return { label: "Snowy", icon: "snow", color: colors.restockAccent };
	if (code >= 80 && code <= 82) return { label: "Showers", icon: "rainy", color: colors.info };
	if (code >= 85 && code <= 86) return { label: "Snow showers", icon: "snow", color: colors.restockAccent };
	if (code >= 95) return { label: "Thunderstorm", icon: "thunderstorm", color: colors.error };
	return { label: "Mixed", icon: "partly-sunny", color: colors.textSecondary };
}

interface RainMeta {
	label: string;
	color: string;
}

function rainChanceMeta(pct: number | null | undefined): RainMeta {
	if (pct == null) return { label: "—", color: colors.textMuted };
	if (pct < 10) return { label: "No rain", color: colors.primaryLight };
	if (pct < 30) return { label: "Low chance", color: colors.success };
	if (pct < 60) return { label: "Moderate", color: colors.warning };
	if (pct < 85) return { label: "High chance", color: colors.error };
	return { label: "Very high", color: colors.error };
}

export function WeatherCard({
	data,
	today,
	cityLabel,
	loading,
	error,
	onRetry,
}: WeatherCardProps) {
	const monthLabel =
		data?.month != null ? MONTH_LABELS[data.month - 1] : MONTH_LABELS[new Date().getMonth()];

	const cond = conditionFromCode(today?.weather_code);
	const rain = rainChanceMeta(today?.precipitation_probability_max ?? null);

	return (
		<View style={{ paddingHorizontal: spacing.md }}>
			<Card>
				<View
					style={{
						flexDirection: "row",
						alignItems: "center",
						justifyContent: "space-between",
						marginBottom: spacing.sm,
					}}
				>
					<View style={{ flex: 1 }}>
						<Text size="lg" weight="bold">
							Grow Climate
						</Text>
						<Text size="xs" tone="muted">
							{cityLabel ?? "Locating…"} · {monthLabel} normals
						</Text>
					</View>
					<View
						style={{
							width: 36,
							height: 36,
							borderRadius: radii.md,
							backgroundColor: colors.infoLight,
							alignItems: "center",
							justifyContent: "center",
						}}
					>
						<Ionicons name={cond.icon} size={18} color={cond.color} />
					</View>
				</View>

				{loading ? (
					<View style={{ paddingVertical: spacing.lg, alignItems: "center" }}>
						<ActivityIndicator color={colors.primaryLight} />
					</View>
				) : error || !data ? (
					<View style={{ paddingVertical: spacing.md, gap: spacing.xs }}>
						<Text size="sm" tone="muted">
							{error ?? "Enable location to see climate data for your grow site."}
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
									backgroundColor: pressed ? colors.glassHover : colors.glass,
									borderWidth: 1,
									borderColor: colors.border,
								})}
							>
								<Text size="xs" weight="semibold">
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
							<Text size="xxxl" weight="bold">
								{fmtNum(data.air_temp_c_avg, 1)}°C
							</Text>
							<View style={{ paddingBottom: 6 }}>
								<Text size="xs" tone="muted">
									Avg air temp
								</Text>
								<Text size="xs" tone="muted">
									{fmtNum(data.air_temp_c_min, 0)}° / {fmtNum(data.air_temp_c_max, 0)}°
								</Text>
							</View>
						</View>

						<View style={{ flexDirection: "row", gap: spacing.xs }}>
							<MetricTile
								icon="water"
								iconColor={colors.info}
								label="Humidity"
								value={`${fmtNum(data.humidity_pct_avg, 0)}%`}
							/>
							<MetricTile
								icon={cond.icon}
								iconColor={cond.color}
								label="Today"
								value={cond.label}
								subtext={
									data.sunlight_hours_avg != null
										? `${fmtNum(data.sunlight_hours_avg, 1)} h sun`
										: undefined
								}
							/>
							<MetricTile
								icon="rainy"
								iconColor={colors.restockAccent}
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
			</Card>
		</View>
	);
}

function MetricTile({
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
				backgroundColor: colors.surfaceVariant,
				borderWidth: 1,
				borderColor: colors.border,
				gap: 4,
				justifyContent: "space-between",
			}}
		>
			<View style={{ gap: 4 }}>
				<View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
					<Ionicons name={icon} size={12} color={iconColor} />
					<Text size="xs" tone="muted">
						{label}
					</Text>
				</View>
				<Text
					weight="bold"
					size="sm"
					numberOfLines={1}
					adjustsFontSizeToFit
					minimumFontScale={0.7}
					style={valueColor ? { color: valueColor } : undefined}
				>
					{value}
				</Text>
			</View>
			<Text size="xs" tone="muted" numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
				{subtext ?? " "}
			</Text>
		</View>
	);
}

export default WeatherCard;

import { ScrollView, View } from "react-native";
import { Text } from "@/components/ui/text";
import { colors, radii, spacing } from "@/constants/theme";

export interface CropCompositionSegment {
	label: string;
	value: number;
	color: string;
}

interface Props {
	title: string;
	segments: CropCompositionSegment[];
	centerValue: string;
	centerLabel: string;
	emptyLabel?: string;
}

const GRID = 10;
const TOTAL_CELLS = GRID * GRID;
const CELL = 11;
const CELL_GAP = 3;
const GRID_SIZE = CELL * GRID + CELL_GAP * (GRID - 1);

function segmentPalette(): string[] {
	return [
		colors.primaryDeep,
		colors.primaryLight,
		colors.accent,
		colors.warning,
		colors.info,
		colors.salesAccent,
		colors.restockAccent,
	];
}

function hslToHex(h: number, s: number, l: number): string {
	const sat = s / 100;
	const lit = l / 100;
	const k = (n: number) => (n + h / 30) % 12;
	const a = sat * Math.min(lit, 1 - lit);
	const f = (n: number) => {
		const c = lit - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
		return Math.round(255 * c)
			.toString(16)
			.padStart(2, "0");
	};
	return `#${f(0)}${f(8)}${f(4)}`;
}

export function getCompositionColor(index: number): string {
	const palette = segmentPalette();
	if (index < palette.length) return palette[index];
	const hue = ((index - palette.length) * 137.508) % 360;
	return hslToHex(hue, 55, 58);
}

function allocateCells(values: number[], cells: number): number[] {
	const total = values.reduce((a, b) => a + b, 0);
	if (total <= 0) return values.map(() => 0);
	const raw = values.map((v) => (v / total) * cells);
	const floor = raw.map(Math.floor);
	const used = floor.reduce((a, b) => a + b, 0);
	const remainder = cells - used;
	const order = raw
		.map((r, i) => ({ i, frac: r - Math.floor(r) }))
		.sort((a, b) => b.frac - a.frac);
	for (let k = 0; k < remainder; k++) floor[order[k % order.length].i] += 1;
	return floor;
}

export function CropCompositionCard({
	title,
	segments,
	centerValue,
	centerLabel,
	emptyLabel,
}: Props) {
	const total = segments.reduce((s, x) => s + x.value, 0);
	const counts = allocateCells(
		segments.map((s) => s.value),
		TOTAL_CELLS,
	);
	const cellColors: string[] = [];
	segments.forEach((seg, i) => {
		for (let k = 0; k < counts[i]; k++) cellColors.push(seg.color);
	});
	while (cellColors.length < TOTAL_CELLS) cellColors.push(colors.borderLight);

	const legend = segments.map((seg, i) => ({
		...seg,
		pct: total > 0 ? Math.round((seg.value / total) * 100) : 0,
		cells: counts[i],
	}));

	return (
		<View style={{ paddingHorizontal: spacing.md }}>
			<View
				style={{
					backgroundColor: colors.surfaceVariant,
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
						alignItems: "center",
						justifyContent: "space-between",
					}}
				>
					<Text weight="bold" size="lg">
						{title}
					</Text>
					<View style={{ alignItems: "flex-end" }}>
						<Text size="lg" weight="bold">
							{centerValue}
						</Text>
						<Text size="xs" tone="muted">
							{centerLabel}
						</Text>
					</View>
				</View>
				<View
					style={{
						flexDirection: "row",
						alignItems: "flex-start",
						gap: spacing.md,
					}}
				>
					<View
						style={{
							width: GRID_SIZE,
							height: GRID_SIZE,
							flexDirection: "row",
							flexWrap: "wrap",
							gap: CELL_GAP,
						}}
					>
						{cellColors.map((c, idx) => (
							<View
								key={idx}
								style={{
									width: CELL,
									height: CELL,
									borderRadius: 2,
									backgroundColor: c,
								}}
							/>
						))}
					</View>
					<View style={{ flex: 1, maxHeight: GRID_SIZE }}>
						{legend.length === 0 ? (
							<Text size="sm" tone="muted">
								{emptyLabel ?? "No data"}
							</Text>
						) : (
							<ScrollView
								showsVerticalScrollIndicator
								contentContainerStyle={{ gap: spacing.xs }}
								nestedScrollEnabled
							>
								{legend.map((a) => (
									<View
										key={a.label}
										style={{
											flexDirection: "row",
											alignItems: "center",
											gap: spacing.xs,
										}}
									>
										<View
											style={{
												width: 10,
												height: 10,
												borderRadius: 2,
												backgroundColor: a.color,
											}}
										/>
										<Text size="sm" numberOfLines={1} style={{ flex: 1 }}>
											{a.label}
										</Text>
										<Text size="sm" weight="bold" tone="subtle">
											{a.pct}%
										</Text>
									</View>
								))}
							</ScrollView>
						)}
					</View>
				</View>
			</View>
		</View>
	);
}

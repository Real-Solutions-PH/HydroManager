import { Ionicons } from "@expo/vector-icons";
import * as DialogPrimitive from "@rn-primitives/dialog";
import { useState } from "react";
import { Pressable, ScrollView, Text as RNText, View } from "react-native";
import { emojiFor } from "@/components/seeds/seed-packet-cell";
import { Text } from "@/components/ui/text";
import { radii, spacing, useThemeColors } from "@/constants/theme";

export interface PhaseItem {
	name: string;
	count: number;
}

export interface PhaseSegment {
	key: string;
	label: string;
	count: number;
	color: string;
	icon: React.ComponentProps<typeof Ionicons>["name"];
	items?: PhaseItem[];
}

interface Props {
	title: string;
	phases: PhaseSegment[];
	total: number;
	totalLabel: string;
	emptyLabel?: string;
}

const BAR_HEIGHT = 8;
const BAR_GAP = 3;

export function PhaseProgressionCard({
	title,
	phases,
	total,
	totalLabel,
	emptyLabel,
}: Props) {
	const colors = useThemeColors();
	const [selectedKey, setSelectedKey] = useState<string | null>(null);
	const sum = phases.reduce((a, b) => a + b.count, 0);
	const allEmpty = sum === 0;
	const selected = phases.find((p) => p.key === selectedKey) ?? null;
	const selectedItems = (selected?.items ?? [])
		.filter((i) => i.count > 0)
		.sort((a, b) => b.count - a.count);

	return (
		<View style={{ paddingHorizontal: spacing.md }}>
			<View
				style={{
					backgroundColor: colors.surface,
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
						justifyContent: "space-between",
						alignItems: "center",
					}}
				>
					<Text weight="bold" size="lg">
						{title}
					</Text>
					<View style={{ alignItems: "flex-end" }}>
						<Text size="lg" weight="bold">
							{total}
						</Text>
						<Text size="xs" tone="muted">
							{totalLabel}
						</Text>
					</View>
				</View>

				<View
					style={{
						flexDirection: "row",
						height: BAR_HEIGHT,
						gap: BAR_GAP,
					}}
				>
					{phases.map((p) => {
						const ratio = sum > 0 ? p.count / sum : 0;
						return (
							<View
								key={p.key}
								style={{
									flex: Math.max(ratio, 0.04),
									backgroundColor: p.count > 0 ? p.color : colors.borderLight,
									borderRadius: radii.full,
								}}
							/>
						);
					})}
				</View>

				<View style={{ flexDirection: "row", gap: spacing.xs }}>
					{phases.map((p) => {
						const hasItems = (p.items?.length ?? 0) > 0 && p.count > 0;
						return (
							<Pressable
								key={p.key}
								disabled={!hasItems}
								accessibilityRole={hasItems ? "button" : undefined}
								accessibilityLabel={
									hasItems ? `View ${p.label} plants` : undefined
								}
								onPress={() => hasItems && setSelectedKey(p.key)}
								style={({ pressed }) => ({
									flex: 1,
									alignItems: "center",
									gap: 4,
									opacity: pressed && hasItems ? 0.7 : 1,
								})}
							>
								<View
									style={{
										width: 36,
										height: 36,
										borderRadius: radii.md,
										backgroundColor: `${p.color}26`,
										alignItems: "center",
										justifyContent: "center",
										borderWidth: hasItems ? 1 : 0,
										borderColor: `${p.color}66`,
									}}
								>
									<Ionicons name={p.icon} size={18} color={p.color} />
								</View>
								<Text size="lg" weight="bold">
									{p.count}
								</Text>
								<Text
									size="xs"
									tone="muted"
									numberOfLines={2}
									style={{ textAlign: "center" }}
								>
									{p.label}
								</Text>
							</Pressable>
						);
					})}
				</View>

				{allEmpty ? (
					<Text size="sm" tone="muted" style={{ textAlign: "center" }}>
						{emptyLabel ?? "No data"}
					</Text>
				) : null}
			</View>

			<DialogPrimitive.Root
				open={selected !== null}
				onOpenChange={(o) => {
					if (!o) setSelectedKey(null);
				}}
			>
				<DialogPrimitive.Portal>
					<DialogPrimitive.Overlay
						style={{
							position: "absolute",
							top: 0,
							bottom: 0,
							left: 0,
							right: 0,
							backgroundColor: "rgba(0,0,0,0.55)",
						}}
					/>
					<DialogPrimitive.Content
						style={{
							position: "absolute",
							top: "15%",
							left: spacing.md,
							right: spacing.md,
							maxHeight: "70%",
							borderRadius: 16,
							borderWidth: 1,
							borderColor: colors.border,
							backgroundColor: colors.bgMid,
							overflow: "hidden",
						}}
					>
						<View
							style={{
								flexDirection: "row",
								alignItems: "center",
								gap: spacing.sm,
								paddingHorizontal: spacing.md,
								paddingVertical: spacing.sm,
								borderBottomWidth: 1,
								borderBottomColor: colors.border,
							}}
						>
							{selected ? (
								<View
									style={{
										width: 32,
										height: 32,
										borderRadius: radii.md,
										backgroundColor: `${selected.color}26`,
										alignItems: "center",
										justifyContent: "center",
									}}
								>
									<Ionicons
										name={selected.icon}
										size={16}
										color={selected.color}
									/>
								</View>
							) : null}
							<View style={{ flex: 1 }}>
								<Text size="md" weight="bold">
									{selected?.label}
								</Text>
								<Text size="xs" tone="muted">
									{selected?.count ?? 0} plants
								</Text>
							</View>
							<DialogPrimitive.Close asChild>
								<Pressable hitSlop={8}>
									<Ionicons name="close" size={20} color={colors.textMuted} />
								</Pressable>
							</DialogPrimitive.Close>
						</View>
						<ScrollView style={{ maxHeight: 420 }}>
							{selectedItems.length === 0 ? (
								<View style={{ padding: spacing.md }}>
									<Text size="sm" tone="muted">
										No plants in this phase.
									</Text>
								</View>
							) : (
								selectedItems.map((item, idx) => (
									<View
										key={`${item.name}-${idx}`}
										style={{
											flexDirection: "row",
											alignItems: "center",
											gap: spacing.sm,
											paddingVertical: spacing.sm,
											paddingHorizontal: spacing.md,
											borderBottomWidth:
												idx === selectedItems.length - 1 ? 0 : 1,
											borderBottomColor: colors.borderLight,
										}}
									>
										<View
											style={{
												width: 36,
												height: 36,
												borderRadius: radii.md,
												backgroundColor: colors.glass,
												alignItems: "center",
												justifyContent: "center",
											}}
										>
											<RNText style={{ fontSize: 20, lineHeight: 24 }}>
												{emojiFor(item.name)}
											</RNText>
										</View>
										<Text style={{ flex: 1 }} numberOfLines={1}>
											{item.name}
										</Text>
										<Text size="md" weight="bold">
											{item.count}
										</Text>
									</View>
								))
							)}
						</ScrollView>
					</DialogPrimitive.Content>
				</DialogPrimitive.Portal>
			</DialogPrimitive.Root>
		</View>
	);
}

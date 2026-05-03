import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { useState } from "react";
import { Alert, Pressable, ScrollView, View } from "react-native";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DatePicker } from "@/components/ui/date-picker";
import { GradientBackground } from "@/components/ui/gradient-background";
import { Input } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { colors, inventoryCategoryMeta, spacing } from "@/constants/theme";
import { useBack } from "@/hooks/use-back";
import {
	type InventoryCategory,
	type InventoryUnit,
	inventoryApi,
} from "@/lib/hydro-api";

const CATEGORIES: InventoryCategory[] = [
	"seeds",
	"media",
	"nutrients",
	"equipment",
	"packaging",
	"other",
];
const UNITS: InventoryUnit[] = ["grams", "pieces", "liters", "milliliters"];

export default function NewInventoryItemScreen() {
	const qc = useQueryClient();
	const goBack = useBack();
	const [name, setName] = useState("");
	const [category, setCategory] = useState<InventoryCategory>("seeds");
	const [unit, setUnit] = useState<InventoryUnit>("grams");
	const [stock, setStock] = useState("0");
	const [threshold, setThreshold] = useState("0");
	const [costMode, setCostMode] = useState<"unit" | "total">("unit");
	const [unitCost, setUnitCost] = useState("");
	const [totalCost, setTotalCost] = useState("");
	const [expiry, setExpiry] = useState<string | null>(null);
	const [notes, setNotes] = useState("");

	const stockNum = Number.parseFloat(stock) || 0;
	const unitCostNum = Number.parseFloat(unitCost);
	const totalCostNum = Number.parseFloat(totalCost);
	const derivedUnitCost =
		costMode === "total" && stockNum > 0 && Number.isFinite(totalCostNum)
			? totalCostNum / stockNum
			: null;
	const derivedTotalCost =
		costMode === "unit" && stockNum > 0 && Number.isFinite(unitCostNum)
			? unitCostNum * stockNum
			: null;

	const create = useMutation({
		mutationFn: () => {
			let resolvedUnitCost: number | null = null;
			if (costMode === "unit") {
				resolvedUnitCost = unitCost.trim().length > 0 ? unitCostNum : null;
			} else if (totalCost.trim().length > 0 && stockNum > 0) {
				resolvedUnitCost = totalCostNum / stockNum;
			}
			return inventoryApi.create({
				name: name.trim(),
				category,
				unit,
				current_stock: stockNum,
				low_stock_threshold: Number.parseFloat(threshold) || 0,
				unit_cost: resolvedUnitCost,
				expiry_date: expiry,
				notes: notes.trim() || undefined,
			});
		},
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ["inventory"] });
			router.back();
		},
		onError: (e: Error) => Alert.alert("Error", e.message),
	});

	const valid = name.trim().length > 0;

	return (
		<GradientBackground>
			<ScrollView
				contentContainerStyle={{
					padding: spacing.md,
					paddingBottom: spacing.xxxl,
				}}
			>
				<View
					style={{
						flexDirection: "row",
						alignItems: "center",
						gap: spacing.xs,
						marginBottom: spacing.xs,
					}}
				>
					<Pressable onPress={goBack}>
						<Ionicons name="arrow-back" size={24} color={colors.text} />
					</Pressable>
					<Text size="xxl" weight="bold">
						New Item
					</Text>
				</View>

				<Card>
					<Field label="Name">
						<Input
							placeholder="e.g. Rockwool cubes"
							value={name}
							onChangeText={setName}
						/>
					</Field>

					<Field label="Category">
						<View
							style={{
								flexDirection: "row",
								flexWrap: "wrap",
								gap: spacing.xs,
							}}
						>
							{CATEGORIES.map((c) => {
								const meta = inventoryCategoryMeta[c];
								const active = category === c;
								return (
									<Pressable
										key={c}
										onPress={() => setCategory(c)}
										style={{
											flexDirection: "row",
											alignItems: "center",
											gap: 6,
											paddingHorizontal: spacing.sm,
											paddingVertical: spacing.xs,
											borderRadius: 12,
											borderWidth: 1,
											borderColor: active ? meta.color : colors.border,
											backgroundColor: active
												? `${meta.color}26`
												: "transparent",
										}}
									>
										<Ionicons
											name={meta.icon as never}
											size={14}
											color={active ? meta.color : colors.textMuted}
										/>
										<Text
											size="sm"
											weight="semibold"
											style={{
												color: active ? meta.color : colors.text,
											}}
										>
											{c}
										</Text>
									</Pressable>
								);
							})}
						</View>
					</Field>

					<Field label="Unit">
						<View
							style={{
								flexDirection: "row",
								flexWrap: "wrap",
								gap: spacing.xs,
							}}
						>
							{UNITS.map((u) => (
								<Chip
									key={u}
									label={u}
									active={unit === u}
									onPress={() => setUnit(u)}
								/>
							))}
						</View>
					</Field>

					<View style={{ flexDirection: "row", gap: 10 }}>
						<View style={{ flex: 1 }}>
							<Field label="Current Stock">
								<Input
									keyboardType="numeric"
									value={stock}
									onChangeText={setStock}
								/>
							</Field>
						</View>
						<View style={{ flex: 1 }}>
							<Field label="Low Threshold">
								<Input
									keyboardType="numeric"
									value={threshold}
									onChangeText={setThreshold}
								/>
							</Field>
						</View>
					</View>

					<Field
						label={
							costMode === "unit"
								? "Unit Cost (₱, optional)"
								: "Total Cost (₱, optional)"
						}
					>
						<View
							style={{
								flexDirection: "row",
								gap: spacing.xs,
								marginBottom: spacing.xs,
							}}
						>
							<Chip
								label="Unit cost"
								active={costMode === "unit"}
								onPress={() => setCostMode("unit")}
							/>
							<Chip
								label="Total cost"
								active={costMode === "total"}
								onPress={() => setCostMode("total")}
							/>
						</View>
						{costMode === "unit" ? (
							<Input
								keyboardType="numeric"
								placeholder="0.00"
								value={unitCost}
								onChangeText={setUnitCost}
							/>
						) : (
							<Input
								keyboardType="numeric"
								placeholder="0.00"
								value={totalCost}
								onChangeText={setTotalCost}
							/>
						)}
						{derivedUnitCost !== null ? (
							<Text size="xs" tone="subtle" style={{ marginTop: 4 }}>
								≈ ₱{derivedUnitCost.toFixed(2)} per {unit.replace(/s$/, "")}
							</Text>
						) : null}
						{derivedTotalCost !== null ? (
							<Text size="xs" tone="subtle" style={{ marginTop: 4 }}>
								Total: ₱{derivedTotalCost.toFixed(2)} for {stockNum} {unit}
							</Text>
						) : null}
						{costMode === "total" && stockNum <= 0 ? (
							<Text size="xs" tone="subtle" style={{ marginTop: 4 }}>
								Set current stock to compute unit cost.
							</Text>
						) : null}
					</Field>

					<Field label="Expiry Date">
						<DatePicker
							value={expiry}
							onChange={setExpiry}
							placeholder="No expiry"
							allowClear
						/>
					</Field>

					<Field label="Notes">
						<Input
							placeholder="Optional"
							value={notes}
							onChangeText={setNotes}
							multiline
						/>
					</Field>
				</Card>

				<View style={{ gap: spacing.xs, marginTop: spacing.lg }}>
					<Button
						label="Create Item"
						isLoading={create.isPending}
						isDisabled={!valid}
						onPress={() => create.mutate()}
					/>
					<Button variant="ghost" label="Cancel" onPress={goBack} />
				</View>
			</ScrollView>
		</GradientBackground>
	);
}

function Field({
	label,
	children,
}: {
	label: string;
	children: React.ReactNode;
}) {
	return (
		<View style={{ gap: 6, marginBottom: spacing.md }}>
			<Text
				size="xs"
				weight="semibold"
				tone="subtle"
				style={{ textTransform: "uppercase", letterSpacing: 0.5 }}
			>
				{label}
			</Text>
			{children}
		</View>
	);
}

function Chip({
	label,
	active,
	onPress,
}: {
	label: string;
	active: boolean;
	onPress: () => void;
}) {
	return (
		<Pressable
			onPress={onPress}
			style={{
				paddingHorizontal: spacing.sm,
				paddingVertical: 6,
				borderRadius: 999,
				borderWidth: 1,
				borderColor: active ? colors.primaryLight : colors.border,
				backgroundColor: active ? `${colors.primaryLight}26` : "transparent",
			}}
		>
			<Text
				size="sm"
				weight="semibold"
				style={{ color: active ? colors.primaryLight : colors.text }}
			>
				{label}
			</Text>
		</Pressable>
	);
}

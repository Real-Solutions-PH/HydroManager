import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { useState } from "react";
import { Alert, Pressable, ScrollView, View } from "react-native";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { GradientBackground } from "@/components/ui/gradient-background";
import { Input } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { colors, inventoryCategoryMeta, spacing } from "@/constants/theme";
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
	const [name, setName] = useState("");
	const [category, setCategory] = useState<InventoryCategory>("seeds");
	const [unit, setUnit] = useState<InventoryUnit>("grams");
	const [stock, setStock] = useState("0");
	const [threshold, setThreshold] = useState("0");
	const [unitCost, setUnitCost] = useState("");
	const [expiry, setExpiry] = useState("");
	const [notes, setNotes] = useState("");

	const create = useMutation({
		mutationFn: () => {
			const expiryValid =
				expiry.length === 0 || /^\d{4}-\d{2}-\d{2}$/.test(expiry);
			if (!expiryValid) throw new Error("Expiry date must be YYYY-MM-DD");
			return inventoryApi.create({
				name: name.trim(),
				category,
				unit,
				current_stock: Number.parseFloat(stock) || 0,
				low_stock_threshold: Number.parseFloat(threshold) || 0,
				unit_cost:
					unitCost.trim().length > 0 ? Number.parseFloat(unitCost) : null,
				expiry_date: expiry.trim().length > 0 ? expiry.trim() : null,
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
					<Pressable onPress={() => router.back()}>
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

					<Field label="Unit Cost (₱, optional)">
						<Input
							keyboardType="numeric"
							placeholder="0.00"
							value={unitCost}
							onChangeText={setUnitCost}
						/>
					</Field>

					<Field label="Expiry Date (YYYY-MM-DD)">
						<Input
							placeholder="2026-12-31"
							value={expiry}
							onChangeText={setExpiry}
							autoCapitalize="none"
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
					<Button
						variant="ghost"
						label="Cancel"
						onPress={() => router.back()}
					/>
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

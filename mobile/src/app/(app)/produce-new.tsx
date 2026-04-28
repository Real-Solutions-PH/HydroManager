import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { useState } from "react";
import { Alert, Pressable, ScrollView, View } from "react-native";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { GradientBackground } from "@/components/ui/gradient-background";
import { Input } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { colors, spacing } from "@/constants/theme";
import { useBack } from "@/hooks/use-back";
import { useCustomToast } from "@/hooks/useCustomToast";
import { batchesApi, produceApi } from "@/lib/hydro-api";
import { handleError } from "@/lib/utils";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function todayISO(): string {
	return new Date().toISOString().slice(0, 10);
}

export default function NewProduceScreen() {
	const qc = useQueryClient();
	const goBack = useBack();
	const toast = useCustomToast();
	const [name, setName] = useState("");
	const [batchId, setBatchId] = useState<string | null>(null);
	const [qty, setQty] = useState("1");
	const [unit, setUnit] = useState("kg");
	const [harvestedAt, setHarvestedAt] = useState(todayISO());
	const [expiry, setExpiry] = useState("");
	const [price, setPrice] = useState("");
	const [notes, setNotes] = useState("");

	const batches = useQuery({
		queryKey: ["batches"],
		queryFn: () => batchesApi.list(),
	});

	const create = useMutation({
		mutationFn: () => {
			if (!DATE_RE.test(harvestedAt))
				throw new Error("Harvest date must be YYYY-MM-DD");
			if (expiry && !DATE_RE.test(expiry))
				throw new Error("Expiry date must be YYYY-MM-DD");
			return produceApi.create({
				name: name.trim(),
				source_batch_id: batchId,
				quantity: Number.parseFloat(qty) || 0,
				unit: unit.trim() || "kg",
				harvested_at: harvestedAt,
				expiry_date: expiry.trim() || null,
				selling_price:
					price.trim().length > 0 ? Number.parseFloat(price) : null,
				notes: notes.trim() || undefined,
			});
		},
		onSuccess: () => {
			toast.success("Produce added");
			qc.invalidateQueries({ queryKey: ["produce"] });
			qc.invalidateQueries({ queryKey: ["sales-dashboard"] });
			router.back();
		},
		onError: (err) => Alert.alert("Error", handleError(err)),
	});

	const valid =
		name.trim().length > 0 &&
		Number.parseFloat(qty) > 0 &&
		unit.trim().length > 0;

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
						marginBottom: spacing.sm,
					}}
				>
					<Pressable onPress={goBack}>
						<Ionicons name="arrow-back" size={24} color={colors.text} />
					</Pressable>
					<Text size="xxl" weight="bold">
						New Produce
					</Text>
				</View>

				<Card>
					<Field label="Name">
						<Input
							value={name}
							onChangeText={setName}
							placeholder="e.g. Pechay"
						/>
					</Field>

					<Field label="Source batch (optional)">
						<View
							style={{
								flexDirection: "row",
								flexWrap: "wrap",
								gap: spacing.xs,
							}}
						>
							<Chip
								label="None"
								active={batchId === null}
								onPress={() => setBatchId(null)}
							/>
							{(batches.data?.data ?? []).map((b) => (
								<Chip
									key={b.id}
									label={b.variety_name}
									active={batchId === b.id}
									onPress={() => setBatchId(b.id)}
								/>
							))}
						</View>
					</Field>

					<View style={{ flexDirection: "row", gap: spacing.xs }}>
						<View style={{ flex: 1 }}>
							<Field label="Quantity">
								<Input
									keyboardType="numeric"
									value={qty}
									onChangeText={setQty}
								/>
							</Field>
						</View>
						<View style={{ width: 90 }}>
							<Field label="Unit">
								<Input value={unit} onChangeText={setUnit} />
							</Field>
						</View>
					</View>

					<Field label="Harvested (YYYY-MM-DD)">
						<Input
							value={harvestedAt}
							onChangeText={setHarvestedAt}
							autoCapitalize="none"
						/>
					</Field>

					<Field label="Expiry (YYYY-MM-DD, optional)">
						<Input
							value={expiry}
							onChangeText={setExpiry}
							placeholder="2026-12-31"
							autoCapitalize="none"
						/>
					</Field>

					<Field label="Selling price (₱, optional)">
						<Input
							keyboardType="numeric"
							value={price}
							onChangeText={setPrice}
							placeholder="0.00"
						/>
					</Field>

					<Field label="Notes">
						<Input
							value={notes}
							onChangeText={setNotes}
							placeholder="Optional"
							multiline
						/>
					</Field>
				</Card>

				<View style={{ gap: spacing.xs, marginTop: spacing.lg }}>
					<Button
						label="Add Produce"
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
		<View style={{ gap: 6, marginBottom: spacing.sm }}>
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

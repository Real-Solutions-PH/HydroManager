import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, View } from "react-native";
import { InventoryMovementSheet } from "@/components/inventory/movement-sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { GradientBackground } from "@/components/ui/gradient-background";
import { Input } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import {
	colors,
	expiryStatusMeta,
	inventoryCategoryMeta,
	spacing,
} from "@/constants/theme";
import { useCustomToast } from "@/hooks/useCustomToast";
import { inventoryApi, type MovementType } from "@/lib/hydro-api";
import { handleError } from "@/lib/utils";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export default function InventoryDetailScreen() {
	const { id } = useLocalSearchParams<{ id: string }>();
	const qc = useQueryClient();
	const toast = useCustomToast();

	const item = useQuery({
		queryKey: ["inventory", id],
		queryFn: () => inventoryApi.get(id),
		enabled: !!id,
	});
	const movements = useQuery({
		queryKey: ["inventory-movements", id],
		queryFn: () => inventoryApi.movements(id),
		enabled: !!id,
	});

	const [name, setName] = useState("");
	const [threshold, setThreshold] = useState("0");
	const [expiry, setExpiry] = useState("");
	const [notes, setNotes] = useState("");
	const [movementType, setMovementType] = useState<MovementType | null>(null);

	useEffect(() => {
		if (item.data) {
			setName(item.data.name);
			setThreshold(String(item.data.low_stock_threshold ?? 0));
			setExpiry(item.data.expiry_date ?? "");
			setNotes(item.data.notes ?? "");
		}
	}, [item.data]);

	const update = useMutation({
		mutationFn: () => {
			const expiryValid = expiry.length === 0 || DATE_RE.test(expiry);
			if (!expiryValid) throw new Error("Expiry date must be YYYY-MM-DD");
			return inventoryApi.update(id, {
				name: name.trim(),
				low_stock_threshold: Number.parseFloat(threshold) || 0,
				expiry_date: expiry.trim().length > 0 ? expiry.trim() : null,
				notes: notes.trim() || undefined,
			});
		},
		onSuccess: () => {
			toast.success("Saved");
			qc.invalidateQueries({ queryKey: ["inventory"] });
			qc.invalidateQueries({ queryKey: ["inventory", id] });
		},
		onError: (err) => toast.error(handleError(err)),
	});

	const del = useMutation({
		mutationFn: () => inventoryApi.delete(id),
		onSuccess: () => {
			toast.success("Deleted");
			qc.invalidateQueries({ queryKey: ["inventory"] });
			router.back();
		},
		onError: (err) => toast.error(handleError(err)),
	});

	if (!item.data) {
		return (
			<GradientBackground>
				<View
					style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
				>
					<Text tone="muted">Loading...</Text>
				</View>
			</GradientBackground>
		);
	}

	const it = item.data;
	const meta = inventoryCategoryMeta[it.category];
	const expiryMeta = expiryStatusMeta[it.expiry_status];

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
					<Pressable onPress={() => router.back()}>
						<Ionicons name="arrow-back" size={24} color={colors.text} />
					</Pressable>
					<Text size="xxl" weight="bold" style={{ flex: 1 }}>
						{it.name}
					</Text>
				</View>

				{it.expiry_status !== "ok" ? (
					<Card
						style={{
							marginBottom: spacing.sm,
							borderColor: expiryMeta.color,
							borderWidth: 1,
						}}
					>
						<View
							style={{
								flexDirection: "row",
								alignItems: "center",
								gap: spacing.sm,
							}}
						>
							<Ionicons
								name={expiryMeta.icon as never}
								size={28}
								color={expiryMeta.color}
							/>
							<View style={{ flex: 1 }}>
								<Text weight="bold" style={{ color: expiryMeta.color }}>
									{it.expiry_status === "expired"
										? "Expired"
										: `Expires in ${it.days_until_expiry ?? "?"} days`}
								</Text>
								<Text size="xs" tone="muted">
									Consume soon to avoid waste
								</Text>
							</View>
						</View>
					</Card>
				) : null}

				<Card>
					<View
						style={{
							flexDirection: "row",
							alignItems: "center",
							gap: spacing.sm,
							marginBottom: spacing.sm,
						}}
					>
						<View
							style={{
								width: 44,
								height: 44,
								borderRadius: 12,
								backgroundColor: `${meta.color}26`,
								alignItems: "center",
								justifyContent: "center",
							}}
						>
							<Ionicons
								name={meta.icon as never}
								size={22}
								color={meta.color}
							/>
						</View>
						<View style={{ flex: 1 }}>
							<Badge label={it.category} color={meta.color} small />
							<Text size="xxxl" weight="bold" style={{ marginTop: 2 }}>
								{it.current_stock}{" "}
								<Text size="md" tone="muted">
									{it.unit}
								</Text>
							</Text>
							<Text size="xs" tone="muted">
								Min {it.low_stock_threshold} {it.unit}
							</Text>
						</View>
					</View>
					<View style={{ flexDirection: "row", gap: spacing.xs }}>
						<QuickAction
							label="Restock"
							icon="add-circle"
							color={colors.success}
							onPress={() => setMovementType("restock")}
						/>
						<QuickAction
							label="Consume"
							icon="remove-circle"
							color={colors.warning}
							onPress={() => setMovementType("consume")}
						/>
						<QuickAction
							label="Adjust"
							icon="create"
							color={colors.info}
							onPress={() => setMovementType("adjust")}
						/>
					</View>
				</Card>

				<Text
					size="lg"
					weight="bold"
					style={{ marginTop: spacing.md, marginBottom: spacing.xs }}
				>
					Edit
				</Text>
				<Card>
					<Field label="Name">
						<Input value={name} onChangeText={setName} />
					</Field>
					<Field label="Low stock threshold">
						<Input
							keyboardType="numeric"
							value={threshold}
							onChangeText={setThreshold}
						/>
					</Field>
					<Field label="Expiry date (YYYY-MM-DD)">
						<Input
							value={expiry}
							onChangeText={setExpiry}
							placeholder="2026-12-31"
							autoCapitalize="none"
						/>
					</Field>
					<Field label="Notes">
						<Input value={notes} onChangeText={setNotes} multiline />
					</Field>
					<Button
						label="Save"
						isLoading={update.isPending}
						onPress={() => update.mutate()}
					/>
				</Card>

				<Text
					size="lg"
					weight="bold"
					style={{ marginTop: spacing.md, marginBottom: spacing.xs }}
				>
					Movement history
				</Text>
				{(movements.data?.data ?? []).length === 0 ? (
					<Text tone="muted">No movements yet.</Text>
				) : (
					<View style={{ gap: spacing.xs }}>
						{(movements.data?.data ?? []).map((m) => (
							<Card key={m.id}>
								<View
									style={{
										flexDirection: "row",
										justifyContent: "space-between",
									}}
								>
									<View>
										<Text weight="semibold">
											{m.movement_type.toUpperCase()}
										</Text>
										<Text size="xs" tone="muted">
											{new Date(m.occurred_at).toLocaleString()}
										</Text>
									</View>
									<Text
										weight="bold"
										tone={m.movement_type === "consume" ? "error" : "success"}
									>
										{m.movement_type === "consume" ? "-" : "+"}
										{m.quantity}
									</Text>
								</View>
								{m.notes ? (
									<Text size="sm" tone="muted" style={{ marginTop: 4 }}>
										{m.notes}
									</Text>
								) : null}
							</Card>
						))}
					</View>
				)}

				<View style={{ marginTop: spacing.lg }}>
					<Button
						variant="destructive"
						label="Delete item"
						onPress={() =>
							Alert.alert("Delete?", `Remove ${it.name}?`, [
								{ text: "Cancel", style: "cancel" },
								{
									text: "Delete",
									style: "destructive",
									onPress: () => del.mutate(),
								},
							])
						}
					/>
				</View>
			</ScrollView>

			<InventoryMovementSheet
				item={movementType ? it : null}
				defaultType={movementType ?? undefined}
				onClose={() => setMovementType(null)}
			/>
		</GradientBackground>
	);
}

function QuickAction({
	label,
	icon,
	color,
	onPress,
}: {
	label: string;
	icon: string;
	color: string;
	onPress: () => void;
}) {
	return (
		<Pressable
			onPress={onPress}
			style={{
				flex: 1,
				paddingVertical: spacing.sm,
				borderRadius: 12,
				borderWidth: 1,
				borderColor: colors.border,
				backgroundColor: `${color}14`,
				alignItems: "center",
				gap: 4,
			}}
		>
			<Ionicons name={icon as never} size={20} color={color} />
			<Text size="sm" weight="semibold" style={{ color }}>
				{label}
			</Text>
		</Pressable>
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

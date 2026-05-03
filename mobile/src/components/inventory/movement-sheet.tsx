import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import {
	Alert,
	KeyboardAvoidingView,
	Modal,
	Platform,
	Pressable,
	View,
} from "react-native";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { colors, spacing } from "@/constants/theme";
import { useCustomToast } from "@/hooks/useCustomToast";
import {
	type InventoryItem,
	inventoryApi,
	type MovementType,
} from "@/lib/hydro-api";
import { QK } from "@/lib/query-config";
import { handleError } from "@/lib/utils";

interface Props {
	item: InventoryItem | null;
	onClose: () => void;
	defaultType?: MovementType;
}

const TYPES: { type: MovementType; label: string; icon: string }[] = [
	{ type: "restock", label: "Restock", icon: "add-circle" },
	{ type: "consume", label: "Consume", icon: "remove-circle" },
	{ type: "adjust", label: "Adjust", icon: "create" },
];

export function InventoryMovementSheet({ item, onClose, defaultType }: Props) {
	const qc = useQueryClient();
	const toast = useCustomToast();
	const [type, setType] = useState<MovementType>(defaultType ?? "restock");
	const [qty, setQty] = useState("1");
	const [cost, setCost] = useState("");
	const [notes, setNotes] = useState("");

	useEffect(() => {
		if (item) {
			const t = defaultType ?? "restock";
			setType(t);
			setQty(t === "adjust" ? String(item.current_stock) : "1");
			setCost("");
			setNotes("");
		}
	}, [item, defaultType]);

	useEffect(() => {
		if (item && type === "adjust") {
			setQty(String(item.current_stock));
		}
	}, [type, item]);

	const mutation = useMutation({
		mutationFn: () => {
			if (!item) throw new Error("No item");
			return inventoryApi.movement(item.id, {
				movement_type: type,
				quantity: Number.parseFloat(qty) || 0,
				cost_total:
					type === "restock" && cost.trim().length > 0
						? Number.parseFloat(cost)
						: undefined,
				notes: notes.trim() || undefined,
			});
		},
		onSuccess: () => {
			toast.success("Movement recorded");
			qc.invalidateQueries({ queryKey: QK.inventory.all });
			onClose();
		},
		onError: (err) => toast.error(handleError(err)),
	});

	const deleteMutation = useMutation({
		mutationFn: () => {
			if (!item) throw new Error("No item");
			return inventoryApi.delete(item.id);
		},
		onSuccess: () => {
			toast.success("Item deleted");
			qc.invalidateQueries({ queryKey: QK.inventory.all });
			onClose();
		},
		onError: (err) => toast.error(handleError(err)),
	});

	const confirmDelete = () => {
		if (!item) return;
		const message = `Remove ${item.name}? This also removes its movement history and cannot be undone.`;
		if (Platform.OS === "web") {
			if (typeof window !== "undefined" && window.confirm(message)) {
				deleteMutation.mutate();
			}
			return;
		}
		Alert.alert("Delete item?", message, [
			{ text: "Cancel", style: "cancel" },
			{
				text: "Delete",
				style: "destructive",
				onPress: () => deleteMutation.mutate(),
			},
		]);
	};

	const qtyNum = Number.parseFloat(qty);
	const valid = type === "adjust" ? qtyNum >= 0 && !Number.isNaN(qtyNum) : qtyNum > 0;
	const busy = mutation.isPending || deleteMutation.isPending;

	return (
		<Modal
			visible={item !== null}
			transparent
			animationType="slide"
			onRequestClose={onClose}
		>
			<Pressable
				style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.6)" }}
				onPress={onClose}
			/>
			<KeyboardAvoidingView
				behavior={Platform.OS === "ios" ? "padding" : undefined}
				style={{
					position: "absolute",
					left: 0,
					right: 0,
					bottom: 0,
				}}
			>
				<View
					style={{
						backgroundColor: colors.bg,
						borderTopLeftRadius: 24,
						borderTopRightRadius: 24,
						padding: spacing.md,
						paddingBottom: spacing.xxl,
						borderTopWidth: 1,
						borderColor: colors.border,
					}}
				>
					<View
						style={{
							flexDirection: "row",
							justifyContent: "space-between",
							alignItems: "center",
							marginBottom: spacing.sm,
						}}
					>
						<View>
							<Text size="lg" weight="bold">
								{item?.name ?? ""}
							</Text>
							<Text size="xs" tone="muted">
								Stock: {item?.current_stock} {item?.unit}
							</Text>
						</View>
						<Pressable onPress={onClose} hitSlop={10}>
							<Ionicons name="close" size={24} color={colors.text} />
						</Pressable>
					</View>

					<View
						style={{
							flexDirection: "row",
							gap: spacing.xs,
							marginBottom: spacing.sm,
						}}
					>
						{TYPES.map((t) => {
							const active = type === t.type;
							return (
								<Pressable
									key={t.type}
									onPress={() => setType(t.type)}
									style={{
										flex: 1,
										paddingVertical: spacing.sm,
										borderRadius: 12,
										borderWidth: 1,
										borderColor: active ? colors.primaryLight : colors.border,
										backgroundColor: active
											? `${colors.primaryLight}26`
											: "transparent",
										alignItems: "center",
										gap: 4,
									}}
								>
									<Ionicons
										name={t.icon as never}
										size={20}
										color={active ? colors.primaryLight : colors.textMuted}
									/>
									<Text
										size="sm"
										weight="semibold"
										style={{
											color: active ? colors.primaryLight : colors.text,
										}}
									>
										{t.label}
									</Text>
								</Pressable>
							);
						})}
					</View>

					<Card>
						<Field label={type === "adjust" ? "New stock" : "Quantity"}>

							<Input
								keyboardType="decimal-pad"
								value={qty}
								onChangeText={setQty}
								placeholder="0"
							/>
						</Field>
						{type === "restock" ? (
							<Field label="Cost (₱, optional)">
								<Input
									keyboardType="decimal-pad"
									value={cost}
									onChangeText={setCost}
									placeholder="0.00"
								/>
							</Field>
						) : null}
						<Field label="Notes">
							<Input
								value={notes}
								onChangeText={setNotes}
								placeholder="Optional"
							/>
						</Field>
					</Card>

					<View style={{ marginTop: spacing.md, gap: spacing.xs }}>
						<Button
							label="Save"
							isLoading={mutation.isPending}
							isDisabled={!valid || busy}
							onPress={() => mutation.mutate()}
						/>
						<Button
							variant="destructive"
							label="Delete item"
							isLoading={deleteMutation.isPending}
							isDisabled={busy}
							onPress={confirmDelete}
						/>
						<Button variant="ghost" label="Cancel" onPress={onClose} />
					</View>
				</View>
			</KeyboardAvoidingView>
		</Modal>
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

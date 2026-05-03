import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import { Modal, Pressable, ScrollView, View } from "react-native";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { colors, radii, spacing } from "@/constants/theme";
import type { InventoryItem, Produce } from "@/lib/hydro-api";

export type BulkAddTab = "produce" | "inventory";

interface Props {
	visible: boolean;
	onClose: () => void;
	produce: Produce[];
	inventory: InventoryItem[];
	onAdd: (selection: {
		produce: Produce[];
		inventory: InventoryItem[];
	}) => void;
}

export function BulkAddSheet({
	visible,
	onClose,
	produce,
	inventory,
	onAdd,
}: Props) {
	const [tab, setTab] = useState<BulkAddTab>("produce");
	const [selectedProduce, setSelectedProduce] = useState<Set<string>>(
		new Set(),
	);
	const [selectedInventory, setSelectedInventory] = useState<Set<string>>(
		new Set(),
	);

	useEffect(() => {
		if (visible) {
			setSelectedProduce(new Set());
			setSelectedInventory(new Set());
			setTab("produce");
		}
	}, [visible]);

	const totalSelected = selectedProduce.size + selectedInventory.size;

	const eligibleProduce = useMemo(
		() => produce.filter((p) => p.expiry_status !== "expired"),
		[produce],
	);
	const eligibleInventory = useMemo(
		() => inventory.filter((i) => i.current_stock > 0),
		[inventory],
	);

	function toggleProduce(id: string) {
		setSelectedProduce((prev) => {
			const next = new Set(prev);
			if (next.has(id)) next.delete(id);
			else next.add(id);
			return next;
		});
	}
	function toggleInventory(id: string) {
		setSelectedInventory((prev) => {
			const next = new Set(prev);
			if (next.has(id)) next.delete(id);
			else next.add(id);
			return next;
		});
	}

	function handleAdd() {
		const p = produce.filter((x) => selectedProduce.has(x.id));
		const i = inventory.filter((x) => selectedInventory.has(x.id));
		onAdd({ produce: p, inventory: i });
		onClose();
	}

	const list = tab === "produce" ? eligibleProduce : eligibleInventory;

	return (
		<Modal
			visible={visible}
			transparent
			animationType="slide"
			onRequestClose={onClose}
		>
			<Pressable
				style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.6)" }}
				onPress={onClose}
			/>
			<View
				style={{
					position: "absolute",
					left: 0,
					right: 0,
					bottom: 0,
					maxHeight: "85%",
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
					<Text size="lg" weight="bold">
						Bulk add items
					</Text>
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
					<TabBtn
						label={`Produce${selectedProduce.size > 0 ? ` (${selectedProduce.size})` : ""}`}
						active={tab === "produce"}
						onPress={() => setTab("produce")}
					/>
					<TabBtn
						label={`Inventory${selectedInventory.size > 0 ? ` (${selectedInventory.size})` : ""}`}
						active={tab === "inventory"}
						onPress={() => setTab("inventory")}
					/>
				</View>

				<ScrollView style={{ maxHeight: 380 }}>
					{list.length === 0 ? (
						<Text size="sm" tone="muted" style={{ padding: spacing.md }}>
							{tab === "produce"
								? "No ready produce available."
								: "No inventory items in stock."}
						</Text>
					) : tab === "produce" ? (
						eligibleProduce.map((p) => (
							<Row
								key={p.id}
								title={p.name}
								subtitle={`${p.quantity} ${p.unit}`}
								selected={selectedProduce.has(p.id)}
								onPress={() => toggleProduce(p.id)}
							/>
						))
					) : (
						eligibleInventory.map((i) => (
							<Row
								key={i.id}
								title={i.name}
								subtitle={`${i.current_stock} ${i.unit} · ${i.category}`}
								selected={selectedInventory.has(i.id)}
								onPress={() => toggleInventory(i.id)}
							/>
						))
					)}
				</ScrollView>

				<View style={{ marginTop: spacing.md, gap: spacing.xs }}>
					<Button
						label={
							totalSelected > 0
								? `Add ${totalSelected} item${totalSelected === 1 ? "" : "s"}`
								: "Add items"
						}
						isDisabled={totalSelected === 0}
						onPress={handleAdd}
					/>
					<Button variant="ghost" label="Cancel" onPress={onClose} />
				</View>
			</View>
		</Modal>
	);
}

function TabBtn({
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
				flex: 1,
				paddingVertical: spacing.sm,
				borderRadius: radii.md,
				borderWidth: 1,
				borderColor: active ? colors.primaryLight : colors.border,
				backgroundColor: active ? `${colors.primaryLight}26` : "transparent",
				alignItems: "center",
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

function Row({
	title,
	subtitle,
	selected,
	onPress,
}: {
	title: string;
	subtitle: string;
	selected: boolean;
	onPress: () => void;
}) {
	return (
		<Pressable
			onPress={onPress}
			style={{
				flexDirection: "row",
				alignItems: "center",
				gap: spacing.sm,
				paddingVertical: spacing.sm,
				paddingHorizontal: spacing.xs,
				borderBottomWidth: 1,
				borderBottomColor: colors.borderLight,
			}}
		>
			<View
				style={{
					width: 22,
					height: 22,
					borderRadius: 6,
					borderWidth: 2,
					borderColor: selected ? colors.primaryLight : colors.border,
					backgroundColor: selected ? colors.primaryLight : "transparent",
					alignItems: "center",
					justifyContent: "center",
				}}
			>
				{selected ? (
					<Ionicons name="checkmark" size={16} color={colors.bg} />
				) : null}
			</View>
			<View style={{ flex: 1 }}>
				<Text size="md" weight="semibold">
					{title}
				</Text>
				<Text size="xs" tone="muted">
					{subtitle}
				</Text>
			</View>
		</Pressable>
	);
}

import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { BulkAddSheet } from "@/components/sales/bulk-add-sheet";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { GradientBackground } from "@/components/ui/gradient-background";
import { Input } from "@/components/ui/input";
import { Select, type SelectOption } from "@/components/ui/select";
import { Text } from "@/components/ui/text";
import { colors, spacing } from "@/constants/theme";
import { useBack } from "@/hooks/use-back";
import { useCustomToast } from "@/hooks/useCustomToast";
import {
	type InventoryItem,
	inventoryApi,
	type PaymentStatus,
	type Produce,
	produceApi,
	type SaleChannel,
	salesApi,
} from "@/lib/hydro-api";
import { useT } from "@/lib/i18n";
import { formatPHP, handleError } from "@/lib/utils";

const CHANNELS: SaleChannel[] = [
	"direct",
	"market",
	"delivery",
	"resto",
	"other",
];
const PAYMENT_STATUSES: PaymentStatus[] = ["paid", "pending", "cancelled"];

const UNIT_OPTIONS: SelectOption[] = [
	{ value: "kg", label: "kg" },
	{ value: "g", label: "g" },
	{ value: "grams", label: "grams" },
	{ value: "pcs", label: "pcs" },
	{ value: "pieces", label: "pieces" },
	{ value: "bunch", label: "bunch" },
	{ value: "sack", label: "sack" },
	{ value: "liters", label: "liters" },
	{ value: "milliliters", label: "milliliters" },
];

function ensureUnitOption(unit: string): SelectOption[] {
	if (UNIT_OPTIONS.some((o) => o.value === unit)) return UNIT_OPTIONS;
	return [...UNIT_OPTIONS, { value: unit, label: unit }];
}

type PricingMode = "per_unit" | "total";

interface LineItem {
	id: string;
	cropName: string;
	qty: string;
	unit: string;
	price: string;
	produceId: string | null;
	inventoryItemId: string | null;
	custom: boolean;
}

function newLine(): LineItem {
	return {
		id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
		cropName: "",
		qty: "1",
		unit: "kg",
		price: "0",
		produceId: null,
		inventoryItemId: null,
		custom: false,
	};
}

function lineFromProduce(p: Produce): LineItem {
	return {
		id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
		cropName: p.name,
		qty: "1",
		unit: p.unit,
		price: p.selling_price !== null ? String(p.selling_price) : "0",
		produceId: p.id,
		inventoryItemId: null,
		custom: false,
	};
}

function lineFromInventory(item: InventoryItem): LineItem {
	return {
		id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
		cropName: item.name,
		qty: "1",
		unit: item.unit,
		price: item.unit_cost !== null ? String(item.unit_cost) : "0",
		produceId: null,
		inventoryItemId: item.id,
		custom: true,
	};
}

export default function NewSaleScreen() {
	const { t } = useT();
	const qc = useQueryClient();
	const toast = useCustomToast();
	const goBack = useBack();
	const params = useLocalSearchParams<{ produce_id?: string }>();
	const [buyer, setBuyer] = useState("");
	const [channel, setChannel] = useState<SaleChannel>("direct");
	const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>("paid");
	const [notes, setNotes] = useState("");
	const [lines, setLines] = useState<LineItem[]>([newLine()]);
	const [pricingMode, setPricingMode] = useState<PricingMode>("per_unit");
	const [totalCost, setTotalCost] = useState("");
	const [bulkOpen, setBulkOpen] = useState(false);

	const readyProduce = useQuery({
		queryKey: ["produce", "ready"],
		queryFn: () => produceApi.list({ status: "ready" }),
	});
	const readyList = readyProduce.data?.data ?? [];

	const inventory = useQuery({
		queryKey: ["inventory", "all"],
		queryFn: () => inventoryApi.list(),
	});
	const inventoryList = inventory.data?.data ?? [];

	useEffect(() => {
		const pid = params.produce_id;
		if (!pid || readyList.length === 0) return;
		const p = readyList.find((r) => r.id === pid);
		if (p && lines.length === 1 && lines[0].cropName === "") {
			setLines([lineFromProduce(p)]);
		}
	}, [
		readyList.length,
		params.produce_id,
		lines[0].cropName,
		lines.length,
		readyList,
	]);

	function updateLine(id: string, patch: Partial<LineItem>) {
		setLines((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)));
	}
	function addLine() {
		setLines((prev) => [...prev, newLine()]);
	}
	function removeLine(id: string) {
		setLines((prev) =>
			prev.length <= 1 ? prev : prev.filter((l) => l.id !== id),
		);
	}
	function pickProduce(lineId: string, p: Produce) {
		updateLine(lineId, {
			cropName: p.name,
			unit: p.unit,
			price: p.selling_price !== null ? String(p.selling_price) : "0",
			produceId: p.id,
			inventoryItemId: null,
			custom: false,
		});
	}
	function pickInventory(lineId: string, item: InventoryItem) {
		updateLine(lineId, {
			cropName: item.name,
			unit: item.unit,
			price: item.unit_cost !== null ? String(item.unit_cost) : "0",
			produceId: null,
			inventoryItemId: item.id,
			custom: true,
		});
	}

	function handleBulkAdd(sel: {
		produce: Produce[];
		inventory: InventoryItem[];
	}) {
		const newLines: LineItem[] = [
			...sel.produce.map(lineFromProduce),
			...sel.inventory.map(lineFromInventory),
		];
		if (newLines.length === 0) return;
		setLines((prev) => {
			const onlyEmpty =
				prev.length === 1 &&
				prev[0].cropName === "" &&
				prev[0].produceId === null &&
				prev[0].inventoryItemId === null;
			return onlyEmpty ? newLines : [...prev, ...newLines];
		});
	}

	const totalQty = lines.reduce(
		(sum, l) => sum + (Number.parseFloat(l.qty) || 0),
		0,
	);
	const perUnitTotal = lines.reduce((sum, l) => {
		const q = Number.parseFloat(l.qty) || 0;
		const p = Number.parseFloat(l.price) || 0;
		return sum + q * p;
	}, 0);
	const totalCostNum = Number.parseFloat(totalCost) || 0;
	const displayTotal = pricingMode === "total" ? totalCostNum : perUnitTotal;

	const linesValid = lines.every(
		(l) =>
			l.cropName.trim().length > 0 &&
			Number.parseFloat(l.qty) > 0 &&
			(l.custom ? l.inventoryItemId !== null : l.produceId !== null) &&
			(pricingMode === "total" ? true : Number.parseFloat(l.price) >= 0),
	);
	const totalModeValid =
		pricingMode === "per_unit" || (totalCostNum > 0 && totalQty > 0);
	const allValid = linesValid && totalModeValid;

	const create = useMutation({
		mutationFn: () => {
			const sharedUnitPrice =
				pricingMode === "total" && totalQty > 0
					? totalCostNum / totalQty
					: null;
			return salesApi.create({
				buyer_label: buyer.trim() || undefined,
				channel,
				payment_status: paymentStatus,
				notes: notes.trim() || undefined,
				items: lines.map((l) => ({
					crop_name: l.cropName.trim(),
					quantity: Number.parseFloat(l.qty) || 0,
					unit: l.unit.trim() || "kg",
					unit_price:
						sharedUnitPrice !== null
							? sharedUnitPrice
							: Number.parseFloat(l.price) || 0,
					linked_produce_id: l.produceId,
				})),
			});
		},
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ["sales"] });
			qc.invalidateQueries({ queryKey: ["sales-dashboard"] });
			qc.invalidateQueries({ queryKey: ["produce"] });
			router.back();
		},
		onError: (err) => toast.error(handleError(err)),
	});

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
						New Sale
					</Text>
				</View>

				<Card>
					<Field label="Buyer">
						<Input
							value={buyer}
							onChangeText={setBuyer}
							placeholder="Market vendor / restaurant / person"
						/>
					</Field>
					<Field label="Channel">
						<View
							style={{
								flexDirection: "row",
								flexWrap: "wrap",
								gap: spacing.xs,
							}}
						>
							{CHANNELS.map((c) => (
								<Chip
									key={c}
									label={c}
									active={channel === c}
									onPress={() => setChannel(c)}
								/>
							))}
						</View>
					</Field>
					<Field label="Payment status">
						<View
							style={{
								flexDirection: "row",
								flexWrap: "wrap",
								gap: spacing.xs,
							}}
						>
							{PAYMENT_STATUSES.map((p) => (
								<Chip
									key={p}
									label={p}
									active={paymentStatus === p}
									onPress={() => setPaymentStatus(p)}
								/>
							))}
						</View>
					</Field>
					<Field label="Notes">
						<Input
							value={notes}
							onChangeText={setNotes}
							placeholder="Optional"
						/>
					</Field>
				</Card>

				<View style={{ marginTop: spacing.md, gap: spacing.sm }}>
					<View
						style={{
							flexDirection: "row",
							justifyContent: "space-between",
							alignItems: "center",
						}}
					>
						<Text size="lg" weight="bold">
							Items
						</Text>
						<View style={{ flexDirection: "row", gap: spacing.xs }}>
							<Pressable
								onPress={() => setBulkOpen(true)}
								style={{
									flexDirection: "row",
									alignItems: "center",
									gap: spacing.xxs,
									paddingHorizontal: 10,
									paddingVertical: 6,
									borderRadius: 8,
									borderWidth: 1,
									borderColor: colors.primaryLight,
									backgroundColor: `${colors.primaryLight}1A`,
								}}
							>
								<Ionicons name="list" size={16} color={colors.primaryLight} />
								<Text
									size="sm"
									weight="semibold"
									style={{ color: colors.primaryLight }}
								>
									Bulk add
								</Text>
							</Pressable>
							<Pressable
								onPress={addLine}
								style={{
									flexDirection: "row",
									alignItems: "center",
									gap: spacing.xxs,
									paddingHorizontal: 12,
									paddingVertical: 6,
									borderRadius: 8,
									backgroundColor: colors.buttonSolidBg,
									borderWidth: 1,
									borderColor: colors.primaryLight,
								}}
							>
								<Ionicons name="add" size={16} color={colors.text} />
								<Text
									size="sm"
									weight="semibold"
									style={{ color: colors.text }}
								>
									{t("sales.add_item")}
								</Text>
							</Pressable>
						</View>
					</View>

					<View
						style={{
							flexDirection: "row",
							gap: spacing.xs,
						}}
					>
						<PricingModeBtn
							label="Per unit"
							active={pricingMode === "per_unit"}
							onPress={() => setPricingMode("per_unit")}
						/>
						<PricingModeBtn
							label="Total"
							active={pricingMode === "total"}
							onPress={() => setPricingMode("total")}
						/>
					</View>

					{lines.map((l, idx) => (
						<Card key={l.id}>
							<View
								style={{
									flexDirection: "row",
									justifyContent: "space-between",
									alignItems: "center",
									marginBottom: spacing.xs,
								}}
							>
								<Text size="sm" weight="semibold" tone="muted">
									Item {idx + 1}
								</Text>
								{lines.length > 1 ? (
									<Pressable onPress={() => removeLine(l.id)} hitSlop={10}>
										<Ionicons
											name="close-circle"
											size={20}
											color={colors.error}
										/>
									</Pressable>
								) : null}
							</View>

							<View
								style={{
									flexDirection: "row",
									gap: spacing.xs,
									marginBottom: spacing.sm,
								}}
							>
								<Pressable
									onPress={() => {
										if (l.custom) {
											updateLine(l.id, {
												custom: false,
												inventoryItemId: null,
												cropName: "",
												unit: "kg",
												price: "0",
											});
										}
									}}
									style={{
										flex: 1,
										paddingVertical: 8,
										borderRadius: 10,
										borderWidth: 1,
										borderColor: !l.custom
											? colors.primaryLight
											: colors.border,
										backgroundColor: !l.custom
											? `${colors.primaryLight}26`
											: "transparent",
										alignItems: "center",
									}}
								>
									<Text
										size="sm"
										weight="semibold"
										style={{
											color: !l.custom ? colors.primaryLight : colors.text,
										}}
									>
										From produce
									</Text>
								</Pressable>
								<Pressable
									onPress={() => {
										if (!l.custom) {
											updateLine(l.id, {
												custom: true,
												produceId: null,
												inventoryItemId: null,
												cropName: "",
												unit: "kg",
												price: "0",
											});
										}
									}}
									style={{
										flex: 1,
										paddingVertical: 8,
										borderRadius: 10,
										borderWidth: 1,
										borderColor: l.custom ? colors.primaryLight : colors.border,
										backgroundColor: l.custom
											? `${colors.primaryLight}26`
											: "transparent",
										alignItems: "center",
									}}
								>
									<Text
										size="sm"
										weight="semibold"
										style={{
											color: l.custom ? colors.primaryLight : colors.text,
										}}
									>
										Custom
									</Text>
								</Pressable>
							</View>

							<Field label={l.custom ? "Item" : "Crop"}>
								{(() => {
									const options: SelectOption[] = l.custom
										? inventoryList.map((item) => ({
												value: item.id,
												label: `${item.name} (${item.category})`,
												disabled: item.current_stock <= 0,
												trailing: `${item.current_stock} ${item.unit}`,
											}))
										: readyList.map((p) => ({
												value: p.id,
												label:
													p.expiry_status === "expired"
														? `${p.name} — EXPIRED`
														: p.expiry_status === "warning"
															? `${p.name} — expires in ${p.days_until_expiry ?? "?"}d`
															: p.name,
												disabled: p.expiry_status === "expired",
												trailing: `${p.quantity} ${p.unit}`,
											}));
									return (
										<Select
											value={l.custom ? l.inventoryItemId : l.produceId}
											options={options}
											placeholder={
												l.custom ? "Select inventory item" : "Select produce"
											}
											emptyMessage={
												l.custom
													? "No inventory items. Add one on the Inventory tab first."
													: "No produce ready. Add some on the Inventory tab."
											}
											onValueChange={(val) => {
												if (l.custom) {
													const item = inventoryList.find((i) => i.id === val);
													if (item) pickInventory(l.id, item);
												} else {
													const p = readyList.find((r) => r.id === val);
													if (p) pickProduce(l.id, p);
												}
											}}
										/>
									);
								})()}
							</Field>
							<View style={{ flexDirection: "row", gap: spacing.xs }}>
								<View style={{ flex: 1 }}>
									<Field label="Quantity">
										<Input
											keyboardType="numeric"
											value={l.qty}
											onChangeText={(v) => updateLine(l.id, { qty: v })}
										/>
									</Field>
								</View>
								<View style={{ width: 120 }}>
									<Field label="Unit">
										<Select
											value={l.unit}
											options={ensureUnitOption(l.unit)}
											placeholder="kg"
											onValueChange={(val) => updateLine(l.id, { unit: val })}
										/>
									</Field>
								</View>
								{pricingMode === "per_unit" ? (
									<View style={{ flex: 1 }}>
										<Field label="₱/unit">
											<Input
												keyboardType="numeric"
												value={l.price}
												onChangeText={(v) => updateLine(l.id, { price: v })}
											/>
										</Field>
									</View>
								) : null}
							</View>
						</Card>
					))}
				</View>

				{pricingMode === "total" ? (
					<Card style={{ marginTop: spacing.md }}>
						<Field label="Total cost (₱)">
							<Input
								keyboardType="numeric"
								value={totalCost}
								onChangeText={setTotalCost}
								placeholder="0.00"
							/>
						</Field>
						<Text size="xs" tone="muted">
							Distributed across items by quantity. Each unit price ={" "}
							{totalQty > 0 && totalCostNum > 0
								? formatPHP(totalCostNum / totalQty)
								: "—"}
							.
						</Text>
					</Card>
				) : null}

				<Card style={{ marginTop: spacing.md }}>
					<View
						style={{
							flexDirection: "row",
							justifyContent: "space-between",
						}}
					>
						<Text weight="semibold">Total</Text>
						<Text weight="bold">{formatPHP(displayTotal)}</Text>
					</View>
				</Card>

				<View style={{ gap: spacing.xs, marginTop: spacing.lg }}>
					<Button
						label={t("sales.save")}
						isLoading={create.isPending}
						isDisabled={!allValid}
						onPress={() => create.mutate()}
					/>
					<Button
						variant="ghost"
						label={t("actions.cancel")}
						onPress={goBack}
					/>
				</View>
			</ScrollView>

			<BulkAddSheet
				visible={bulkOpen}
				onClose={() => setBulkOpen(false)}
				produce={readyList}
				inventory={inventoryList}
				onAdd={handleBulkAdd}
			/>
		</GradientBackground>
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

function PricingModeBtn({
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
				paddingVertical: 10,
				borderRadius: 10,
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

function Field({
	label,
	children,
}: {
	label: string;
	children: React.ReactNode;
}) {
	return (
		<View style={{ gap: 6, marginBottom: 14 }}>
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

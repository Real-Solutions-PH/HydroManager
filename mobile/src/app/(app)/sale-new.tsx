import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { GradientBackground } from "@/components/ui/gradient-background";
import { Input } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { colors, spacing } from "@/constants/theme";
import { useCustomToast } from "@/hooks/useCustomToast";
import {
	type PaymentStatus,
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

interface LineItem {
	id: string;
	cropName: string;
	qty: string;
	unit: string;
	price: string;
}

function newLine(): LineItem {
	return {
		id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
		cropName: "",
		qty: "1",
		unit: "kg",
		price: "0",
	};
}

export default function NewSaleScreen() {
	const { t } = useT();
	const qc = useQueryClient();
	const toast = useCustomToast();
	const [buyer, setBuyer] = useState("");
	const [channel, setChannel] = useState<SaleChannel>("direct");
	const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>("paid");
	const [notes, setNotes] = useState("");
	const [lines, setLines] = useState<LineItem[]>([newLine()]);

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

	const total = lines.reduce((sum, l) => {
		const q = Number.parseFloat(l.qty) || 0;
		const p = Number.parseFloat(l.price) || 0;
		return sum + q * p;
	}, 0);

	const allValid = lines.every(
		(l) =>
			l.cropName.trim().length > 0 &&
			Number.parseFloat(l.qty) > 0 &&
			Number.parseFloat(l.price) >= 0,
	);

	const create = useMutation({
		mutationFn: () =>
			salesApi.create({
				buyer_label: buyer.trim() || undefined,
				channel,
				payment_status: paymentStatus,
				notes: notes.trim() || undefined,
				items: lines.map((l) => ({
					crop_name: l.cropName.trim(),
					quantity: Number.parseFloat(l.qty) || 0,
					unit: l.unit.trim() || "kg",
					unit_price: Number.parseFloat(l.price) || 0,
				})),
			}),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ["sales"] });
			qc.invalidateQueries({ queryKey: ["sales-dashboard"] });
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
					<Pressable onPress={() => router.back()}>
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
						<Pressable
							onPress={addLine}
							style={{
								flexDirection: "row",
								alignItems: "center",
								gap: spacing.xxs,
								paddingHorizontal: 10,
								paddingVertical: 6,
								borderRadius: 8,
								borderWidth: 1,
								borderColor: colors.border,
							}}
						>
							<Ionicons name="add" size={16} color={colors.text} />
							<Text size="sm" weight="semibold">
								{t("sales.add_item")}
							</Text>
						</Pressable>
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
							<Field label="Crop">
								<Input
									value={l.cropName}
									onChangeText={(v) => updateLine(l.id, { cropName: v })}
									placeholder="e.g. Pechay"
								/>
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
								<View style={{ width: 90 }}>
									<Field label="Unit">
										<Input
											value={l.unit}
											onChangeText={(v) => updateLine(l.id, { unit: v })}
										/>
									</Field>
								</View>
								<View style={{ flex: 1 }}>
									<Field label="₱/unit">
										<Input
											keyboardType="numeric"
											value={l.price}
											onChangeText={(v) => updateLine(l.id, { price: v })}
										/>
									</Field>
								</View>
							</View>
						</Card>
					))}
				</View>

				<Card style={{ marginTop: spacing.md }}>
					<View
						style={{
							flexDirection: "row",
							justifyContent: "space-between",
						}}
					>
						<Text weight="semibold">Total</Text>
						<Text weight="bold">{formatPHP(total)}</Text>
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
						onPress={() => router.back()}
					/>
				</View>
			</ScrollView>
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

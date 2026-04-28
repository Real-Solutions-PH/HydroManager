import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, View } from "react-native";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { GradientBackground } from "@/components/ui/gradient-background";
import { Input } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import {
	colors,
	expiryStatusMeta,
	produceStatusMeta,
	spacing,
} from "@/constants/theme";
import { useBack } from "@/hooks/use-back";
import { useCustomToast } from "@/hooks/useCustomToast";
import { type ProduceStatus, produceApi } from "@/lib/hydro-api";
import { formatPHP, handleError } from "@/lib/utils";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const STATUSES: ProduceStatus[] = ["ready", "reserved", "sold"];

export default function ProduceDetailScreen() {
	const { id } = useLocalSearchParams<{ id: string }>();
	const qc = useQueryClient();
	const toast = useCustomToast();
	const goBack = useBack();

	const item = useQuery({
		queryKey: ["produce", id],
		queryFn: () => produceApi.get(id),
		enabled: !!id,
	});
	const movements = useQuery({
		queryKey: ["produce-movements", id],
		queryFn: () => produceApi.movements(id),
		enabled: !!id,
	});

	const [name, setName] = useState("");
	const [qty, setQty] = useState("0");
	const [unit, setUnit] = useState("");
	const [status, setStatus] = useState<ProduceStatus>("ready");
	const [expiry, setExpiry] = useState("");
	const [price, setPrice] = useState("");
	const [notes, setNotes] = useState("");

	useEffect(() => {
		if (item.data) {
			setName(item.data.name);
			setQty(String(item.data.quantity));
			setUnit(item.data.unit);
			setStatus(item.data.status);
			setExpiry(item.data.expiry_date ?? "");
			setPrice(
				item.data.selling_price !== null ? String(item.data.selling_price) : "",
			);
			setNotes(item.data.notes ?? "");
		}
	}, [item.data]);

	const update = useMutation({
		mutationFn: () => {
			if (expiry && !DATE_RE.test(expiry))
				throw new Error("Expiry date must be YYYY-MM-DD");
			return produceApi.update(id, {
				name: name.trim(),
				quantity: Number.parseFloat(qty) || 0,
				unit: unit.trim(),
				status,
				expiry_date: expiry.trim() || null,
				selling_price:
					price.trim().length > 0 ? Number.parseFloat(price) : null,
				notes: notes.trim() || undefined,
			});
		},
		onSuccess: () => {
			toast.success("Saved");
			qc.invalidateQueries({ queryKey: ["produce"] });
			qc.invalidateQueries({ queryKey: ["produce", id] });
			qc.invalidateQueries({ queryKey: ["sales-dashboard"] });
		},
		onError: (err) => toast.error(handleError(err)),
	});

	const del = useMutation({
		mutationFn: () => produceApi.delete(id),
		onSuccess: () => {
			toast.success("Deleted");
			qc.invalidateQueries({ queryKey: ["produce"] });
			qc.invalidateQueries({ queryKey: ["sales-dashboard"] });
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
	const meta = produceStatusMeta[it.status];
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
					<Pressable onPress={goBack}>
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
									Sell or consume before spoiling
								</Text>
							</View>
						</View>
					</Card>
				) : null}

				<Card>
					<Badge label={meta.label} color={meta.color} small />
					<Text size="xxxl" weight="bold" style={{ marginTop: 6 }}>
						{it.quantity}{" "}
						<Text size="md" tone="muted">
							{it.unit}
						</Text>
					</Text>
					<Text size="xs" tone="muted">
						Harvested {new Date(it.harvested_at).toLocaleDateString()}
					</Text>
					{it.selling_price !== null ? (
						<Text size="sm" tone="subtle" style={{ marginTop: 4 }}>
							{formatPHP(it.selling_price)} / {it.unit}
						</Text>
					) : null}
					{it.status === "ready" ? (
						<Button
							label="Sell now"
							onPress={() =>
								router.push({
									pathname: "/sale-new",
									params: { produce_id: it.id },
								})
							}
							style={{ marginTop: spacing.sm }}
						/>
					) : null}
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
					<Field label="Status">
						<View style={{ flexDirection: "row", gap: spacing.xs }}>
							{STATUSES.map((s) => {
								const sm = produceStatusMeta[s];
								const active = status === s;
								return (
									<Pressable
										key={s}
										onPress={() => setStatus(s)}
										style={{
											flex: 1,
											paddingVertical: 8,
											borderRadius: 10,
											borderWidth: 1,
											borderColor: active ? sm.color : colors.border,
											backgroundColor: active ? `${sm.color}26` : "transparent",
											alignItems: "center",
										}}
									>
										<Text
											size="sm"
											weight="semibold"
											style={{ color: active ? sm.color : colors.text }}
										>
											{sm.label}
										</Text>
									</Pressable>
								);
							})}
						</View>
					</Field>
					<Field label="Expiry (YYYY-MM-DD)">
						<Input
							value={expiry}
							onChangeText={setExpiry}
							autoCapitalize="none"
						/>
					</Field>
					<Field label="Selling price (₱)">
						<Input
							keyboardType="numeric"
							value={price}
							onChangeText={setPrice}
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
					History
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
									<Text weight="bold">{m.quantity}</Text>
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
						label="Delete produce"
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

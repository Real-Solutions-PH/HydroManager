import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { GradientBackground } from "@/components/ui/gradient-background";
import { Input } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { colors } from "@/constants/theme";
import { type SaleChannel, salesApi } from "@/lib/hydro-api";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { useState } from "react";
import { Alert, Pressable, ScrollView, View } from "react-native";

const CHANNELS: SaleChannel[] = [
	"direct",
	"market",
	"delivery",
	"resto",
	"other",
];

export default function NewSaleScreen() {
	const qc = useQueryClient();
	const [buyer, setBuyer] = useState("");
	const [channel, setChannel] = useState<SaleChannel>("direct");
	const [cropName, setCropName] = useState("");
	const [qty, setQty] = useState("1");
	const [unit, setUnit] = useState("kg");
	const [price, setPrice] = useState("0");
	const [notes, setNotes] = useState("");

	const create = useMutation({
		mutationFn: () =>
			salesApi.create({
				buyer_label: buyer.trim() || undefined,
				channel,
				notes: notes.trim() || undefined,
				items: [
					{
						crop_name: cropName.trim(),
						quantity: Number.parseFloat(qty) || 0,
						unit,
						unit_price: Number.parseFloat(price) || 0,
					},
				],
			}),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ["sales"] });
			qc.invalidateQueries({ queryKey: ["sales-dashboard"] });
			router.back();
		},
		onError: (e: Error) => Alert.alert("Error", e.message),
	});

	const valid =
		cropName.trim().length > 0 &&
		Number.parseFloat(qty) > 0 &&
		Number.parseFloat(price) >= 0;

	return (
		<GradientBackground>
			<ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
				<View
					style={{
						flexDirection: "row",
						alignItems: "center",
						gap: 8,
						marginBottom: 12,
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
						<View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
							{CHANNELS.map((c) => (
								<Pressable
									key={c}
									onPress={() => setChannel(c)}
									style={{
										paddingHorizontal: 12,
										paddingVertical: 6,
										borderRadius: 999,
										borderWidth: 1,
										borderColor:
											channel === c ? colors.primaryLight : colors.border,
										backgroundColor:
											channel === c
												? `${colors.primaryLight}26`
												: "transparent",
									}}
								>
									<Text
										size="sm"
										weight="semibold"
										style={{
											color: channel === c ? colors.primaryLight : colors.text,
										}}
									>
										{c}
									</Text>
								</Pressable>
							))}
						</View>
					</Field>
					<Field label="Crop">
						<Input
							value={cropName}
							onChangeText={setCropName}
							placeholder="e.g. Pechay"
						/>
					</Field>
					<View style={{ flexDirection: "row", gap: 8 }}>
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
						<View style={{ flex: 1 }}>
							<Field label="₱/unit">
								<Input
									keyboardType="numeric"
									value={price}
									onChangeText={setPrice}
								/>
							</Field>
						</View>
					</View>
					<Field label="Notes">
						<Input
							value={notes}
							onChangeText={setNotes}
							placeholder="Optional"
						/>
					</Field>
				</Card>

				<View style={{ gap: 8, marginTop: 20 }}>
					<Button
						label="Save Sale"
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
}: { label: string; children: React.ReactNode }) {
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

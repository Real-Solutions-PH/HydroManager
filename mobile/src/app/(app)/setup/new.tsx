import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { useState } from "react";
import { Alert, Image, Pressable, ScrollView, View } from "react-native";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { GradientBackground } from "@/components/ui/gradient-background";
import { Input } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { colors, systemTypes } from "@/constants/theme";
import {
	hydroAiApi,
	photosApi,
	type SetupType,
	setupsApi,
} from "@/lib/hydro-api";

const TYPES: SetupType[] = ["DFT", "NFT", "DutchBucket", "Kratky", "SNAP"];

export default function NewSetupScreen() {
	const qc = useQueryClient();
	const [name, setName] = useState("");
	const [type, setType] = useState<SetupType>("DFT");
	const [slotCount, setSlotCount] = useState("20");
	const [location, setLocation] = useState("");
	const [notes, setNotes] = useState("");
	const [photoUri, setPhotoUri] = useState<string | null>(null);
	const [analyzing, setAnalyzing] = useState(false);
	const [confidence, setConfidence] = useState<number | null>(null);

	async function pickPhoto() {
		const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
		if (!perm.granted) {
			Alert.alert(
				"Permission needed",
				"Allow photo access to use vision onboarding.",
			);
			return;
		}
		const result = await ImagePicker.launchImageLibraryAsync({
			mediaTypes: ImagePicker.MediaTypeOptions.Images,
			quality: 0.7,
		});
		if (result.canceled) return;
		const asset = result.assets[0];
		setPhotoUri(asset.uri);
		setAnalyzing(true);
		try {
			const filename = asset.fileName ?? `setup-${Date.now()}.jpg`;
			const mime = asset.mimeType ?? "image/jpeg";
			const up = await photosApi.upload("setup", asset.uri, filename, mime);
			const v = await hydroAiApi.visionOnboard(up.url);
			if (v.setup_type && TYPES.includes(v.setup_type as SetupType)) {
				setType(v.setup_type as SetupType);
			}
			if (v.estimated_slot_count > 0) {
				setSlotCount(String(v.estimated_slot_count));
			}
			if (v.layout_hint && !notes) setNotes(v.layout_hint);
			setConfidence(v.confidence);
		} catch (_e) {
			Alert.alert(
				"Vision analysis failed",
				"You can still fill the form manually.",
			);
		} finally {
			setAnalyzing(false);
		}
	}

	const createSetup = useMutation({
		mutationFn: () =>
			setupsApi.create({
				name: name.trim(),
				type,
				slot_count: Number.parseInt(slotCount, 10) || 0,
				location_label: location.trim() || undefined,
				notes: notes.trim() || undefined,
			}),
		onSuccess: (setup) => {
			qc.invalidateQueries({ queryKey: ["setups"] });
			router.replace(`/setup/${setup.id}`);
		},
		onError: (e: Error) => Alert.alert("Error", e.message),
	});

	const valid = name.trim().length > 0 && Number.parseInt(slotCount, 10) > 0;

	return (
		<GradientBackground>
			<ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
				<View
					style={{
						flexDirection: "row",
						alignItems: "center",
						gap: 8,
						marginBottom: 8,
					}}
				>
					<Pressable onPress={() => router.back()}>
						<Ionicons name="arrow-back" size={24} color={colors.text} />
					</Pressable>
					<Text size="xxl" weight="bold">
						New Setup
					</Text>
				</View>

				<Card>
					<Text
						size="xs"
						weight="semibold"
						tone="subtle"
						style={{
							textTransform: "uppercase",
							letterSpacing: 0.5,
							marginBottom: 8,
						}}
					>
						Photo onboarding (optional)
					</Text>
					{photoUri ? (
						<View>
							<Image
								source={{ uri: photoUri }}
								style={{
									width: "100%",
									height: 180,
									borderRadius: 12,
									marginBottom: 8,
								}}
							/>
							{analyzing ? (
								<Text size="sm" tone="muted">
									Analyzing...
								</Text>
							) : confidence !== null ? (
								<Text size="sm" tone="muted">
									AI confidence: {(confidence * 100).toFixed(0)}%
								</Text>
							) : null}
						</View>
					) : null}
					<Pressable
						onPress={pickPhoto}
						style={{
							flexDirection: "row",
							alignItems: "center",
							justifyContent: "center",
							gap: 8,
							paddingVertical: 12,
							borderWidth: 1,
							borderColor: colors.border,
							borderStyle: "dashed",
							borderRadius: 12,
							marginTop: 8,
						}}
					>
						<Ionicons name="camera" size={18} color={colors.text} />
						<Text weight="semibold">
							{photoUri ? "Change photo" : "Pick photo (auto-detect type)"}
						</Text>
					</Pressable>
				</Card>

				<View style={{ height: 16 }} />

				<Card>
					<Field label="Name">
						<Input
							placeholder="e.g. DFT-A"
							value={name}
							onChangeText={setName}
						/>
					</Field>

					<Field label="Setup Type">
						<View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
							{TYPES.map((tv) => {
								const active = type === tv;
								const c = systemTypes[tv];
								return (
									<Pressable
										key={tv}
										onPress={() => setType(tv)}
										style={{
											flexDirection: "row",
											alignItems: "center",
											gap: 6,
											paddingHorizontal: 12,
											paddingVertical: 8,
											borderRadius: 999,
											borderWidth: active ? 2 : 1,
											borderColor: active ? c.color : colors.border,
											backgroundColor: active ? c.bg : "transparent",
										}}
									>
										<Ionicons
											name={c.icon as never}
											size={16}
											color={active ? c.color : colors.textMuted}
										/>
										<Text
											size="sm"
											weight="semibold"
											style={{ color: active ? c.color : colors.text }}
										>
											{tv}
										</Text>
									</Pressable>
								);
							})}
						</View>
					</Field>

					<Field label="Slot Count">
						<Input
							keyboardType="numeric"
							value={slotCount}
							onChangeText={setSlotCount}
						/>
					</Field>

					<Field label="Location">
						<Input
							placeholder="e.g. Batangas greenhouse"
							value={location}
							onChangeText={setLocation}
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

				<View style={{ gap: 8, marginTop: 20 }}>
					<Button
						label="Create Setup"
						isLoading={createSetup.isPending}
						isDisabled={!valid}
						onPress={() => createSetup.mutate()}
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
		<View style={{ gap: 6, marginBottom: 16 }}>
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

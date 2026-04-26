import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as ImagePicker from "expo-image-picker";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, Image, Pressable, ScrollView, View } from "react-native";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { GradientBackground } from "@/components/ui/gradient-background";
import { Input } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { colors, spacing, systemTypes } from "@/constants/theme";
import { useBack } from "@/hooks/use-back";
import { photosApi, type SetupType, setupsApi } from "@/lib/hydro-api";

const TYPES: SetupType[] = ["DFT", "NFT", "DutchBucket", "Kratky", "SNAP"];

export default function EditSetupScreen() {
	const { id } = useLocalSearchParams<{ id: string }>();
	const setupId = id ?? "";
	const qc = useQueryClient();
	const goBack = useBack();

	const setup = useQuery({
		queryKey: ["setup", setupId],
		queryFn: () => setupsApi.get(setupId),
		enabled: !!setupId,
	});

	const [name, setName] = useState("");
	const [type, setType] = useState<SetupType>("DFT");
	const [slotCount, setSlotCount] = useState("0");
	const [location, setLocation] = useState("");
	const [notes, setNotes] = useState("");
	const [hydrated, setHydrated] = useState(false);
	const [photoPreview, setPhotoPreview] = useState<string | null>(null);
	const [uploading, setUploading] = useState(false);

	const currentPhotoUrl =
		photoPreview ?? setup.data?.photos[0]?.storage_url ?? null;

	async function pickAndUploadPhoto() {
		const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
		if (!perm.granted) {
			Alert.alert("Permission needed", "Allow photo access to add an image.");
			return;
		}
		const result = await ImagePicker.launchImageLibraryAsync({
			mediaTypes: ImagePicker.MediaTypeOptions.Images,
			quality: 0.7,
		});
		if (result.canceled) return;
		const asset = result.assets[0];
		setPhotoPreview(asset.uri);
		setUploading(true);
		try {
			const mime = asset.mimeType ?? "image/jpeg";
			const up = await photosApi.upload("setup", asset.uri, mime);
			await setupsApi.addPhoto(setupId, up.url);
			qc.invalidateQueries({ queryKey: ["setup", setupId] });
			qc.invalidateQueries({ queryKey: ["setups"] });
			setPhotoPreview(up.url);
		} catch (e) {
			setPhotoPreview(null);
			Alert.alert("Upload failed", (e as Error).message);
		} finally {
			setUploading(false);
		}
	}

	useEffect(() => {
		if (!hydrated && setup.data) {
			setName(setup.data.name);
			setType(setup.data.type);
			setSlotCount(String(setup.data.slot_count));
			setLocation(setup.data.location_label ?? "");
			setNotes(setup.data.notes ?? "");
			setHydrated(true);
		}
	}, [setup.data, hydrated]);

	const update = useMutation({
		mutationFn: () => {
			const parsed = Number.parseInt(slotCount, 10) || 0;
			return setupsApi.update(setupId, {
				name: name.trim(),
				type,
				slot_count: parsed,
				location_label: location.trim() || null,
				notes: notes.trim() || null,
			});
		},
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ["setup", setupId] });
			qc.invalidateQueries({ queryKey: ["setups"] });
			router.back();
		},
		onError: (e: Error) => Alert.alert("Update failed", e.message),
	});

	const valid =
		name.trim().length > 0 && Number.parseInt(slotCount, 10) > 0;

	if (setup.isLoading || !hydrated)
		return (
			<GradientBackground>
				<View
					style={{
						flex: 1,
						alignItems: "center",
						justifyContent: "center",
					}}
				>
					<Text tone="muted">Loading...</Text>
				</View>
			</GradientBackground>
		);

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
					<Pressable onPress={goBack}>
						<Ionicons name="arrow-back" size={24} color={colors.text} />
					</Pressable>
					<Text size="xxl" weight="bold">
						Edit Setup
					</Text>
				</View>

				<Card>
					<Field label="Photo">
						{currentPhotoUrl ? (
							<Image
								source={{ uri: currentPhotoUrl }}
								style={{
									width: "100%",
									height: 180,
									borderRadius: 12,
									marginBottom: spacing.xs,
									backgroundColor: colors.glass,
								}}
							/>
						) : null}
						<Pressable
							onPress={pickAndUploadPhoto}
							disabled={uploading}
							style={{
								flexDirection: "row",
								alignItems: "center",
								justifyContent: "center",
								gap: spacing.xs,
								paddingVertical: spacing.sm,
								borderWidth: 1,
								borderColor: colors.border,
								borderStyle: "dashed",
								borderRadius: 12,
								opacity: uploading ? 0.6 : 1,
							}}
						>
							<Ionicons name="camera" size={18} color={colors.text} />
							<Text weight="semibold">
								{uploading
									? "Uploading..."
									: currentPhotoUrl
										? "Change photo"
										: "Add photo"}
							</Text>
						</Pressable>
					</Field>

					<Field label="Name">
						<Input value={name} onChangeText={setName} />
					</Field>

					<Field label="Setup Type">
						<View
							style={{
								flexDirection: "row",
								flexWrap: "wrap",
								gap: spacing.xs,
							}}
						>
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
											paddingHorizontal: spacing.sm,
											paddingVertical: spacing.xs,
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
						<Text size="xs" tone="muted" style={{ marginTop: 4 }}>
							Shrinking only allowed if trailing slots empty.
						</Text>
					</Field>

					<Field label="Location">
						<Input value={location} onChangeText={setLocation} />
					</Field>

					<Field label="Notes">
						<Input
							value={notes}
							onChangeText={setNotes}
							multiline
							placeholder="Optional"
						/>
					</Field>
				</Card>

				<View style={{ gap: spacing.xs, marginTop: spacing.lg }}>
					<Button
						label="Save Changes"
						isLoading={update.isPending}
						isDisabled={!valid || update.isPending}
						onPress={() => update.mutate()}
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

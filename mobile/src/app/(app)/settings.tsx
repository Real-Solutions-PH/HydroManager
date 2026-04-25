import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
	Alert,
	Linking,
	Modal,
	Platform,
	Pressable,
	ScrollView,
	View,
} from "react-native";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { GradientBackground } from "@/components/ui/gradient-background";
import { Input } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { colors, spacing } from "@/constants/theme";
import { useAuth } from "@/hooks/useAuth";
import { useCustomToast } from "@/hooks/useCustomToast";
import { paymongoApi, usersApi } from "@/lib/hydro-api";
import { useI18n, useT } from "@/lib/i18n";
import { formatPHP, handleError } from "@/lib/utils";

export default function SettingsScreen() {
	const { t } = useT();
	const toast = useCustomToast();
	const locale = useI18n((s) => s.locale);
	const setLocale = useI18n((s) => s.setLocale);
	const { logout } = useAuth();
	const qc = useQueryClient();

	const me = useQuery({ queryKey: ["me"], queryFn: () => usersApi.me() });

	const [editOpen, setEditOpen] = useState(false);
	const [nameDraft, setNameDraft] = useState("");

	useEffect(() => {
		if (editOpen) setNameDraft(me.data?.full_name ?? "");
	}, [editOpen, me.data?.full_name]);

	const saveLocale = useMutation({
		mutationFn: (l: "en" | "tl") =>
			usersApi.updateMe({ locale: l }).catch(() => undefined),
		onSuccess: () => qc.invalidateQueries({ queryKey: ["me"] }),
	});

	const saveName = useMutation({
		mutationFn: (name: string) => usersApi.updateMe({ full_name: name }),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ["me"] });
			toast.success("Profile updated");
			setEditOpen(false);
		},
		onError: (err) => toast.error(handleError(err)),
	});

	async function upgrade(tier: "grower" | "pro") {
		try {
			const r = await paymongoApi.checkout(tier, "monthly");
			Linking.openURL(r.checkout_url);
		} catch (e) {
			Alert.alert("Error", handleError(e));
		}
	}

	function confirmLogout() {
		if (Platform.OS === "web") {
			const ok = globalThis.window?.confirm?.(
				`${t("settings.logout_title")}\n\n${t("settings.logout_body")}`,
			);
			if (ok) logout();
			return;
		}
		Alert.alert(t("settings.logout_title"), t("settings.logout_body"), [
			{ text: t("actions.cancel"), style: "cancel" },
			{
				text: t("actions.logout"),
				style: "destructive",
				onPress: () => logout(),
			},
		]);
	}

	return (
		<GradientBackground>
			<ScrollView
				contentContainerStyle={{
					padding: spacing.md,
					paddingBottom: 120,
				}}
			>
				<View
					style={{
						flexDirection: "row",
						alignItems: "center",
						gap: spacing.xs,
						marginBottom: spacing.md,
					}}
				>
					<Pressable onPress={() => router.back()}>
						<Ionicons name="arrow-back" size={24} color={colors.text} />
					</Pressable>
					<Text size="xxl" weight="bold">
						{t("settings.title")}
					</Text>
				</View>

				<Card>
					<View
						style={{
							flexDirection: "row",
							justifyContent: "space-between",
							alignItems: "flex-start",
						}}
					>
						<View style={{ flex: 1 }}>
							<Text size="lg" weight="bold">
								{me.data?.full_name ?? "User"}
							</Text>
							<Text tone="muted">{me.data?.email}</Text>
						</View>
						<Pressable
							onPress={() => setEditOpen(true)}
							hitSlop={10}
							style={{
								padding: 6,
								borderRadius: 8,
								borderWidth: 1,
								borderColor: colors.border,
							}}
						>
							<Ionicons name="pencil" size={16} color={colors.text} />
						</Pressable>
					</View>
					<View
						style={{
							flexDirection: "row",
							alignItems: "center",
							gap: spacing.xs,
							marginTop: 10,
						}}
					>
						<View
							style={{
								paddingHorizontal: spacing.sm,
								paddingVertical: spacing.xxs,
								borderRadius: 999,
								backgroundColor: `${colors.primaryLight}26`,
							}}
						>
							<Text
								size="xs"
								weight="bold"
								style={{ color: colors.primaryLight }}
							>
								{me.data?.tier?.toUpperCase() ?? "FREE"}
							</Text>
						</View>
					</View>
				</Card>

				{me.data?.tier !== "pro" ? (
					<View style={{ gap: spacing.xs, marginTop: spacing.md }}>
						{me.data?.tier === "free" ? (
							<Button
								label={`Upgrade to Grower (${formatPHP(199, 0)}/mo)`}
								onPress={() => upgrade("grower")}
							/>
						) : null}
						<Button
							variant="outline"
							label={`Upgrade to Pro (${formatPHP(299, 0)}/mo)`}
							onPress={() => upgrade("pro")}
						/>
					</View>
				) : null}

				<View style={{ marginTop: spacing.lg }}>
					<Text
						size="xs"
						weight="semibold"
						tone="muted"
						style={{
							textTransform: "uppercase",
							letterSpacing: 0.5,
							marginBottom: spacing.xs,
						}}
					>
						{t("settings.language")}
					</Text>
					<Card>
						<View style={{ flexDirection: "row", gap: 10 }}>
							<LocaleBtn
								label={t("settings.english")}
								active={locale === "en"}
								onPress={() => {
									setLocale("en");
									saveLocale.mutate("en");
								}}
							/>
							<LocaleBtn
								label={t("settings.tagalog")}
								active={locale === "tl"}
								onPress={() => {
									setLocale("tl");
									saveLocale.mutate("tl");
								}}
							/>
						</View>
					</Card>
				</View>

				<View style={{ marginTop: spacing.lg }}>
					<Button
						variant="danger"
						label={t("actions.logout")}
						onPress={confirmLogout}
					/>
				</View>
			</ScrollView>

			<Modal
				visible={editOpen}
				transparent
				animationType="fade"
				onRequestClose={() => setEditOpen(false)}
			>
				<View
					style={{
						flex: 1,
						backgroundColor: "rgba(0,0,0,0.5)",
						justifyContent: "center",
						padding: spacing.lg,
					}}
				>
					<Card variant="outlined" style={{ backgroundColor: colors.bgMid }}>
						<Text size="lg" weight="bold" style={{ marginBottom: spacing.sm }}>
							{t("settings.edit_profile")}
						</Text>
						<Text
							size="xs"
							weight="semibold"
							tone="subtle"
							style={{
								textTransform: "uppercase",
								letterSpacing: 0.5,
								marginBottom: 6,
							}}
						>
							Full name
						</Text>
						<Input
							value={nameDraft}
							onChangeText={setNameDraft}
							placeholder="Jane Doe"
						/>
						<View
							style={{
								flexDirection: "row",
								gap: spacing.xs,
								marginTop: spacing.md,
							}}
						>
							<View style={{ flex: 1 }}>
								<Button
									variant="outline"
									label="Cancel"
									onPress={() => setEditOpen(false)}
								/>
							</View>
							<View style={{ flex: 1 }}>
								<Button
									label="Save"
									isLoading={saveName.isPending}
									isDisabled={nameDraft.trim().length === 0}
									onPress={() => saveName.mutate(nameDraft.trim())}
								/>
							</View>
						</View>
					</Card>
				</View>
			</Modal>
		</GradientBackground>
	);
}

function LocaleBtn({
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
				borderRadius: 12,
				borderWidth: 1,
				borderColor: active ? colors.primaryLight : colors.border,
				backgroundColor: active ? `${colors.primaryLight}26` : "transparent",
				alignItems: "center",
			}}
		>
			<Text
				weight="semibold"
				style={{ color: active ? colors.primaryLight : colors.text }}
			>
				{label}
			</Text>
		</Pressable>
	);
}

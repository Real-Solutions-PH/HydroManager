import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
	KeyboardAvoidingView,
	Modal,
	Platform,
	Pressable,
	ScrollView,
	View,
} from "react-native";
import { Input } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { colors, spacing } from "@/constants/theme";
import { hydroAiApi } from "@/lib/hydro-api";
import { useT } from "@/lib/i18n";
import { QK } from "@/lib/query-config";
import { handleError } from "@/lib/utils";

interface Msg {
	id: string;
	role: "user" | "assistant";
	content: string;
	citations?: { type: string; id: string; label: string }[];
}

function makeMsgId(): string {
	return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function AIChatFab() {
	const { t } = useT();
	const [open, setOpen] = useState(false);
	const qc = useQueryClient();
	const quota = useQuery({
		queryKey: QK.aiQuota(),
		queryFn: () => hydroAiApi.quota(),
		enabled: open,
	});
	const [input, setInput] = useState("");
	const [msgs, setMsgs] = useState<Msg[]>([]);

	const quotaReached = quota.data !== undefined && quota.data.remaining <= 0;

	const send = useMutation({
		mutationFn: (m: string) => hydroAiApi.chat(m),
		onSuccess: (r) => {
			setMsgs((prev) => [
				...prev,
				{
					id: makeMsgId(),
					role: "assistant",
					content: r.answer,
					citations: r.citations,
				},
			]);
			qc.invalidateQueries({ queryKey: QK.aiQuota() });
		},
		onError: (err) => {
			setMsgs((prev) => [
				...prev,
				{
					id: makeMsgId(),
					role: "assistant",
					content: `Error: ${handleError(err)}`,
				},
			]);
			qc.invalidateQueries({ queryKey: QK.aiQuota() });
		},
	});

	function submit() {
		if (!input.trim() || quotaReached) return;
		const m = input.trim();
		setMsgs((p) => [...p, { id: makeMsgId(), role: "user", content: m }]);
		setInput("");
		send.mutate(m);
	}

	return (
		<>
			<Pressable
				onPress={() => setOpen(true)}
				style={({ pressed }) => ({
					position: "absolute",
					right: 16,
					bottom: 90,
					width: 56,
					height: 56,
					borderRadius: 28,
					backgroundColor: colors.buttonSolidBg,
					alignItems: "center",
					justifyContent: "center",
					shadowColor: "#000",
					shadowOpacity: 0.3,
					shadowRadius: 6,
					opacity: pressed ? 0.92 : 1,
					transform: [{ scale: pressed ? 0.96 : 1 }],
				})}
			>
				<Ionicons name="sparkles" size={24} color="#FFFFFF" />
			</Pressable>

			<Modal
				visible={open}
				animationType="slide"
				onRequestClose={() => setOpen(false)}
			>
				<KeyboardAvoidingView
					behavior={Platform.OS === "ios" ? "padding" : "height"}
					style={{ flex: 1, backgroundColor: colors.bg }}
				>
					<View
						style={{
							flexDirection: "row",
							alignItems: "center",
							justifyContent: "space-between",
							padding: spacing.md,
							paddingTop: spacing.jumbo,
							borderBottomColor: colors.borderLight,
							borderBottomWidth: 1,
						}}
					>
						<View>
							<Text size="lg" weight="bold">
								Crop Assistant
							</Text>
							{quota.data ? (
								<Text size="xs" tone="muted">
									{quota.data.used}/{quota.data.limit} used · {quota.data.tier}
								</Text>
							) : null}
						</View>
						<Pressable onPress={() => setOpen(false)}>
							<Ionicons name="close" size={24} color={colors.text} />
						</Pressable>
					</View>

					<ScrollView
						style={{ flex: 1 }}
						contentContainerStyle={{ padding: spacing.md, gap: 10 }}
					>
						{msgs.length === 0 ? (
							<Text
								tone="muted"
								style={{ textAlign: "center", marginTop: spacing.xxxl }}
							>
								Tanungin mo — e.g. "Bakit may tip burn ang pechay ko?"
							</Text>
						) : null}
						{msgs.map((m) => (
							<View
								key={m.id}
								style={{
									alignSelf: m.role === "user" ? "flex-end" : "flex-start",
									maxWidth: "85%",
								}}
							>
								<View
									style={{
										backgroundColor:
											m.role === "user"
												? colors.buttonSolidBg
												: colors.surfaceVariant,
										borderWidth: m.role === "assistant" ? 1 : 0,
										borderColor: colors.border,
										paddingHorizontal: 14,
										paddingVertical: 10,
										borderRadius: 16,
									}}
								>
									<Text>{m.content}</Text>
								</View>
								{m.citations?.length ? (
									<View
										style={{
											flexDirection: "row",
											flexWrap: "wrap",
											gap: spacing.xxs,
											marginTop: 6,
										}}
									>
										{m.citations.slice(0, 4).map((c) => (
											<View
												key={`${c.type}-${c.id}`}
												style={{
													paddingHorizontal: spacing.xs,
													paddingVertical: 2,
													borderRadius: 999,
													backgroundColor: colors.glass,
												}}
											>
												<Text size="xs" tone="muted">
													{c.type}: {c.label}
												</Text>
											</View>
										))}
									</View>
								) : null}
							</View>
						))}
						{send.isPending ? <Text tone="muted">Thinking...</Text> : null}
					</ScrollView>

					{quotaReached ? (
						<View
							style={{
								paddingHorizontal: spacing.md,
								paddingVertical: 10,
								backgroundColor: `${colors.error}1F`,
								borderTopColor: colors.error,
								borderTopWidth: 1,
							}}
						>
							<Text size="sm" weight="semibold" style={{ color: colors.error }}>
								{t("ai.quota_reached")}
							</Text>
							<Text size="xs" tone="muted">
								You've used {quota.data?.used ?? 0}/{quota.data?.limit ?? 0}{" "}
								messages this period.
							</Text>
						</View>
					) : null}

					<View
						style={{
							flexDirection: "row",
							padding: spacing.sm,
							gap: spacing.xs,
							borderTopColor: colors.borderLight,
							borderTopWidth: 1,
						}}
					>
						<View style={{ flex: 1 }}>
							<Input
								value={input}
								onChangeText={setInput}
								placeholder={
									quotaReached ? t("ai.quota_reached") : t("ai.placeholder")
								}
								onSubmitEditing={submit}
								editable={!quotaReached && !send.isPending}
							/>
						</View>
						<Pressable
							onPress={submit}
							disabled={send.isPending || !input.trim() || quotaReached}
							style={{
								width: 44,
								height: 44,
								borderRadius: 12,
								backgroundColor: colors.buttonSolidBg,
								alignItems: "center",
								justifyContent: "center",
								opacity:
									send.isPending || !input.trim() || quotaReached ? 0.5 : 1,
							}}
						>
							<Ionicons name="send" size={18} color="#FFFFFF" />
						</Pressable>
					</View>
				</KeyboardAvoidingView>
			</Modal>
		</>
	);
}

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { GradientBackground } from "@/components/ui/gradient-background";
import { Input } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { colors } from "@/constants/theme";
import { MILESTONE_ORDER, type Milestone, batchesApi } from "@/lib/hydro-api";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Alert, Pressable, ScrollView, View } from "react-native";

const ALL_TARGETS: Milestone[] = [...MILESTONE_ORDER, "Failed"];

export default function BatchDetailScreen() {
	const { id } = useLocalSearchParams<{ id: string }>();
	const batchId = id ?? "";
	const qc = useQueryClient();

	const batch = useQuery({
		queryKey: ["batch", batchId],
		queryFn: () => batchesApi.get(batchId),
		enabled: !!batchId,
	});

	const [from, setFrom] = useState<Milestone>("Sowed");
	const [to, setTo] = useState<Milestone>("Germinated");
	const [cnt, setCnt] = useState("");
	const [notes, setNotes] = useState("");

	const transition = useMutation({
		mutationFn: () =>
			batchesApi.transition(batchId, {
				from_milestone: from,
				to_milestone: to,
				count: Number.parseInt(cnt, 10) || 0,
				notes: notes.trim() || undefined,
			}),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ["batch", batchId] });
			qc.invalidateQueries({ queryKey: ["batches"] });
			setCnt("");
			setNotes("");
		},
		onError: (e: Error) => Alert.alert("Error", e.message),
	});

	const [hw, setHw] = useState("");
	const [hc, setHc] = useState("");

	const harvest = useMutation({
		mutationFn: () =>
			batchesApi.harvest(batchId, {
				weight_grams: Number.parseFloat(hw) || 0,
				count: Number.parseInt(hc, 10) || 0,
			}),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ["batch", batchId] });
			setHw("");
			setHc("");
			Alert.alert("Saved", "Harvest recorded.");
		},
		onError: (e: Error) => Alert.alert("Error", e.message),
	});

	if (batch.isLoading)
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
	if (!batch.data)
		return (
			<GradientBackground>
				<View
					style={{
						flex: 1,
						alignItems: "center",
						justifyContent: "center",
					}}
				>
					<Text tone="muted">Not found.</Text>
				</View>
			</GradientBackground>
		);

	const b = batch.data;
	const byMs = new Map(b.state_counts.map((c) => [c.milestone_code, c.count]));
	const age = Math.floor(
		(Date.now() - new Date(b.started_at).getTime()) / 86400000,
	);
	const available = byMs.get(from) ?? 0;

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
					<View style={{ flex: 1 }}>
						<Text size="xxl" weight="bold">
							{b.variety_name}
						</Text>
						<Text size="xs" tone="muted">
							Day {age} · {b.initial_count} units initial
						</Text>
					</View>
				</View>

				<Card>
					<Text
						size="xs"
						weight="semibold"
						tone="muted"
						style={{
							textTransform: "uppercase",
							letterSpacing: 0.5,
							marginBottom: 8,
						}}
					>
						Current distribution
					</Text>
					<View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
						{MILESTONE_ORDER.filter((m) => (byMs.get(m) ?? 0) > 0).map((m) => (
							<Badge
								key={m}
								label={`${m} · ${byMs.get(m)}`}
								color={colors.primaryLight}
								small
							/>
						))}
						{(byMs.get("Failed") ?? 0) > 0 ? (
							<Badge
								label={`Failed · ${byMs.get("Failed")}`}
								color={colors.error}
								small
							/>
						) : null}
					</View>
				</Card>

				<View style={{ height: 20 }} />

				<Card>
					<Text size="lg" weight="bold">
						Record Transition
					</Text>
					<Text size="xs" tone="muted" style={{ marginBottom: 12 }}>
						Nothing auto-advances. You approve each step.
					</Text>

					<Label>FROM</Label>
					<View
						style={{
							flexDirection: "row",
							flexWrap: "wrap",
							gap: 6,
							marginBottom: 12,
						}}
					>
						{MILESTONE_ORDER.map((m) => {
							const has = (byMs.get(m) ?? 0) > 0;
							const active = from === m;
							return (
								<Pressable
									key={m}
									disabled={!has}
									onPress={() => setFrom(m)}
									style={{
										paddingHorizontal: 8,
										paddingVertical: 4,
										borderRadius: 999,
										borderWidth: 1,
										borderColor: active ? colors.primaryLight : colors.border,
										backgroundColor: active
											? `${colors.primaryLight}26`
											: "transparent",
										opacity: has ? 1 : 0.35,
									}}
								>
									<Text
										size="xs"
										weight="semibold"
										style={{
											color: active ? colors.primaryLight : colors.text,
										}}
									>
										{m}
										{has ? ` (${byMs.get(m)})` : ""}
									</Text>
								</Pressable>
							);
						})}
					</View>

					<Label>TO</Label>
					<View
						style={{
							flexDirection: "row",
							flexWrap: "wrap",
							gap: 6,
							marginBottom: 12,
						}}
					>
						{ALL_TARGETS.map((m) => {
							const active = to === m;
							const err = m === "Failed";
							const col = err ? colors.error : colors.primaryLight;
							return (
								<Pressable
									key={m}
									onPress={() => setTo(m)}
									style={{
										paddingHorizontal: 8,
										paddingVertical: 4,
										borderRadius: 999,
										borderWidth: 1,
										borderColor: active ? col : colors.border,
										backgroundColor: active ? `${col}26` : "transparent",
									}}
								>
									<Text
										size="xs"
										weight="semibold"
										style={{ color: active ? col : colors.text }}
									>
										{m}
									</Text>
								</Pressable>
							);
						})}
					</View>

					<Label>{`COUNT (max ${available})`}</Label>
					<Input
						keyboardType="numeric"
						value={cnt}
						onChangeText={setCnt}
						placeholder={`How many ${from} → ${to}?`}
					/>

					<View style={{ height: 12 }} />
					<Label>NOTES</Label>
					<Input value={notes} onChangeText={setNotes} placeholder="Optional" />

					<View style={{ height: 16 }} />
					<Button
						label="Save Transition"
						isLoading={transition.isPending}
						isDisabled={
							Number.parseInt(cnt, 10) <= 0 ||
							Number.parseInt(cnt, 10) > available ||
							from === to
						}
						onPress={() => transition.mutate()}
					/>
				</Card>

				<View style={{ height: 20 }} />

				<Card>
					<Text size="lg" weight="bold">
						Record Harvest
					</Text>
					<Text size="xs" tone="muted" style={{ marginBottom: 12 }}>
						Available in HarvestReady: {byMs.get("HarvestReady") ?? 0}
					</Text>
					<View style={{ flexDirection: "row", gap: 10 }}>
						<View style={{ flex: 1 }}>
							<Label>WEIGHT (g)</Label>
							<Input keyboardType="numeric" value={hw} onChangeText={setHw} />
						</View>
						<View style={{ flex: 1 }}>
							<Label>COUNT</Label>
							<Input keyboardType="numeric" value={hc} onChangeText={setHc} />
						</View>
					</View>
					<View style={{ height: 16 }} />
					<Button
						label="Record Harvest"
						isLoading={harvest.isPending}
						isDisabled={
							Number.parseFloat(hw) <= 0 || Number.parseInt(hc, 10) <= 0
						}
						onPress={() => harvest.mutate()}
					/>
				</Card>

				<View style={{ height: 20 }} />

				<Card>
					<Text size="lg" weight="bold" style={{ marginBottom: 8 }}>
						Recent Transitions
					</Text>
					{b.recent_transitions.length === 0 ? (
						<Text size="sm" tone="muted">
							No transitions yet.
						</Text>
					) : (
						<View style={{ gap: 10 }}>
							{b.recent_transitions.map((t) => (
								<View
									key={t.id}
									style={{
										borderWidth: 1,
										borderColor: colors.borderLight,
										borderRadius: 12,
										padding: 12,
									}}
								>
									<Text size="sm" weight="semibold">
										{t.from_milestone} → {t.to_milestone} · {t.count}
									</Text>
									<Text size="xs" tone="muted">
										{new Date(t.occurred_at).toLocaleString()}
									</Text>
									{t.notes ? (
										<Text size="xs" style={{ marginTop: 4 }}>
											{t.notes}
										</Text>
									) : null}
								</View>
							))}
						</View>
					)}
				</Card>
			</ScrollView>
		</GradientBackground>
	);
}

function Label({ children }: { children: React.ReactNode }) {
	return (
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
			{children}
		</Text>
	);
}

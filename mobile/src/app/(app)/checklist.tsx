import { Card } from "@/components/ui/card";
import { GradientBackground } from "@/components/ui/gradient-background";
import { Text } from "@/components/ui/text";
import { colors } from "@/constants/theme";
import { type Batch, batchesApi } from "@/lib/hydro-api";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { Link } from "expo-router";
import { FlatList, Pressable, View } from "react-native";

interface Task {
	id: string;
	title: string;
	detail: string;
	urgency: "overdue" | "today" | "soon";
	batchId?: string;
}

function deriveTasks(batches: Batch[]): Task[] {
	const out: Task[] = [];
	const now = Date.now();
	for (const b of batches) {
		const age = Math.floor((now - new Date(b.started_at).getTime()) / 86400000);
		if (age >= 2) {
			out.push({
				id: `${b.id}-check`,
				title: `Check germination: ${b.variety_name}`,
				detail: `Day ${age} since sow. Log germinated count.`,
				urgency: age > 5 ? "overdue" : "today",
				batchId: b.id,
			});
		}
		if (age >= 7 && age % 2 === 0) {
			out.push({
				id: `${b.id}-ph`,
				title: `Log pH/EC reading: ${b.variety_name}`,
				detail: "Every 2 days for active reservoir.",
				urgency: "today",
				batchId: b.id,
			});
		}
		if (age >= 25) {
			out.push({
				id: `${b.id}-harvest`,
				title: `Harvest ready? ${b.variety_name}`,
				detail: `${age} days elapsed. Inspect for harvest signs.`,
				urgency: "soon",
				batchId: b.id,
			});
		}
	}
	return out.sort(
		(a, b) =>
			["overdue", "today", "soon"].indexOf(a.urgency) -
			["overdue", "today", "soon"].indexOf(b.urgency),
	);
}

export default function ChecklistScreen() {
	const batches = useQuery({
		queryKey: ["batches"],
		queryFn: () => batchesApi.list(),
	});
	const tasks = deriveTasks(batches.data?.data ?? []);
	const overdue = tasks.filter((t) => t.urgency === "overdue").length;
	const today = tasks.filter((t) => t.urgency === "today").length;
	const soon = tasks.filter((t) => t.urgency === "soon").length;
	const total = tasks.length;
	const progress = 0;

	return (
		<GradientBackground>
			<View style={{ paddingHorizontal: 16, paddingTop: 8 }}>
				<Text size="xxl" weight="bold">
					Tasks
				</Text>
				<Text size="sm" tone="muted">
					Setup-aware daily checklist
				</Text>
			</View>

			<View style={{ paddingHorizontal: 16, paddingTop: 16 }}>
				<Card>
					<View
						style={{
							flexDirection: "row",
							justifyContent: "space-between",
							marginBottom: 12,
						}}
					>
						<Text weight="semibold">Today's progress</Text>
						<Text tone="muted">
							{progress}/{total}
						</Text>
					</View>
					<View
						style={{
							height: 8,
							backgroundColor: colors.glass,
							borderRadius: 999,
							overflow: "hidden",
						}}
					>
						<View
							style={{
								width: total > 0 ? `${(progress / total) * 100}%` : "0%",
								height: 8,
								backgroundColor: colors.primaryLight,
								borderRadius: 999,
							}}
						/>
					</View>
					<View style={{ flexDirection: "row", gap: 8, marginTop: 12 }}>
						<CountChip label={`${overdue} overdue`} color={colors.error} />
						<CountChip label={`${today} today`} color={colors.primaryLight} />
						<CountChip label={`${soon} soon`} color={colors.textMuted} />
					</View>
				</Card>
			</View>

			{(batches.data?.data ?? []).length === 0 ? (
				<View
					style={{
						flex: 1,
						alignItems: "center",
						justifyContent: "center",
						padding: 32,
					}}
				>
					<Ionicons
						name="checkbox-outline"
						size={48}
						color={colors.textMuted}
					/>
					<Text tone="muted" style={{ marginTop: 12, textAlign: "center" }}>
						Start a batch to see setup-aware tasks.
					</Text>
					<Link href="/batch/new" asChild>
						<Pressable
							style={{
								marginTop: 16,
								backgroundColor: colors.buttonSolidBg,
								paddingHorizontal: 16,
								paddingVertical: 10,
								borderRadius: 12,
							}}
						>
							<Text weight="semibold">+ Start a Batch</Text>
						</Pressable>
					</Link>
				</View>
			) : (
				<FlatList
					data={tasks}
					keyExtractor={(t) => t.id}
					contentContainerStyle={{ padding: 16, gap: 10 }}
					ListEmptyComponent={
						<Text tone="muted">All caught up! Pahinga ka muna.</Text>
					}
					renderItem={({ item }) => <TaskRow task={item} />}
				/>
			)}
		</GradientBackground>
	);
}

function CountChip({ label, color }: { label: string; color: string }) {
	return (
		<View
			style={{
				paddingHorizontal: 10,
				paddingVertical: 4,
				borderRadius: 999,
				backgroundColor: `${color}26`,
			}}
		>
			<Text size="xs" weight="semibold" style={{ color }}>
				{label}
			</Text>
		</View>
	);
}

function TaskRow({ task }: { task: Task }) {
	const accent =
		task.urgency === "overdue"
			? colors.error
			: task.urgency === "today"
				? colors.primaryLight
				: colors.textMuted;
	return (
		<Link href={task.batchId ? `/batch/${task.batchId}` : "/"} asChild>
			<Pressable>
				<Card style={{ borderLeftWidth: 4, borderLeftColor: accent }}>
					<View
						style={{
							flexDirection: "row",
							alignItems: "flex-start",
							gap: 12,
						}}
					>
						<Ionicons name="ellipse-outline" size={22} color={accent} />
						<View style={{ flex: 1 }}>
							<Text weight="semibold">{task.title}</Text>
							<Text size="xs" tone="muted" style={{ marginTop: 4 }}>
								{task.detail}
							</Text>
						</View>
					</View>
				</Card>
			</Pressable>
		</Link>
	);
}

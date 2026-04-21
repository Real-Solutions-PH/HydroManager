import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { Link } from "expo-router";
import { useMemo, useState } from "react";
import { FlatList, Pressable, View } from "react-native";
import { Card } from "@/components/ui/card";
import { GradientBackground } from "@/components/ui/gradient-background";
import { Text } from "@/components/ui/text";
import { colors, spacing } from "@/constants/theme";
import {
	type Batch,
	batchesApi,
	type ChecklistTask,
	checklistApi,
} from "@/lib/hydro-api";
import { mmkv } from "@/lib/storage";

type UrgencyKey = "overdue" | "today" | "soon";

interface UiTask {
	id: string;
	title: string;
	detail: string;
	urgency: UrgencyKey;
	batchId?: string;
}

const COMPLETIONS_KEY = "hydro-checklist-completed";

function todayKey(): string {
	const d = new Date();
	return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

function loadCompleted(): Set<string> {
	try {
		const raw = mmkv.getString(COMPLETIONS_KEY);
		if (!raw) return new Set();
		const parsed = JSON.parse(raw) as { date: string; ids: string[] };
		if (parsed.date !== todayKey()) return new Set();
		return new Set(parsed.ids);
	} catch {
		return new Set();
	}
}

function saveCompleted(ids: Set<string>): void {
	mmkv.set(
		COMPLETIONS_KEY,
		JSON.stringify({ date: todayKey(), ids: Array.from(ids) }),
	);
}

function deriveLocalTasks(batches: Batch[]): UiTask[] {
	const out: UiTask[] = [];
	const now = Date.now();
	for (const b of batches) {
		if (b.archived_at) continue;
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
	return out;
}

function mapApiTask(t: ChecklistTask): UiTask {
	return {
		id: t.id,
		title: t.title,
		detail: t.detail,
		urgency: t.urgency,
		batchId: t.batch_id,
	};
}

function orderByUrgency(tasks: UiTask[]): UiTask[] {
	const rank: Record<UrgencyKey, number> = { overdue: 0, today: 1, soon: 2 };
	return [...tasks].sort((a, b) => rank[a.urgency] - rank[b.urgency]);
}

export default function ChecklistScreen() {
	const serverTasks = useQuery({
		queryKey: ["checklist"],
		queryFn: () => checklistApi.list(),
		retry: 0,
	});
	const batches = useQuery({
		queryKey: ["batches"],
		queryFn: () => batchesApi.list(),
		enabled: serverTasks.isError || serverTasks.data?.tasks === undefined,
	});

	const tasks = useMemo(() => {
		if (serverTasks.data?.tasks) {
			return orderByUrgency(serverTasks.data.tasks.map(mapApiTask));
		}
		return orderByUrgency(deriveLocalTasks(batches.data?.data ?? []));
	}, [serverTasks.data, batches.data]);

	const [completed, setCompleted] = useState<Set<string>>(() =>
		loadCompleted(),
	);

	function toggle(id: string) {
		setCompleted((prev) => {
			const next = new Set(prev);
			if (next.has(id)) next.delete(id);
			else next.add(id);
			saveCompleted(next);
			return next;
		});
	}

	const total = tasks.length;
	const done = tasks.filter((t) => completed.has(t.id)).length;
	const openTasks = tasks.filter((t) => !completed.has(t.id));
	const overdue = openTasks.filter((t) => t.urgency === "overdue").length;
	const today = openTasks.filter((t) => t.urgency === "today").length;
	const soon = openTasks.filter((t) => t.urgency === "soon").length;

	const hasAnyBatches = (batches.data?.data ?? []).length > 0 || total > 0;

	return (
		<GradientBackground>
			<View style={{ paddingHorizontal: spacing.md, paddingTop: spacing.xs }}>
				<Text size="xxl" weight="bold">
					Tasks
				</Text>
				<Text size="sm" tone="muted">
					Setup-aware daily checklist
				</Text>
			</View>

			<View style={{ paddingHorizontal: spacing.md, paddingTop: spacing.md }}>
				<Card>
					<View
						style={{
							flexDirection: "row",
							justifyContent: "space-between",
							marginBottom: spacing.sm,
						}}
					>
						<Text weight="semibold">Today's progress</Text>
						<Text tone="muted">
							{done}/{total}
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
								width: total > 0 ? `${(done / total) * 100}%` : "0%",
								height: 8,
								backgroundColor: colors.primaryLight,
								borderRadius: 999,
							}}
						/>
					</View>
					<View
						style={{
							flexDirection: "row",
							gap: spacing.xs,
							marginTop: spacing.sm,
						}}
					>
						<CountChip label={`${overdue} overdue`} color={colors.error} />
						<CountChip label={`${today} today`} color={colors.primaryLight} />
						<CountChip label={`${soon} soon`} color={colors.textMuted} />
					</View>
				</Card>
			</View>

			{!hasAnyBatches ? (
				<View
					style={{
						flex: 1,
						alignItems: "center",
						justifyContent: "center",
						padding: spacing.xxl,
					}}
				>
					<Ionicons
						name="checkbox-outline"
						size={48}
						color={colors.textMuted}
					/>
					<Text
						tone="muted"
						style={{ marginTop: spacing.sm, textAlign: "center" }}
					>
						Start a batch to see setup-aware tasks.
					</Text>
					<Link href="/batch/new" asChild>
						<Pressable
							style={{
								marginTop: spacing.md,
								backgroundColor: colors.buttonSolidBg,
								paddingHorizontal: spacing.md,
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
					contentContainerStyle={{ padding: spacing.md, gap: 10 }}
					ListEmptyComponent={
						<Text tone="muted">All caught up! Pahinga ka muna.</Text>
					}
					renderItem={({ item }) => (
						<TaskRow
							task={item}
							done={completed.has(item.id)}
							onToggle={() => toggle(item.id)}
						/>
					)}
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
				paddingVertical: spacing.xxs,
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

function TaskRow({
	task,
	done,
	onToggle,
}: {
	task: UiTask;
	done: boolean;
	onToggle: () => void;
}) {
	const accent =
		task.urgency === "overdue"
			? colors.error
			: task.urgency === "today"
				? colors.primaryLight
				: colors.textMuted;
	return (
		<Card
			style={{
				borderLeftWidth: 4,
				borderLeftColor: done ? colors.success : accent,
			}}
		>
			<View
				style={{
					flexDirection: "row",
					alignItems: "flex-start",
					gap: spacing.sm,
				}}
			>
				<Pressable onPress={onToggle} hitSlop={10}>
					<Ionicons
						name={done ? "checkmark-circle" : "ellipse-outline"}
						size={24}
						color={done ? colors.success : accent}
					/>
				</Pressable>
				<Link href={task.batchId ? `/batch/${task.batchId}` : "/"} asChild>
					<Pressable style={{ flex: 1 }}>
						<Text
							weight="semibold"
							style={{
								textDecorationLine: done ? "line-through" : "none",
								opacity: done ? 0.6 : 1,
							}}
						>
							{task.title}
						</Text>
						<Text size="xs" tone="muted" style={{ marginTop: spacing.xxs }}>
							{task.detail}
						</Text>
					</Pressable>
				</Link>
			</View>
		</Card>
	);
}

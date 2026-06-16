import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, router } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { priorityColor } from "@/components/tasks/task-form";
import { Card } from "@/components/ui/card";
import { GradientBackground } from "@/components/ui/gradient-background";
import { useTabBarClearance } from "@/components/ui/interactive-menu";
import { Text } from "@/components/ui/text";
import { radii, spacing, useThemeColors } from "@/constants/theme";
import { type AutoTask, useAutoChecklist } from "@/hooks/use-auto-checklist";
import { useBack } from "@/hooks/use-back";
import { useCustomToast } from "@/hooks/useCustomToast";
import {
	type Paged,
	type Task,
	type TaskPriority,
	tasksApi,
} from "@/lib/hydro-api";
import { syncTaskReminders } from "@/lib/notifications";
import { rollback, snapshotAndCancel } from "@/lib/optimistic";
import { QK, STALE } from "@/lib/query-config";
import { handleError } from "@/lib/utils";

const PRIORITY_ORDER: TaskPriority[] = ["high", "medium", "low", "none"];
const PRIORITY_LABEL: Record<TaskPriority, string> = {
	high: "High Priority",
	medium: "Medium Priority",
	low: "Low Priority",
	none: "No Priority",
};

function startOfTodayMs(): number {
	const d = new Date();
	d.setHours(0, 0, 0, 0);
	return d.getTime();
}

function endOfTodayMs(): number {
	const d = new Date();
	d.setHours(23, 59, 59, 999);
	return d.getTime();
}

function isOverdue(due: string | null): boolean {
	return !!due && new Date(due).getTime() < startOfTodayMs();
}

function isDueToday(due: string | null): boolean {
	if (!due) return false;
	const t = new Date(due).getTime();
	return t >= startOfTodayMs() && t <= endOfTodayMs();
}

function formatDue(due: string): string {
	const t = new Date(due).getTime();
	if (isOverdue(due)) return "Overdue";
	if (t <= endOfTodayMs()) return "Today";
	return new Date(due).toLocaleDateString(undefined, {
		month: "short",
		day: "numeric",
	});
}

export default function TasksScreen() {
	const colors = useThemeColors();
	const goBack = useBack();
	const clearance = useTabBarClearance();
	const qc = useQueryClient();
	const toast = useCustomToast();
	const [view, setView] = useState<"today" | "all">("today");

	const listKey = QK.tasks.list({ includeCompleted: true });
	const tasksQ = useQuery({
		queryKey: listKey,
		queryFn: () => tasksApi.list({ include_completed: true, limit: 500 }),
		staleTime: STALE.tasks,
	});
	const auto = useAutoChecklist();

	// Keep local reminders in sync with the task list (no-op on web).
	useEffect(() => {
		if (tasksQ.data) syncTaskReminders(tasksQ.data.data);
	}, [tasksQ.data]);

	const toggleComplete = useMutation({
		mutationFn: (t: Task) =>
			t.completed_at ? tasksApi.uncomplete(t.id) : tasksApi.complete(t.id),
		onMutate: async (t) => {
			const snapshot = await snapshotAndCancel(qc, [listKey]);
			const nowIso = new Date().toISOString();
			qc.setQueryData(listKey, (old: unknown) => {
				if (!old) return old;
				const paged = old as Paged<Task>;
				return {
					...paged,
					data: paged.data.map((x) => {
						if (x.id !== t.id) return x;
						if (x.completed_at) return { ...x, completed_at: null };
						// recurring tasks stay active (server advances due date)
						return x.recur_freq === "none" ? { ...x, completed_at: nowIso } : x;
					}),
				};
			});
			return { snapshot };
		},
		onError: (err, _t, ctx) => {
			if (ctx) rollback(qc, ctx.snapshot);
			toast.error(`Couldn't update task: ${handleError(err)}`);
		},
		onSettled: () => qc.invalidateQueries({ queryKey: QK.tasks.all }),
	});

	const all = tasksQ.data?.data ?? [];
	const active = all.filter((t) => !t.completed_at);
	const completed = all.filter((t) => t.completed_at);
	const dueToday = active
		.filter((t) => isOverdue(t.due_at) || isDueToday(t.due_at))
		.sort((a, b) => Number(isOverdue(b.due_at)) - Number(isOverdue(a.due_at)));

	return (
		<GradientBackground>
			<View style={{ paddingHorizontal: spacing.md, paddingTop: spacing.xs }}>
				<View
					style={{
						flexDirection: "row",
						alignItems: "center",
						gap: spacing.xs,
					}}
				>
					<Pressable onPress={goBack} hitSlop={8}>
						<Ionicons name="arrow-back" size={24} color={colors.text} />
					</Pressable>
					<Text size="xxl" weight="bold">
						Tasks
					</Text>
				</View>

				<View
					style={{
						flexDirection: "row",
						gap: spacing.xs,
						marginTop: spacing.sm,
						padding: 4,
						backgroundColor: colors.glass,
						borderRadius: radii.full,
					}}
				>
					<Segment
						label="Today"
						active={view === "today"}
						onPress={() => setView("today")}
					/>
					<Segment
						label="All"
						active={view === "all"}
						onPress={() => setView("all")}
					/>
				</View>
			</View>

			<ScrollView
				contentContainerStyle={{
					padding: spacing.md,
					paddingBottom: clearance,
					gap: spacing.sm,
				}}
			>
				{view === "today" ? (
					<TodayView
						dueToday={dueToday}
						auto={auto}
						onToggleTask={(t) => toggleComplete.mutate(t)}
					/>
				) : (
					<AllView
						active={active}
						completed={completed}
						onToggleTask={(t) => toggleComplete.mutate(t)}
					/>
				)}
			</ScrollView>

			<Pressable
				onPress={() => router.push("/tasks/new")}
				style={{
					position: "absolute",
					right: spacing.lg,
					bottom: clearance,
					width: 56,
					height: 56,
					borderRadius: 28,
					backgroundColor: colors.buttonSolidBg,
					alignItems: "center",
					justifyContent: "center",
					shadowColor: "#000",
					shadowOffset: { width: 0, height: 6 },
					shadowOpacity: 0.3,
					shadowRadius: 12,
					elevation: 10,
				}}
			>
				<Ionicons name="add" size={30} color="#FFFFFF" />
			</Pressable>
		</GradientBackground>
	);
}

function TodayView({
	dueToday,
	auto,
	onToggleTask,
}: {
	dueToday: Task[];
	auto: ReturnType<typeof useAutoChecklist>;
	onToggleTask: (t: Task) => void;
}) {
	const colors = useThemeColors();
	const openAuto = auto.tasks;
	const nothing = dueToday.length === 0 && openAuto.length === 0;

	if (nothing) {
		return (
			<View style={{ alignItems: "center", paddingVertical: spacing.xxxl }}>
				<Ionicons name="sunny-outline" size={44} color={colors.textMuted} />
				<Text tone="muted" style={{ marginTop: spacing.sm }}>
					Nothing due today. Enjoy the calm. 🌿
				</Text>
			</View>
		);
	}

	return (
		<>
			{dueToday.length > 0 ? (
				<View style={{ gap: spacing.sm }}>
					<SectionLabel>Due today</SectionLabel>
					{dueToday.map((t) => (
						<UserTaskRow key={t.id} task={t} onToggle={() => onToggleTask(t)} />
					))}
				</View>
			) : null}

			{openAuto.length > 0 ? (
				<View style={{ gap: spacing.sm, marginTop: spacing.sm }}>
					<SectionLabel>Suggested for your setups</SectionLabel>
					{openAuto.map((t) => (
						<AutoRow
							key={t.id}
							task={t}
							done={auto.completed.has(t.id)}
							onToggle={() => auto.toggle(t.id)}
						/>
					))}
				</View>
			) : null}
		</>
	);
}

function AllView({
	active,
	completed,
	onToggleTask,
}: {
	active: Task[];
	completed: Task[];
	onToggleTask: (t: Task) => void;
}) {
	const colors = useThemeColors();
	const [collapsed, setCollapsed] = useState<Record<string, boolean>>({
		completed: true,
	});
	const toggle = (key: string) =>
		setCollapsed((c) => ({ ...c, [key]: !c[key] }));

	if (active.length === 0 && completed.length === 0) {
		return (
			<View style={{ alignItems: "center", paddingVertical: spacing.xxxl }}>
				<Ionicons name="checkbox-outline" size={44} color={colors.textMuted} />
				<Text tone="muted" style={{ marginTop: spacing.sm }}>
					No tasks yet. Tap + to add one.
				</Text>
			</View>
		);
	}

	return (
		<>
			{PRIORITY_ORDER.map((p) => {
				const items = active.filter((t) => t.priority === p);
				if (items.length === 0) return null;
				const isCollapsed = collapsed[p];
				return (
					<View key={p} style={{ gap: spacing.sm }}>
						<GroupHeader
							label={PRIORITY_LABEL[p]}
							count={items.length}
							collapsed={isCollapsed}
							onToggle={() => toggle(p)}
						/>
						{!isCollapsed
							? items.map((t) => (
									<UserTaskRow
										key={t.id}
										task={t}
										onToggle={() => onToggleTask(t)}
									/>
								))
							: null}
					</View>
				);
			})}

			{completed.length > 0 ? (
				<View style={{ gap: spacing.sm, marginTop: spacing.sm }}>
					<GroupHeader
						label="Completed"
						count={completed.length}
						collapsed={collapsed.completed}
						onToggle={() => toggle("completed")}
					/>
					{!collapsed.completed
						? completed.map((t) => (
								<UserTaskRow
									key={t.id}
									task={t}
									onToggle={() => onToggleTask(t)}
								/>
							))
						: null}
				</View>
			) : null}
		</>
	);
}

function Segment({
	label,
	active,
	onPress,
}: {
	label: string;
	active: boolean;
	onPress: () => void;
}) {
	const colors = useThemeColors();
	return (
		<Pressable
			onPress={onPress}
			style={{
				flex: 1,
				alignItems: "center",
				paddingVertical: spacing.xs,
				borderRadius: radii.full,
				backgroundColor: active ? colors.bg : "transparent",
			}}
		>
			<Text
				size="sm"
				weight="semibold"
				style={{ color: active ? colors.text : colors.textMuted }}
			>
				{label}
			</Text>
		</Pressable>
	);
}

function SectionLabel({ children }: { children: React.ReactNode }) {
	return (
		<Text
			size="xs"
			weight="semibold"
			tone="subtle"
			style={{ textTransform: "uppercase", letterSpacing: 0.5 }}
		>
			{children}
		</Text>
	);
}

function GroupHeader({
	label,
	count,
	collapsed,
	onToggle,
}: {
	label: string;
	count: number;
	collapsed: boolean;
	onToggle: () => void;
}) {
	const colors = useThemeColors();
	return (
		<Pressable
			onPress={onToggle}
			style={{
				flexDirection: "row",
				alignItems: "center",
				gap: spacing.xs,
				paddingTop: spacing.xs,
			}}
		>
			<Text size="md" weight="bold" style={{ flex: 1 }}>
				{label}
			</Text>
			<Text size="sm" tone="muted">
				{count}
			</Text>
			<Ionicons
				name={collapsed ? "chevron-down" : "chevron-up"}
				size={18}
				color={colors.textMuted}
			/>
		</Pressable>
	);
}

function UserTaskRow({ task, onToggle }: { task: Task; onToggle: () => void }) {
	const colors = useThemeColors();
	const done = !!task.completed_at;
	const pColor = priorityColor(task.priority, colors);
	const overdue = isOverdue(task.due_at);
	return (
		<Card
			style={{
				borderLeftWidth: 4,
				borderLeftColor: done
					? colors.success
					: task.priority === "none"
						? colors.border
						: pColor,
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
						color={done ? colors.success : pColor}
					/>
				</Pressable>
				<Link href={`/tasks/${task.id}`} asChild>
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
						{task.body ? (
							<Text
								size="xs"
								tone="muted"
								numberOfLines={1}
								style={{ marginTop: 2 }}
							>
								{task.body}
							</Text>
						) : null}
						<View
							style={{
								flexDirection: "row",
								alignItems: "center",
								gap: spacing.sm,
								marginTop: 4,
							}}
						>
							{task.due_at ? (
								<View
									style={{ flexDirection: "row", alignItems: "center", gap: 3 }}
								>
									<Ionicons
										name="calendar-outline"
										size={12}
										color={overdue ? colors.error : colors.textMuted}
									/>
									<Text
										size="xs"
										style={{ color: overdue ? colors.error : colors.textMuted }}
									>
										{formatDue(task.due_at)}
									</Text>
								</View>
							) : null}
							{task.recur_freq !== "none" ? (
								<View
									style={{ flexDirection: "row", alignItems: "center", gap: 3 }}
								>
									<Ionicons name="repeat" size={12} color={colors.textMuted} />
									<Text size="xs" tone="muted">
										{task.recur_interval > 1
											? `Every ${task.recur_interval} ${task.recur_freq}`
											: task.recur_freq}
									</Text>
								</View>
							) : null}
						</View>
					</Pressable>
				</Link>
			</View>
		</Card>
	);
}

function AutoRow({
	task,
	done,
	onToggle,
}: {
	task: AutoTask;
	done: boolean;
	onToggle: () => void;
}) {
	const colors = useThemeColors();
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
						<Text size="xs" tone="muted" style={{ marginTop: 2 }}>
							{task.detail}
						</Text>
					</Pressable>
				</Link>
			</View>
		</Card>
	);
}

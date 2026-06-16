import { Ionicons } from "@expo/vector-icons";
import { Link } from "expo-router";
import { FlatList, Pressable, View } from "react-native";
import { Card } from "@/components/ui/card";
import { GradientBackground } from "@/components/ui/gradient-background";
import { Text } from "@/components/ui/text";
import { spacing, useThemeColors } from "@/constants/theme";
import { type AutoTask, useAutoChecklist } from "@/hooks/use-auto-checklist";
import { useBack } from "@/hooks/use-back";

export default function ChecklistScreen() {
	const colors = useThemeColors();
	const goBack = useBack();
	const { tasks, completed, toggle, hasBatches } = useAutoChecklist();

	const total = tasks.length;
	const done = tasks.filter((t) => completed.has(t.id)).length;
	const openTasks = tasks.filter((t) => !completed.has(t.id));
	const overdue = openTasks.filter((t) => t.urgency === "overdue").length;
	const today = openTasks.filter((t) => t.urgency === "today").length;
	const soon = openTasks.filter((t) => t.urgency === "soon").length;

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
						Daily Checklist
					</Text>
				</View>
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

			{!hasBatches ? (
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
						<Text size="xs" tone="muted" style={{ marginTop: spacing.xxs }}>
							{task.detail}
						</Text>
					</Pressable>
				</Link>
			</View>
		</Card>
	);
}

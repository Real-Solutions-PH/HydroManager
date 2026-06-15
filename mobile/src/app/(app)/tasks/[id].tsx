import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { Pressable, ScrollView, View } from "react-native";
import { TaskForm, type TaskFormValues } from "@/components/tasks/task-form";
import { GradientBackground } from "@/components/ui/gradient-background";
import { Text } from "@/components/ui/text";
import { radii, spacing, useThemeColors } from "@/constants/theme";
import { useBack } from "@/hooks/use-back";
import { useCustomToast } from "@/hooks/useCustomToast";
import { confirmDialog } from "@/lib/dialog";
import { tasksApi } from "@/lib/hydro-api";
import { QK, STALE } from "@/lib/query-config";
import { handleError } from "@/lib/utils";

export default function EditTaskScreen() {
	const colors = useThemeColors();
	const { id } = useLocalSearchParams<{ id: string }>();
	const taskId = id ?? "";
	const qc = useQueryClient();
	const toast = useCustomToast();
	const goBack = useBack();

	const task = useQuery({
		queryKey: QK.tasks.detail(taskId),
		queryFn: () => tasksApi.get(taskId),
		enabled: !!taskId,
		staleTime: STALE.tasks,
	});

	const update = useMutation({
		mutationFn: (v: TaskFormValues) =>
			tasksApi.update(taskId, {
				title: v.title,
				body: v.body || null,
				priority: v.priority,
				due_at: v.due_at,
				recur_freq: v.recur_freq,
				recur_interval: v.recur_interval,
			}),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: QK.tasks.all });
			toast.success("Task updated");
			router.replace("/tasks");
		},
		onError: (err) => toast.error(`Couldn't update task: ${handleError(err)}`),
	});

	const del = useMutation({
		mutationFn: () => tasksApi.delete(taskId),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: QK.tasks.all });
			router.replace("/tasks");
		},
		onError: (err) => toast.error(`Couldn't delete task: ${handleError(err)}`),
	});

	const confirmDelete = () =>
		confirmDialog({
			title: "Delete task?",
			message: "This cannot be undone.",
			confirmLabel: "Delete",
			destructive: true,
			onConfirm: () => del.mutate(),
		});

	return (
		<GradientBackground>
			<View
				style={{
					flexDirection: "row",
					alignItems: "center",
					gap: spacing.xs,
					paddingHorizontal: spacing.md,
					paddingTop: spacing.xs,
				}}
			>
				<Pressable onPress={goBack} hitSlop={8}>
					<Ionicons name="arrow-back" size={24} color={colors.text} />
				</Pressable>
				<Text size="xxl" weight="bold" style={{ flex: 1 }}>
					Edit Task
				</Text>
				<Pressable
					onPress={confirmDelete}
					disabled={del.isPending}
					hitSlop={8}
					style={{
						width: 36,
						height: 36,
						borderRadius: radii.md,
						borderWidth: 1,
						borderColor: colors.error,
						alignItems: "center",
						justifyContent: "center",
					}}
				>
					<Ionicons name="trash-outline" size={18} color={colors.error} />
				</Pressable>
			</View>
			<ScrollView
				contentContainerStyle={{
					padding: spacing.md,
					paddingBottom: spacing.xxxl,
				}}
				keyboardShouldPersistTaps="handled"
			>
				{task.isLoading ? (
					<Text tone="muted">Loading...</Text>
				) : !task.data ? (
					<Text tone="muted">Task not found.</Text>
				) : (
					<TaskForm
						initial={{
							title: task.data.title,
							body: task.data.body ?? "",
							priority: task.data.priority,
							due_at: task.data.due_at,
							recur_freq: task.data.recur_freq,
							recur_interval: task.data.recur_interval,
						}}
						submitLabel="Save Changes"
						isSaving={update.isPending}
						onSubmit={(v) => update.mutate(v)}
					/>
				)}
			</ScrollView>
		</GradientBackground>
	);
}

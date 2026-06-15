import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { Pressable, ScrollView, View } from "react-native";
import { TaskForm, type TaskFormValues } from "@/components/tasks/task-form";
import { GradientBackground } from "@/components/ui/gradient-background";
import { Text } from "@/components/ui/text";
import { spacing, useThemeColors } from "@/constants/theme";
import { useBack } from "@/hooks/use-back";
import { useCustomToast } from "@/hooks/useCustomToast";
import { tasksApi } from "@/lib/hydro-api";
import { ensureNotificationPermission } from "@/lib/notifications";
import { QK } from "@/lib/query-config";
import { handleError } from "@/lib/utils";

export default function NewTaskScreen() {
	const colors = useThemeColors();
	const qc = useQueryClient();
	const toast = useCustomToast();
	const goBack = useBack();

	const create = useMutation({
		mutationFn: (v: TaskFormValues) =>
			tasksApi.create({
				title: v.title,
				body: v.body || null,
				priority: v.priority,
				due_at: v.due_at,
				recur_freq: v.recur_freq,
				recur_interval: v.recur_interval,
			}),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: QK.tasks.all });
			toast.success("Task created");
			router.replace("/tasks");
		},
		onError: (err) => toast.error(`Couldn't create task: ${handleError(err)}`),
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
				<Text size="xxl" weight="bold">
					New Task
				</Text>
			</View>
			<ScrollView
				contentContainerStyle={{
					padding: spacing.md,
					paddingBottom: spacing.xxxl,
				}}
				keyboardShouldPersistTaps="handled"
			>
				<TaskForm
					submitLabel="Create Task"
					isSaving={create.isPending}
					onSubmit={(v) => {
						if (v.due_at) ensureNotificationPermission();
						create.mutate(v);
					}}
				/>
			</ScrollView>
		</GradientBackground>
	);
}

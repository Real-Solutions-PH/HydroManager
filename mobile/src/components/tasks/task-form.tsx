import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Pressable, View } from "react-native";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { radii, spacing, useThemeColors } from "@/constants/theme";
import type { RecurFreq, TaskPriority } from "@/lib/hydro-api";

export interface TaskFormValues {
	title: string;
	body: string;
	priority: TaskPriority;
	due_at: string | null;
	recur_freq: RecurFreq;
	recur_interval: number;
}

interface Props {
	initial?: Partial<TaskFormValues>;
	submitLabel: string;
	isSaving: boolean;
	onSubmit: (values: TaskFormValues) => void;
}

const PRIORITIES: { key: TaskPriority; label: string }[] = [
	{ key: "high", label: "High" },
	{ key: "medium", label: "Medium" },
	{ key: "low", label: "Low" },
	{ key: "none", label: "None" },
];

const FREQS: { key: RecurFreq; label: string; unit: string }[] = [
	{ key: "none", label: "Never", unit: "" },
	{ key: "daily", label: "Daily", unit: "day" },
	{ key: "weekly", label: "Weekly", unit: "week" },
	{ key: "monthly", label: "Monthly", unit: "month" },
];

export function priorityColor(
	p: TaskPriority,
	colors: ReturnType<typeof useThemeColors>,
) {
	if (p === "high") return colors.error;
	if (p === "medium") return colors.warning;
	if (p === "low") return colors.primaryLight;
	return colors.textMuted;
}

/** Normalize a picked date to a full ISO timestamp at 08:00 local time. */
function normalizeDue(value: string | null): string | null {
	if (!value) return null;
	const base = new Date(value);
	if (Number.isNaN(base.getTime())) return value;
	base.setHours(8, 0, 0, 0);
	return base.toISOString();
}

export function TaskForm({ initial, submitLabel, isSaving, onSubmit }: Props) {
	const colors = useThemeColors();
	const [title, setTitle] = useState(initial?.title ?? "");
	const [body, setBody] = useState(initial?.body ?? "");
	const [priority, setPriority] = useState<TaskPriority>(
		initial?.priority ?? "none",
	);
	const [dueAt, setDueAt] = useState<string | null>(initial?.due_at ?? null);
	const [freq, setFreq] = useState<RecurFreq>(initial?.recur_freq ?? "none");
	const [interval, setInterval] = useState<number>(
		initial?.recur_interval ?? 1,
	);

	const unit = FREQS.find((f) => f.key === freq)?.unit ?? "";
	const canSave = title.trim().length > 0;

	return (
		<View style={{ gap: spacing.md }}>
			<View>
				<Label>TITLE</Label>
				<Input
					value={title}
					onChangeText={setTitle}
					placeholder="e.g. Top up reservoir"
				/>
			</View>

			<View>
				<Label>NOTES</Label>
				<Input
					value={body}
					onChangeText={setBody}
					placeholder="Optional details"
					multiline
				/>
			</View>

			<View>
				<Label>PRIORITY</Label>
				<View
					style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.xs }}
				>
					{PRIORITIES.map((p) => {
						const active = priority === p.key;
						const c = priorityColor(p.key, colors);
						return (
							<Chip
								key={p.key}
								label={p.label}
								active={active}
								color={c}
								onPress={() => setPriority(p.key)}
							/>
						);
					})}
				</View>
			</View>

			<View>
				<Label>DUE DATE</Label>
				<DatePicker
					value={dueAt}
					onChange={setDueAt}
					placeholder="No due date"
					allowClear
				/>
			</View>

			<View>
				<Label>REPEAT</Label>
				<View
					style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.xs }}
				>
					{FREQS.map((f) => (
						<Chip
							key={f.key}
							label={f.label}
							active={freq === f.key}
							color={colors.primary}
							onPress={() => setFreq(f.key)}
						/>
					))}
				</View>
				{freq !== "none" ? (
					<View
						style={{
							flexDirection: "row",
							alignItems: "center",
							gap: spacing.sm,
							marginTop: spacing.sm,
						}}
					>
						<Text size="sm" tone="muted">
							Every
						</Text>
						<Stepper
							value={interval}
							onChange={(v) => setInterval(Math.max(1, v))}
						/>
						<Text size="sm" tone="muted">
							{interval === 1 ? unit : `${unit}s`}
						</Text>
					</View>
				) : null}
			</View>

			<Button
				label={submitLabel}
				isLoading={isSaving}
				isDisabled={!canSave}
				onPress={() =>
					onSubmit({
						title: title.trim(),
						body: body.trim(),
						priority,
						due_at: normalizeDue(dueAt),
						recur_freq: freq,
						recur_interval: interval,
					})
				}
			/>
		</View>
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

function Chip({
	label,
	active,
	color,
	onPress,
}: {
	label: string;
	active: boolean;
	color: string;
	onPress: () => void;
}) {
	const colors = useThemeColors();
	return (
		<Pressable
			onPress={onPress}
			style={{
				flexDirection: "row",
				alignItems: "center",
				gap: 6,
				paddingHorizontal: spacing.sm,
				paddingVertical: spacing.xs,
				borderRadius: radii.full,
				borderWidth: active ? 2 : 1,
				borderColor: active ? color : colors.border,
				backgroundColor: active ? `${color}1F` : "transparent",
			}}
		>
			<Text
				size="sm"
				weight="semibold"
				style={{ color: active ? color : colors.text }}
			>
				{label}
			</Text>
		</Pressable>
	);
}

function Stepper({
	value,
	onChange,
}: {
	value: number;
	onChange: (v: number) => void;
}) {
	const colors = useThemeColors();
	const btn = (
		icon: "remove" | "add",
		onPress: () => void,
		disabled?: boolean,
	) => (
		<Pressable
			onPress={onPress}
			disabled={disabled}
			hitSlop={6}
			style={{
				width: 36,
				height: 36,
				alignItems: "center",
				justifyContent: "center",
				borderRadius: radii.md,
				borderWidth: 1,
				borderColor: colors.border,
				backgroundColor: colors.glass,
				opacity: disabled ? 0.4 : 1,
			}}
		>
			<Ionicons name={icon} size={18} color={colors.text} />
		</Pressable>
	);
	return (
		<View
			style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}
		>
			{btn("remove", () => onChange(value - 1), value <= 1)}
			<Text
				size="md"
				weight="bold"
				style={{ minWidth: 20, textAlign: "center" }}
			>
				{value}
			</Text>
			{btn("add", () => onChange(value + 1))}
		</View>
	);
}

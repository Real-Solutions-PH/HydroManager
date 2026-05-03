import DateTimePicker, {
	type DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Modal, Platform, Pressable, View } from "react-native";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { colors, spacing } from "@/constants/theme";

interface Props {
	value: string | null;
	onChange: (iso: string | null) => void;
	placeholder?: string;
	allowClear?: boolean;
	minimumDate?: Date;
	maximumDate?: Date;
}

function toIso(d: Date): string {
	const y = d.getFullYear();
	const m = String(d.getMonth() + 1).padStart(2, "0");
	const day = String(d.getDate()).padStart(2, "0");
	return `${y}-${m}-${day}`;
}

function parseIso(iso: string | null): Date | null {
	if (!iso) return null;
	const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
	if (!m) return null;
	const d = new Date(
		Number.parseInt(m[1], 10),
		Number.parseInt(m[2], 10) - 1,
		Number.parseInt(m[3], 10),
	);
	return Number.isNaN(d.getTime()) ? null : d;
}

export function DatePicker({
	value,
	onChange,
	placeholder = "Pick a date",
	allowClear = false,
	minimumDate,
	maximumDate,
}: Props) {
	const [open, setOpen] = useState(false);
	const [draft, setDraft] = useState<Date | null>(null);
	const current = parseIso(value);

	const display = current
		? current.toLocaleDateString(undefined, {
				year: "numeric",
				month: "short",
				day: "2-digit",
			})
		: null;

	function openPicker() {
		setDraft(current ?? new Date());
		setOpen(true);
	}

	function handleNativeChange(event: DateTimePickerEvent, d?: Date) {
		// Android: dismiss/set events both close picker
		if (Platform.OS === "android") {
			setOpen(false);
			if (event.type === "set" && d) onChange(toIso(d));
			return;
		}
		if (d) setDraft(d);
	}

	function confirmIos() {
		if (draft) onChange(toIso(draft));
		setOpen(false);
	}

	// Web: render native HTML date input directly (datetimepicker not supported)
	if (Platform.OS === "web") {
		return (
			<View
				style={{
					flexDirection: "row",
					alignItems: "center",
					height: 44,
					paddingHorizontal: 12,
					borderRadius: 12,
					borderWidth: 1,
					borderColor: colors.borderInput,
					backgroundColor: "rgba(255,255,255,0.05)",
				}}
			>
				{/* @ts-ignore - HTML input on web */}
				<input
					type="date"
					value={value ?? ""}
					onChange={(e) => onChange(e.target.value || null)}
					min={minimumDate ? toIso(minimumDate) : undefined}
					max={maximumDate ? toIso(maximumDate) : undefined}
					style={{
						flex: 1,
						background: "transparent",
						border: "none",
						outline: "none",
						color: colors.text,
						fontSize: 15,
						colorScheme: "dark",
					}}
					placeholder={placeholder}
				/>
				{allowClear && value ? (
					<Pressable hitSlop={8} onPress={() => onChange(null)}>
						<Ionicons name="close-circle" size={18} color={colors.textMuted} />
					</Pressable>
				) : null}
			</View>
		);
	}

	return (
		<View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
			<Pressable
				onPress={openPicker}
				style={({ pressed }) => ({
					flex: 1,
					flexDirection: "row",
					alignItems: "center",
					justifyContent: "space-between",
					height: 44,
					paddingHorizontal: 16,
					borderRadius: 12,
					borderWidth: 1,
					borderColor: colors.borderInput,
					backgroundColor: pressed
						? "rgba(255,255,255,0.10)"
						: "rgba(255,255,255,0.05)",
				})}
			>
				<Text
					size="md"
					style={{ color: display ? colors.text : colors.placeholder }}
				>
					{display ?? placeholder}
				</Text>
				<Ionicons name="calendar" size={18} color={colors.textMuted} />
			</Pressable>

			{allowClear && current ? (
				<Pressable
					hitSlop={8}
					onPress={() => onChange(null)}
					style={{
						width: 32,
						height: 32,
						alignItems: "center",
						justifyContent: "center",
					}}
				>
					<Ionicons name="close-circle" size={20} color={colors.textMuted} />
				</Pressable>
			) : null}

			{Platform.OS === "android" && open ? (
				<DateTimePicker
					value={draft ?? new Date()}
					mode="date"
					onChange={handleNativeChange}
					minimumDate={minimumDate}
					maximumDate={maximumDate}
				/>
			) : null}

			{Platform.OS === "ios" ? (
				<Modal
					visible={open}
					transparent
					animationType="fade"
					onRequestClose={() => setOpen(false)}
				>
					<Pressable
						onPress={() => setOpen(false)}
						style={{
							flex: 1,
							backgroundColor: "rgba(0,0,0,0.5)",
							justifyContent: "flex-end",
						}}
					>
						<View
							onStartShouldSetResponder={() => true}
							style={{
								backgroundColor: colors.bgMid,
								borderTopLeftRadius: 16,
								borderTopRightRadius: 16,
								padding: spacing.md,
								gap: spacing.sm,
							}}
						>
							<DateTimePicker
								value={draft ?? new Date()}
								mode="date"
								display="spinner"
								onChange={handleNativeChange}
								minimumDate={minimumDate}
								maximumDate={maximumDate}
								textColor={colors.text}
								themeVariant="dark"
							/>
							<View style={{ flexDirection: "row", gap: spacing.xs }}>
								<View style={{ flex: 1 }}>
									<Button
										variant="ghost"
										label="Cancel"
										onPress={() => setOpen(false)}
									/>
								</View>
								<View style={{ flex: 1 }}>
									<Button label="Confirm" onPress={confirmIos} />
								</View>
							</View>
						</View>
					</Pressable>
				</Modal>
			) : null}
		</View>
	);
}

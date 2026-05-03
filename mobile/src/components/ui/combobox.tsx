import { Ionicons } from "@expo/vector-icons";
import * as DialogPrimitive from "@rn-primitives/dialog";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, TextInput, View } from "react-native";
import { Text } from "@/components/ui/text";
import { colors, spacing } from "@/constants/theme";

export interface ComboboxOption {
	value: string;
	label: string;
	subtitle?: string;
}

interface Props {
	value: string | null;
	onValueChange: (value: string | null, option: ComboboxOption | null) => void;
	options: ComboboxOption[];
	placeholder?: string;
	emptyMessage?: string;
	searchPlaceholder?: string;
	allowClear?: boolean;
	disabled?: boolean;
}

export function Combobox({
	value,
	onValueChange,
	options,
	placeholder = "Select",
	emptyMessage = "No options",
	searchPlaceholder = "Search...",
	allowClear = false,
	disabled,
}: Props) {
	const [open, setOpen] = useState(false);
	const [query, setQuery] = useState("");
	const current = options.find((o) => o.value === value) ?? null;

	const filtered = useMemo(() => {
		const q = query.trim().toLowerCase();
		if (!q) return options;
		return options.filter(
			(o) =>
				o.label.toLowerCase().includes(q) ||
				(o.subtitle?.toLowerCase().includes(q) ?? false),
		);
	}, [options, query]);

	function pick(opt: ComboboxOption) {
		onValueChange(opt.value, opt);
		setOpen(false);
		setQuery("");
	}

	return (
		<DialogPrimitive.Root
			open={open}
			onOpenChange={(o) => {
				setOpen(o);
				if (!o) setQuery("");
			}}
		>
			<DialogPrimitive.Trigger asChild>
				<Pressable
					disabled={disabled}
					style={{
						flexDirection: "row",
						alignItems: "center",
						justifyContent: "space-between",
						height: 44,
						paddingHorizontal: 16,
						borderRadius: 12,
						borderWidth: 1,
						borderColor: colors.borderInput,
						backgroundColor: "rgba(255,255,255,0.05)",
						opacity: disabled ? 0.5 : 1,
					}}
				>
					<Text
						size="md"
						style={{ color: current ? colors.text : colors.placeholder }}
						numberOfLines={1}
					>
						{current ? current.label : placeholder}
					</Text>
					<View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
						{allowClear && current ? (
							<Pressable
								hitSlop={8}
								onPress={(e) => {
									e.stopPropagation?.();
									onValueChange(null, null);
								}}
							>
								<Ionicons
									name="close-circle"
									size={18}
									color={colors.textMuted}
								/>
							</Pressable>
						) : null}
						<Ionicons name="chevron-down" size={18} color={colors.textMuted} />
					</View>
				</Pressable>
			</DialogPrimitive.Trigger>
			<DialogPrimitive.Portal>
				<DialogPrimitive.Overlay
					style={{
						position: "absolute",
						top: 0,
						bottom: 0,
						left: 0,
						right: 0,
						backgroundColor: "rgba(0,0,0,0.55)",
					}}
				/>
				<DialogPrimitive.Content
					style={{
						position: "absolute",
						top: "10%",
						left: spacing.md,
						right: spacing.md,
						maxHeight: "80%",
						borderRadius: 16,
						borderWidth: 1,
						borderColor: colors.border,
						backgroundColor: colors.bgMid,
						overflow: "hidden",
					}}
				>
					<View
						style={{
							flexDirection: "row",
							alignItems: "center",
							gap: spacing.xs,
							paddingHorizontal: spacing.md,
							paddingVertical: spacing.sm,
							borderBottomWidth: 1,
							borderBottomColor: colors.border,
						}}
					>
						<Ionicons name="search" size={18} color={colors.textMuted} />
						<TextInput
							value={query}
							onChangeText={setQuery}
							placeholder={searchPlaceholder}
							placeholderTextColor={colors.placeholder}
							autoFocus
							style={{ flex: 1, color: colors.text, fontSize: 15 }}
						/>
						<DialogPrimitive.Close asChild>
							<Pressable hitSlop={8}>
								<Ionicons name="close" size={20} color={colors.textMuted} />
							</Pressable>
						</DialogPrimitive.Close>
					</View>
					<ScrollView
						style={{ maxHeight: 360 }}
						keyboardShouldPersistTaps="handled"
					>
						{filtered.length === 0 ? (
							<View style={{ padding: spacing.md }}>
								<Text size="sm" tone="muted">
									{emptyMessage}
								</Text>
							</View>
						) : (
							filtered.map((opt) => {
								const active = opt.value === value;
								return (
									<Pressable
										key={opt.value}
										onPress={() => pick(opt)}
										style={{
											paddingVertical: spacing.sm,
											paddingHorizontal: spacing.md,
											borderBottomWidth: 1,
											borderBottomColor: colors.borderLight,
											backgroundColor: active
												? `${colors.primaryLight}1A`
												: "transparent",
										}}
									>
										<View
											style={{
												flexDirection: "row",
												alignItems: "center",
												justifyContent: "space-between",
											}}
										>
											<View style={{ flex: 1 }}>
												<Text
													size="md"
													weight={active ? "semibold" : "normal"}
													style={{
														color: active ? colors.primaryLight : colors.text,
													}}
												>
													{opt.label}
												</Text>
												{opt.subtitle ? (
													<Text size="xs" tone="muted">
														{opt.subtitle}
													</Text>
												) : null}
											</View>
											{active ? (
												<Ionicons
													name="checkmark"
													size={18}
													color={colors.primaryLight}
												/>
											) : null}
										</View>
									</Pressable>
								);
							})
						)}
					</ScrollView>
				</DialogPrimitive.Content>
			</DialogPrimitive.Portal>
		</DialogPrimitive.Root>
	);
}

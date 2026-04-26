import * as SelectPrimitive from "@rn-primitives/select";
import { ScrollView, View } from "react-native";
import { colors, spacing } from "@/constants/theme";
import { Text } from "@/components/ui/text";

export interface SelectOption {
	value: string;
	label: string;
	disabled?: boolean;
	trailing?: string;
}

interface SelectProps {
	value: string | null;
	onValueChange: (value: string, label: string) => void;
	options: SelectOption[];
	placeholder?: string;
	emptyMessage?: string;
	disabled?: boolean;
}

export function Select({
	value,
	onValueChange,
	options,
	placeholder = "Select",
	emptyMessage = "No options available.",
	disabled,
}: SelectProps) {
	const empty = options.length === 0;
	const isDisabled = disabled || empty;
	const current = options.find((o) => o.value === value);

	return (
		<View>
			<SelectPrimitive.Root
				value={
					current ? { value: current.value, label: current.label } : undefined
				}
				onValueChange={(opt) => {
					if (opt) onValueChange(opt.value, opt.label);
				}}
				disabled={isDisabled}
			>
				<SelectPrimitive.Trigger
					style={{
						flexDirection: "row",
						alignItems: "center",
						justifyContent: "space-between",
						paddingVertical: 10,
						paddingHorizontal: 12,
						borderRadius: 10,
						borderWidth: 1,
						borderColor: colors.borderInput,
						backgroundColor: "rgba(255,255,255,0.05)",
						opacity: isDisabled ? 0.5 : 1,
					}}
				>
					<Text
						size="sm"
						style={{
							color: current ? colors.text : colors.placeholder,
						}}
					>
						{current ? current.label : placeholder}
					</Text>
				</SelectPrimitive.Trigger>
				<SelectPrimitive.Portal>
					<SelectPrimitive.Content
						sideOffset={4}
						style={{
							borderRadius: 10,
							borderWidth: 1,
							borderColor: colors.border,
							backgroundColor: colors.bgMid,
							maxHeight: 280,
							overflow: "hidden",
							minWidth: 220,
						}}
					>
						<SelectPrimitive.Viewport>
						<ScrollView nestedScrollEnabled>
							{options.map((opt) => (
								<SelectPrimitive.Item
									key={opt.value}
									value={opt.value}
									label={
										opt.trailing
											? `${opt.label}  ·  ${opt.trailing}`
											: opt.label
									}
									disabled={opt.disabled}
									style={{
										padding: spacing.sm,
										borderBottomWidth: 1,
										borderBottomColor: colors.border,
										opacity: opt.disabled ? 0.4 : 1,
									}}
								>
									<SelectPrimitive.ItemText
										style={{ color: colors.text, fontSize: 14 }}
									/>
								</SelectPrimitive.Item>
							))}
						</ScrollView>
						</SelectPrimitive.Viewport>
					</SelectPrimitive.Content>
				</SelectPrimitive.Portal>
			</SelectPrimitive.Root>
			{empty ? (
				<Text size="xs" tone="muted" style={{ marginTop: 6 }}>
					{emptyMessage}
				</Text>
			) : null}
		</View>
	);
}

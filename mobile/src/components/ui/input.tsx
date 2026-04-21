import { forwardRef } from "react";
import { TextInput, type TextInputProps } from "react-native";
import { colors, spacing } from "@/constants/theme";
import { cn } from "@/lib/utils";

interface Props extends TextInputProps {
	invalid?: boolean;
}

export const Input = forwardRef<TextInput, Props>(
	(
		{
			className,
			placeholderTextColor = colors.placeholder,
			invalid,
			style,
			multiline,
			textAlignVertical,
			...props
		},
		ref,
	) => (
		<TextInput
			ref={ref}
			multiline={multiline}
			placeholderTextColor={placeholderTextColor}
			textAlignVertical={textAlignVertical ?? (multiline ? "top" : "center")}
			className={cn(
				multiline
					? "rounded-xl border px-4 text-base text-white"
					: "h-11 rounded-xl border px-4 text-base text-white",
				className,
			)}
			style={[
				{
					backgroundColor: "rgba(255,255,255,0.05)",
					borderColor: invalid ? colors.borderError : colors.borderInput,
					color: colors.text,
				},
				multiline
					? {
							minHeight: 96,
							paddingTop: spacing.sm,
							paddingBottom: spacing.sm,
						}
					: null,
				style,
			]}
			{...props}
		/>
	),
);
Input.displayName = "Input";

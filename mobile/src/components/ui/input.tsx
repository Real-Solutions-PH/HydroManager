import { forwardRef } from "react";
import { TextInput, type TextInputProps } from "react-native";
import { colors, spacing } from "@/constants/theme";

interface Props extends TextInputProps {
	invalid?: boolean;
}

export const Input = forwardRef<TextInput, Props>(
	(
		{
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
			style={[
				{
					borderRadius: 12,
					borderWidth: 1,
					paddingHorizontal: 16,
					fontSize: 15,
					color: colors.text,
					backgroundColor: colors.glass,
					borderColor: invalid ? colors.borderError : colors.borderInput,
				},
				multiline
					? {
							minHeight: 96,
							paddingTop: spacing.sm,
							paddingBottom: spacing.sm,
						}
					: { height: 44 },
				style,
			]}
			{...props}
		/>
	),
);
Input.displayName = "Input";

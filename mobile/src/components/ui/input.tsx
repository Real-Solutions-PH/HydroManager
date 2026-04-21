import { forwardRef } from "react";
import { TextInput, type TextInputProps } from "react-native";
import { colors } from "@/constants/theme";
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
			...props
		},
		ref,
	) => (
		<TextInput
			ref={ref}
			placeholderTextColor={placeholderTextColor}
			className={cn(
				"h-11 rounded-xl border px-4 text-base text-white",
				className,
			)}
			style={[
				{
					backgroundColor: "rgba(255,255,255,0.05)",
					borderColor: invalid ? colors.borderError : colors.borderInput,
					color: colors.text,
				},
				style,
			]}
			{...props}
		/>
	),
);
Input.displayName = "Input";

import type { ReactNode } from "react";
import { View } from "react-native";
import { Text } from "@/components/ui/text";
import { spacing } from "@/constants/theme";

interface FormFieldProps {
	label?: string;
	error?: string;
	children: ReactNode;
}

export function FormField({ label, error, children }: FormFieldProps) {
	return (
		<View style={{ gap: spacing.xxs }}>
			{label ? (
				<Text
					size="xs"
					weight="semibold"
					tone="subtle"
					style={{ textTransform: "uppercase", letterSpacing: 0.5 }}
				>
					{label}
				</Text>
			) : null}
			{children}
			{error ? (
				<Text size="xs" tone="error">
					{error}
				</Text>
			) : null}
		</View>
	);
}

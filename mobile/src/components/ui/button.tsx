import { forwardRef } from "react";
import {
	ActivityIndicator,
	Pressable,
	type PressableProps,
	Text,
	View,
} from "react-native";
import { colors } from "@/constants/theme";

type Variant = "solid" | "outline" | "ghost" | "danger" | "destructive";
type Size = "sm" | "md" | "lg" | "default" | "icon";

const SIZE_STYLE: Record<
	Size,
	{ height: number; paddingHorizontal?: number; width?: number }
> = {
	sm: { height: 36, paddingHorizontal: 12 },
	md: { height: 44, paddingHorizontal: 16 },
	lg: { height: 48, paddingHorizontal: 20 },
	default: { height: 44, paddingHorizontal: 16 },
	icon: { height: 44, width: 44 },
};

function variantBg(v: Variant): string {
	switch (v) {
		case "solid":
			return colors.buttonSolidBg;
		case "outline":
			return colors.glass;
		case "ghost":
			return "transparent";
		case "danger":
		case "destructive":
			return "#DC2626";
	}
}

function variantBorder(v: Variant): string | undefined {
	if (v === "outline") return colors.border;
	return undefined;
}

export interface ButtonProps extends PressableProps {
	variant?: Variant;
	size?: Size;
	label?: string;
	isLoading?: boolean;
	isDisabled?: boolean;
	leftIcon?: React.ReactNode;
	rightIcon?: React.ReactNode;
}

export const Button = forwardRef<
	React.ElementRef<typeof Pressable>,
	ButtonProps
>(
	(
		{
			variant = "solid",
			size = "md",
			label,
			children,
			isLoading,
			isDisabled,
			leftIcon,
			rightIcon,
			disabled,
			style,
			...props
		},
		ref,
	) => {
		const v = variant;
		const sz = SIZE_STYLE[size];
		const blocked = isDisabled || disabled || isLoading;
		const border = variantBorder(v);
		const hasBorder = Boolean(border);
		return (
			<Pressable
				ref={ref}
				disabled={blocked}
				style={(state) => [
					{
						flexDirection: "row",
						alignItems: "center",
						justifyContent: "center",
						borderRadius: 12,
						height: sz.height,
						width: sz.width,
						paddingHorizontal: sz.paddingHorizontal,
						borderWidth: hasBorder ? 1 : 0,
						borderColor: border,
						backgroundColor: state.pressed
							? v === "solid"
								? colors.buttonSolidActive
								: v === "danger" || v === "destructive"
									? "#B91C1C"
									: colors.glassHover
							: variantBg(v),
						opacity: blocked ? 0.5 : 1,
					},
					typeof style === "function" ? style(state) : style,
				]}
				{...props}
			>
				{isLoading ? (
					<ActivityIndicator color="#FFFFFF" />
				) : (
					<View
						style={{
							flexDirection: "row",
							alignItems: "center",
							gap: 8,
						}}
					>
						{leftIcon}
						{label ? (
							<Text
								style={{
									color: "#FFFFFF",
									fontWeight: "600",
									fontSize: size === "sm" ? 13 : 15,
								}}
							>
								{label}
							</Text>
						) : (
							(children as React.ReactNode)
						)}
						{rightIcon}
					</View>
				)}
			</Pressable>
		);
	},
);
Button.displayName = "Button";

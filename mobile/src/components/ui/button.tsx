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

const VARIANT_BG: Record<Variant, string> = {
	solid: colors.buttonSolidBg,
	outline: colors.glass,
	ghost: "transparent",
	danger: "#DC2626",
	destructive: "#DC2626",
};

const VARIANT_BORDER: Record<Variant, string | undefined> = {
	solid: undefined,
	outline: "rgba(255,255,255,0.3)",
	ghost: undefined,
	danger: undefined,
	destructive: undefined,
};

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
		const hasBorder = Boolean(VARIANT_BORDER[v]);
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
						borderColor: VARIANT_BORDER[v],
						backgroundColor: state.pressed
							? v === "solid"
								? colors.buttonSolidActive
								: v === "danger" || v === "destructive"
									? "#B91C1C"
									: "rgba(255,255,255,0.1)"
							: VARIANT_BG[v],
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

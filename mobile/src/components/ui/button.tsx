import { cva, type VariantProps } from "class-variance-authority";
import { forwardRef } from "react";
import {
	ActivityIndicator,
	Pressable,
	type PressableProps,
	Text,
	View,
} from "react-native";
import { colors } from "@/constants/theme";
import { cn } from "@/lib/utils";

const buttonVariants = cva("flex-row items-center justify-center rounded-xl", {
	variants: {
		variant: {
			solid: "",
			outline: "border",
			ghost: "",
			danger: "",
			destructive: "",
		},
		size: {
			sm: "h-9 px-3",
			md: "h-11 px-4",
			lg: "h-12 px-5",
			default: "h-11 px-4",
			icon: "h-11 w-11",
		},
	},
	defaultVariants: { variant: "solid", size: "md" },
});

const VARIANT_BG: Record<string, string> = {
	solid: colors.buttonSolidBg,
	outline: "transparent",
	ghost: "transparent",
	danger: "#DC2626",
	destructive: "#DC2626",
};

const VARIANT_BORDER: Record<string, string | undefined> = {
	outline: "rgba(255,255,255,0.3)",
};

export interface ButtonProps
	extends PressableProps,
		VariantProps<typeof buttonVariants> {
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
			className,
			variant = "solid",
			size,
			label,
			children,
			isLoading,
			isDisabled,
			leftIcon,
			rightIcon,
			disabled,
			...props
		},
		ref,
	) => {
		const v = (variant ?? "solid") as string;
		const blocked = isDisabled || disabled || isLoading;
		return (
			<Pressable
				ref={ref}
				disabled={blocked}
				className={cn(buttonVariants({ variant, size }), className)}
				style={({ pressed }) => ({
					backgroundColor: pressed
						? v === "solid"
							? colors.buttonSolidActive
							: v === "danger" || v === "destructive"
								? "#B91C1C"
								: "rgba(255,255,255,0.1)"
						: (VARIANT_BG[v] ?? colors.buttonSolidBg),
					borderColor: VARIANT_BORDER[v],
					opacity: blocked ? 0.5 : 1,
				})}
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

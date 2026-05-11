import {
	Text as RNText,
	type TextProps as RNTextProps,
	type StyleProp,
	type TextStyle,
} from "react-native";
import { colors } from "@/constants/theme";

type Tone = "default" | "muted" | "subtle" | "error" | "success" | "primary";
type Size = "xs" | "sm" | "md" | "lg" | "xl" | "xxl" | "xxxl";
type Weight = "normal" | "medium" | "semibold" | "bold" | "heavy";

interface TextProps extends RNTextProps {
	tone?: Tone;
	size?: Size;
	weight?: Weight;
}

const SIZE_MAP: Record<Size, number> = {
	xs: 11,
	sm: 13,
	md: 15,
	lg: 17,
	xl: 20,
	xxl: 24,
	xxxl: 32,
};
const WEIGHT_MAP: Record<Weight, TextStyle["fontWeight"]> = {
	normal: "400",
	medium: "500",
	semibold: "600",
	bold: "700",
	heavy: "800",
};
function toneColor(tone: Tone): string {
	switch (tone) {
		case "muted":
			return colors.textMuted;
		case "subtle":
			return colors.textSecondary;
		case "error":
			return colors.borderError;
		case "success":
			return colors.success;
		case "primary":
			return colors.primary;
		default:
			return colors.text;
	}
}

export function Text({
	tone = "default",
	size = "md",
	weight = "normal",
	style,
	...props
}: TextProps) {
	const composed: StyleProp<TextStyle> = [
		{
			color: toneColor(tone),
			fontSize: SIZE_MAP[size],
			fontWeight: WEIGHT_MAP[weight],
		},
		style,
	];
	return <RNText style={composed} {...props} />;
}

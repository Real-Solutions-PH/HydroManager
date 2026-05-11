// TODO(palette-migration): rename to SurfaceBackground — renders solid bg, not a gradient.
import type { ReactNode } from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { spacing, useThemeColors } from "@/constants/theme";

interface Props {
	children: ReactNode;
	withInsets?: boolean;
	bg?: string;
}

export function GradientBackground({ children, withInsets = true, bg }: Props) {
	const insets = useSafeAreaInsets();
	const colors = useThemeColors();
	return (
		<View style={{ flex: 1, backgroundColor: bg ?? colors.headerBg }}>
			<View
				style={{
					flex: 1,
					paddingTop: withInsets ? insets.top + spacing.sm : 0,
				}}
			>
				{children}
			</View>
		</View>
	);
}

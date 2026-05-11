import { useMemo } from "react";
import { type ThemeColors, useThemeColors } from "@/constants/theme";

/**
 * Compute a StyleSheet (or any value) keyed off the active theme palette.
 * The factory re-runs only when the palette identity changes (dark <-> light).
 */
export function useStyles<T>(factory: (colors: ThemeColors) => T): T {
	const colors = useThemeColors();
	return useMemo(() => factory(colors), [colors, factory]);
}

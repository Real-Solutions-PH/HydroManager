# Neutral Palette + Light/Dark Mode Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor mobile app (`mobile/`) palette to 60-30-10 color rule. Most surfaces become neutral (white/black depending on system color scheme). Brand green retained as 10% accent. Add automatic light/dark mode via `useColorScheme()`.

**Architecture:** Single source of truth in `src/constants/theme.ts` exports `lightColors` + `darkColors`. New `useThemeColors()` hook returns active palette from `useColorScheme()`. New `useStyles(factory)` helper makes per-component `StyleSheet.create` reactive. Existing 5-stop green gradient dropped — `GradientBackground` becomes solid neutral background driven by hook. ~56 files migrate from top-level `colors` import to hook-based usage; central refactor of `GradientBackground` covers ~29 screens via single edit.

**Tech Stack:** React Native (Expo SDK 52), expo-router, expo-status-bar, `react-native`'s `useColorScheme`, TypeScript. No tests exist in `mobile/`; verification = `bun run typecheck`, `bun run lint`, and manual visual QA in iOS simulator + Android emulator.

**Repo conventions:**
- Tabs for indentation (Biome config). Match existing files.
- Working directory for mobile commands: `mobile/`.
- Commit style: conventional commits matching recent history (e.g. `feat(home): ...`, `refactor(theme): ...`).
- No `git add -A` — stage explicit paths.

---

## File Structure

**New files:**
- `mobile/src/lib/use-styles.ts` — `useStyles` + `useThemeColors` helper exports.

**Heavily modified:**
- `mobile/src/constants/theme.ts` — splits `colors` into `lightColors` + `darkColors`, exports hook, keeps deprecated alias during migration.
- `mobile/src/components/ui/gradient-background.tsx` — drops `LinearGradient`, renders solid neutral background.

**Modified (small consistent edits, ~50 files):**
- `mobile/src/app/_layout.tsx` — mode-aware StatusBar.
- `mobile/src/app/(app)/_layout.tsx` — hook-based bg.
- All other files in earlier grep list — replace `import { colors }` w/ hook usage.

**Deleted exports (after migration complete):**
- `gradientStops`, `gradientLocations`, `gradientStart`, `gradientEnd` from `theme.ts`.
- Deprecated `colors` alias from `theme.ts`.

---

## Phase 1 — Theme primitives

### Task 1.1: Rewrite `theme.ts` with light + dark palettes

**Files:**
- Modify: `mobile/src/constants/theme.ts`

- [ ] **Step 1: Replace contents of `mobile/src/constants/theme.ts` with:**

```ts
import { useColorScheme } from "react-native";

export const lightColors = {
	primary: "#5C8A3A",
	primaryLight: "#8FBE5C",
	primaryDark: "#4A7028",
	primaryDeep: "#2F4A1A",
	accent: "#D49050",
	buttonSolidBg: "#5C8A3A",
	buttonSolidActive: "#4A7028",
	bg: "#FFFFFF",
	bgMid: "#F5F5F5",
	bgLight: "#EEEEEE",
	surface: "#FAFAFA",
	surfaceVariant: "rgba(10, 10, 10, 0.04)",
	glass: "rgba(10, 10, 10, 0.06)",
	glassHover: "rgba(10, 10, 10, 0.10)",
	cardGlassOverlay: "rgba(10, 10, 10, 0.03)",
	text: "#0A0A0A",
	textSecondary: "rgba(10, 10, 10, 0.65)",
	textMuted: "rgba(10, 10, 10, 0.45)",
	textDisabled: "rgba(10, 10, 10, 0.30)",
	placeholder: "rgba(10, 10, 10, 0.40)",
	border: "rgba(10, 10, 10, 0.12)",
	borderLight: "rgba(10, 10, 10, 0.08)",
	borderStrong: "rgba(10, 10, 10, 0.18)",
	borderInput: "rgba(10, 10, 10, 0.15)",
	borderError: "#E89AA5",
	tabBarTopBorder: "rgba(10, 10, 10, 0.08)",
	tabBarBg: "rgba(255, 255, 255, 0.85)",
	success: "#5C8A3A",
	successLight: "rgba(92, 138, 58, 0.15)",
	warning: "#D49050",
	warningLight: "rgba(212, 144, 80, 0.15)",
	error: "#E89AA5",
	errorLight: "rgba(232, 154, 165, 0.15)",
	info: "#4FB8E8",
	infoLight: "rgba(79, 184, 232, 0.15)",
	salesAccent: "#E89AA5",
	salesAccentLight: "rgba(232, 154, 165, 0.15)",
	restockAccent: "#A88500",
	restockAccentLight: "rgba(168, 133, 0, 0.15)",
} as const;

export const darkColors = {
	primary: "#8FBE5C",
	primaryLight: "#B8D67A",
	primaryDark: "#6B9A3D",
	primaryDeep: "#4A7028",
	accent: "#D49050",
	buttonSolidBg: "#5C8A3A",
	buttonSolidActive: "#4A7028",
	bg: "#0A0A0A",
	bgMid: "#161616",
	bgLight: "#1F1F1F",
	surface: "#141414",
	surfaceVariant: "rgba(250, 250, 250, 0.06)",
	glass: "rgba(250, 250, 250, 0.08)",
	glassHover: "rgba(250, 250, 250, 0.12)",
	cardGlassOverlay: "rgba(250, 250, 250, 0.04)",
	text: "#FAFAFA",
	textSecondary: "rgba(250, 250, 250, 0.72)",
	textMuted: "rgba(250, 250, 250, 0.50)",
	textDisabled: "rgba(250, 250, 250, 0.30)",
	placeholder: "rgba(250, 250, 250, 0.40)",
	border: "rgba(250, 250, 250, 0.12)",
	borderLight: "rgba(250, 250, 250, 0.08)",
	borderStrong: "rgba(250, 250, 250, 0.15)",
	borderInput: "rgba(250, 250, 250, 0.15)",
	borderError: "#E89AA5",
	tabBarTopBorder: "rgba(250, 250, 250, 0.06)",
	tabBarBg: "rgba(10, 10, 10, 0.85)",
	success: "#8FBE5C",
	successLight: "rgba(143, 190, 92, 0.15)",
	warning: "#D49050",
	warningLight: "rgba(212, 144, 80, 0.15)",
	error: "#E89AA5",
	errorLight: "rgba(232, 154, 165, 0.15)",
	info: "#4FB8E8",
	infoLight: "rgba(79, 184, 232, 0.15)",
	salesAccent: "#E89AA5",
	salesAccentLight: "rgba(232, 154, 165, 0.15)",
	restockAccent: "#E8DDA8",
	restockAccentLight: "rgba(232, 221, 168, 0.15)",
} as const;

export type ThemeColors = typeof darkColors;

export function useThemeColors(): ThemeColors {
	const scheme = useColorScheme();
	return scheme === "light" ? lightColors : darkColors;
}

/**
 * Deprecated. Use `useThemeColors()` instead.
 * Retained during the light/dark migration so non-migrated files still compile.
 * Remove after Phase 8.
 */
export const colors = darkColors;

export const systemTypes = {
	NFT: { color: "#4FB8E8", bg: "rgba(79, 184, 232, 0.15)", icon: "water" },
	DFT: { color: "#8FBE5C", bg: "rgba(143, 190, 92, 0.15)", icon: "layers" },
	DutchBucket: {
		color: "#D49050",
		bg: "rgba(212, 144, 80, 0.15)",
		icon: "nutrition",
	},
	Kratky: {
		color: "#E89AA5",
		bg: "rgba(232, 154, 165, 0.15)",
		icon: "flask",
	},
	SNAP: {
		color: "#E8DDA8",
		bg: "rgba(232, 221, 168, 0.15)",
		icon: "cloud",
	},
} as const;

export const inventoryCategoryMeta = {
	seeds: { color: "#8FBE5C", icon: "ellipse" },
	media: { color: "#D49050", icon: "layers" },
	nutrients: { color: "#4FB8E8", icon: "flask" },
	equipment: { color: "#E89AA5", icon: "construct" },
	packaging: { color: "#E8DDA8", icon: "cube" },
	other: { color: "rgba(128, 128, 128, 0.6)", icon: "ellipsis-horizontal" },
} as const;

export const produceStatusMeta = {
	ready: { color: "#5C8A3A", icon: "checkmark-circle", label: "Ready" },
	reserved: { color: "#D49050", icon: "time", label: "Reserved" },
	sold: { color: "rgba(128, 128, 128, 0.6)", icon: "cash", label: "Sold" },
} as const;

export const expiryStatusMeta = {
	ok: { color: "#5C8A3A", icon: "checkmark-circle", label: "OK" },
	warning: { color: "#D49050", icon: "warning", label: "EXPIRES SOON" },
	expired: { color: "#E89AA5", icon: "alert-circle", label: "EXPIRED" },
} as const;

export const spacing = {
	xxs: 4,
	xs: 8,
	sm: 12,
	md: 16,
	lg: 20,
	xl: 24,
	xxl: 32,
	xxxl: 40,
	jumbo: 48,
} as const;

export const radii = {
	sm: 8,
	md: 12,
	lg: 16,
	xl: 20,
	xxl: 24,
	full: 999,
} as const;

export const fontSize = {
	xs: 11,
	sm: 13,
	md: 15,
	lg: 17,
	xl: 20,
	xxl: 24,
	xxxl: 32,
} as const;
```

Notes on what changed:
- Removed `gradientStops`, `gradientLocations`, `gradientStart`, `gradientEnd` exports (consumers refactored in Phase 2).
- `restockAccent` and `restockAccentLight` are mode-aware (dim yellow on white is illegible).
- `success` color is mode-aware (`#5C8A3A` on white for AA contrast; `#8FBE5C` on dark).
- `inventoryCategoryMeta.other.color` and `produceStatusMeta.sold.color` use a 50% gray that reads on both backgrounds (not perfect but acceptable as small icon chips).
- `colors` is exported as alias to `darkColors` so files not yet migrated continue to compile and render in dark mode appearance.

- [ ] **Step 2: Typecheck.**

Run from `mobile/`:

```bash
bun run typecheck
```

Expected: no errors. If any file referenced `gradientStops` etc., they remain broken until Phase 2 — typecheck must still pass because the only such file is `mobile/src/components/ui/gradient-background.tsx`, modified in the next task.

If errors appear, they will reference `gradientStops`, `gradientLocations`, `gradientStart`, or `gradientEnd`. Proceed to Task 1.2 before committing.

### Task 1.2: Refactor `GradientBackground` to solid neutral bg

**Files:**
- Modify: `mobile/src/components/ui/gradient-background.tsx`

- [ ] **Step 1: Replace contents of `mobile/src/components/ui/gradient-background.tsx` with:**

```tsx
import type { ReactNode } from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { spacing, useThemeColors } from "@/constants/theme";

interface Props {
	children: ReactNode;
	withInsets?: boolean;
}

export function GradientBackground({ children, withInsets = true }: Props) {
	const insets = useSafeAreaInsets();
	const colors = useThemeColors();
	return (
		<View style={{ flex: 1, backgroundColor: colors.bg }}>
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
```

Notes:
- Component name kept as `GradientBackground` for now to avoid touching ~29 consumer files. Renaming is out of scope.
- `expo-linear-gradient` import dropped — package can stay installed; another component (sales.tsx) still uses it directly. Audit removal as separate task in Phase 9.

- [ ] **Step 2: Typecheck.**

Run from `mobile/`:

```bash
bun run typecheck
```

Expected: 0 errors.

- [ ] **Step 3: Lint.**

Run from `mobile/`:

```bash
bun run lint
```

Expected: clean.

- [ ] **Step 4: Commit.**

```bash
git add mobile/src/constants/theme.ts mobile/src/components/ui/gradient-background.tsx
git commit -m "refactor(theme): introduce light/dark palettes + useThemeColors hook"
```

### Task 1.3: Add `useStyles` helper

**Files:**
- Create: `mobile/src/lib/use-styles.ts`

- [ ] **Step 1: Write `mobile/src/lib/use-styles.ts`:**

```ts
import { useMemo } from "react";
import { type ThemeColors, useThemeColors } from "@/constants/theme";

/**
 * Compute a StyleSheet (or any value) keyed off the active theme palette.
 * The factory re-runs only when the palette identity changes (dark <-> light).
 */
export function useStyles<T>(factory: (colors: ThemeColors) => T): T {
	const colors = useThemeColors();
	return useMemo(() => factory(colors), [colors]);
}
```

- [ ] **Step 2: Typecheck.**

```bash
bun run typecheck
```

Expected: 0 errors.

- [ ] **Step 3: Commit.**

```bash
git add mobile/src/lib/use-styles.ts
git commit -m "feat(theme): add useStyles helper for theme-reactive StyleSheet"
```

---

## Phase 2 — Status bar + root layouts

### Task 2.1: Mode-aware StatusBar in root layout

**Files:**
- Modify: `mobile/src/app/_layout.tsx`

- [ ] **Step 1: Replace `mobile/src/app/_layout.tsx` contents with:**

```tsx
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useColorScheme } from "react-native";
import { Providers } from "@/components/providers";

export default function RootLayout() {
	const scheme = useColorScheme();
	return (
		<Providers>
			<StatusBar style={scheme === "light" ? "dark" : "light"} translucent />
			<Stack screenOptions={{ headerShown: false }}>
				<Stack.Screen name="(app)" />
				<Stack.Screen name="login" />
				<Stack.Screen name="signup" />
				<Stack.Screen name="recover-password" />
				<Stack.Screen name="reset-password" />
			</Stack>
		</Providers>
	);
}
```

- [ ] **Step 2: Typecheck.**

```bash
bun run typecheck
```

Expected: 0 errors.

### Task 2.2: Migrate `(app)/_layout.tsx`

**Files:**
- Modify: `mobile/src/app/(app)/_layout.tsx`

- [ ] **Step 1: Apply this diff (replace lines 16 and 44-51 of the current file):**

Change line 16 from:

```tsx
import { colors } from "@/constants/theme";
```

to:

```tsx
import { useThemeColors } from "@/constants/theme";
```

Inside `AppLayout`, after the existing hook declarations and before the `if (!isAuthenticated)` line, add:

```tsx
	const colors = useThemeColors();
```

The `return (...)` block keeps the same `colors.bg` references — they now resolve via the hook.

Full updated component for clarity:

```tsx
export default function AppLayout() {
	const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
	const pathname = usePathname();
	const pushHistory = useNavHistoryStore((s) => s.push);
	const colors = useThemeColors();

	useEffect(() => {
		if (pathname) pushHistory(pathname);
	}, [pathname, pushHistory]);

	if (!isAuthenticated) return <Redirect href="/login" />;

	return (
		<View style={{ flex: 1, backgroundColor: colors.bg }}>
			<OfflineBanner />
			<Tabs
				screenOptions={{
					headerShown: false,
					sceneStyle: { backgroundColor: colors.bg },
				}}
				tabBar={(props) => {
					/* unchanged */
				}}
			>
				{/* unchanged */}
			</Tabs>
		</View>
	);
}
```

- [ ] **Step 2: Typecheck.**

```bash
bun run typecheck
```

Expected: 0 errors.

- [ ] **Step 3: Commit.**

```bash
git add mobile/src/app/_layout.tsx mobile/src/app/(app)/_layout.tsx
git commit -m "feat(theme): apply useThemeColors to root + app layouts"
```

---

## Phase 3 — Per-file migration recipe

All remaining tasks follow a single mechanical recipe. The recipe below is referenced (not repeated) by each subsequent task.

**Migration recipe ("Recipe R"):**

For each file:

1. Locate the `import { colors, ... } from "@/constants/theme";` line. Replace the `colors` import with `useThemeColors`. Keep all other imports (`spacing`, `radii`, etc.). Example: `import { spacing, useThemeColors } from "@/constants/theme";`.
2. Find every React component declared in the file. Inside each component (after other hook calls, before any logic), add:

	```tsx
	const colors = useThemeColors();
	```

3. If the file has a top-level `const styles = StyleSheet.create({ ... })` referencing `colors.*`, move it inside the component using `useStyles`:

	```tsx
	import { useStyles } from "@/lib/use-styles";
	// ...
	const styles = useStyles((c) =>
		StyleSheet.create({
			root: { backgroundColor: c.bg, color: c.text },
			// ... rest of the styles, replacing `colors.X` with `c.X`
		}),
	);
	```

	If the file has multiple components sharing styles, declare `useStyles(...)` inside each consumer or lift into a custom hook in the same file.
4. If the file has top-level `const FOO_MAP: Record<...> = { key: colors.X }` lookups, move them inside the component as `const FOO_MAP = useMemo(() => ({ key: colors.X }), [colors]);`.
5. If the file declares props default values that reference `colors.*` at module scope (e.g. `defaultProps`), inline them via hook usage inside the component instead.
6. Search the rest of the file for any remaining bare `colors.` references. They are valid since `colors` is now a local const from the hook. No change needed.
7. Typecheck (`bun run typecheck` from `mobile/`). Must be 0 errors.
8. Stage the file path explicitly: `git add <path>`.
9. Commit using `refactor(theme): migrate <area> to useThemeColors`.

**Important constraints when applying Recipe R:**
- Never call `useThemeColors()` outside a component or other hook. Top-level module-scope calls fail at runtime.
- Never call `useThemeColors()` inside a render-loop callback (e.g. inside `.map`). Hoist `colors` to the parent component.
- Style factories that take `c => StyleSheet.create({...})` must reference `c.*`, not the outer `colors`, so they update when the palette changes.

---

## Phase 4 — Shared UI primitives

These files are imported by many screens; migrating them first means the visual change ripples downstream automatically.

### Task 4.1: Migrate `button.tsx`

**Files:**
- Modify: `mobile/src/components/ui/button.tsx`

The file declares `VARIANT_BG`, `VARIANT_BORDER`, and references `colors.buttonSolidBg`, `colors.buttonSolidActive`, `colors.glass` at module scope. These move inside the component.

- [ ] **Step 1: Replace the contents of `mobile/src/components/ui/button.tsx` with:**

```tsx
import { forwardRef } from "react";
import {
	ActivityIndicator,
	Pressable,
	type PressableProps,
	Text,
	View,
} from "react-native";
import { useThemeColors } from "@/constants/theme";

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
		const colors = useThemeColors();
		const v = variant;
		const sz = SIZE_STYLE[size];
		const blocked = isDisabled || disabled || isLoading;

		const variantBg: Record<Variant, string> = {
			solid: colors.buttonSolidBg,
			outline: colors.glass,
			ghost: "transparent",
			danger: "#DC2626",
			destructive: "#DC2626",
		};
		const variantBorder: Record<Variant, string | undefined> = {
			solid: undefined,
			outline: colors.borderStrong,
			ghost: undefined,
			danger: undefined,
			destructive: undefined,
		};
		const hasBorder = Boolean(variantBorder[v]);

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
						borderColor: variantBorder[v],
						backgroundColor: state.pressed
							? v === "solid"
								? colors.buttonSolidActive
								: v === "danger" || v === "destructive"
									? "#B91C1C"
									: colors.glassHover
							: variantBg[v],
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
```

Changed vs original:
- `VARIANT_BG`/`VARIANT_BORDER` lifted into component body (`variantBg`/`variantBorder`).
- `outline` border uses `colors.borderStrong` (was hardcoded `rgba(255,255,255,0.3)`) — now mode-aware.
- Pressed state for outline/ghost uses `colors.glassHover` (was hardcoded `rgba(255,255,255,0.1)`).
- Solid button text stays `#FFFFFF` (CTAs ride on green primary in both modes).

- [ ] **Step 2: Typecheck.**

```bash
bun run typecheck
```

- [ ] **Step 3: Commit.**

```bash
git add mobile/src/components/ui/button.tsx
git commit -m "refactor(ui): migrate Button to useThemeColors"
```

### Task 4.2 – Task 4.21: Migrate remaining UI primitives via Recipe R

For each file below, apply Recipe R (Phase 3) and then run `bun run typecheck`. Commit each file as its own commit using `refactor(ui): migrate <name> to useThemeColors`.

- [ ] 4.2  `mobile/src/components/ui/text.tsx`
- [ ] 4.3  `mobile/src/components/ui/input.tsx`
- [ ] 4.4  `mobile/src/components/ui/card.tsx`
- [ ] 4.5  `mobile/src/components/ui/badge.tsx`
- [ ] 4.6  `mobile/src/components/ui/form-field.tsx`
- [ ] 4.7  `mobile/src/components/ui/alert-card.tsx`
- [ ] 4.8  `mobile/src/components/ui/stat-card.tsx`
- [ ] 4.9  `mobile/src/components/ui/search-bar.tsx`
- [ ] 4.10 `mobile/src/components/ui/filter-chip.tsx`
- [ ] 4.11 `mobile/src/components/ui/combobox.tsx`
- [ ] 4.12 `mobile/src/components/ui/select.tsx`
- [ ] 4.13 `mobile/src/components/ui/section-header.tsx`
- [ ] 4.14 `mobile/src/components/ui/speech-bubble.tsx`
- [ ] 4.15 `mobile/src/components/ui/weather-card.tsx`
- [ ] 4.16 `mobile/src/components/ui/interactive-menu.tsx`
- [ ] 4.17 `mobile/src/components/ui/slot-meter.tsx`
- [ ] 4.18 `mobile/src/components/ui/progress-ring.tsx`
- [ ] 4.19 `mobile/src/components/ui/crop-composition-card.tsx`
- [ ] 4.20 `mobile/src/components/ui/phase-progression-card.tsx`
- [ ] 4.21 `mobile/src/components/ui/date-picker.tsx`

**Special note for Task 4.21 (`date-picker.tsx`):** Line 108 contains `colorScheme: "dark"` (CSS color-scheme attribute on the web `<input type="date">`). Replace with:

```tsx
colorScheme: useColorScheme() === "light" ? "light" : "dark",
```

Add `import { useColorScheme } from "react-native";` at the top. Note `useColorScheme` here is React Native's hook, not the CSS attribute.

**Special note for Task 4.13 (`section-header.tsx`):** No `colors.` usage may be present in StyleSheet — verify by reading the file. If not, the migration is just swapping the import.

---

## Phase 5 — Non-primitive components

### Task 5.1: Migrate `offline-banner.tsx`

**Files:**
- Modify: `mobile/src/components/offline-banner.tsx`

- [ ] **Step 1: Replace contents with:**

```tsx
import { View } from "react-native";
import { Text } from "@/components/ui/text";
import { spacing, useThemeColors } from "@/constants/theme";
import { useNetworkStore } from "@/stores/network-store";

export function OfflineBanner() {
	const isConnected = useNetworkStore((s) => s.isConnected);
	const isWifi = useNetworkStore((s) => s.isWifi);
	const colors = useThemeColors();

	if (isWifi) return null;

	return (
		<View
			style={{
				paddingHorizontal: spacing.md,
				paddingVertical: spacing.xs,
				backgroundColor: colors.warningLight,
			}}
		>
			<Text size="xs" style={{ color: colors.warning, textAlign: "center" }}>
				{isConnected
					? "On cellular — sync paused (WiFi only)"
					: "Offline — changes saved locally"}
			</Text>
		</View>
	);
}
```

- [ ] **Step 2: Typecheck.**

```bash
bun run typecheck
```

- [ ] **Step 3: Commit.**

```bash
git add mobile/src/components/offline-banner.tsx
git commit -m "refactor(theme): migrate OfflineBanner to useThemeColors"
```

### Task 5.2 – Task 5.5: Migrate remaining components via Recipe R

For each file, apply Recipe R. Commit individually using `refactor(theme): migrate <name> to useThemeColors`.

- [ ] 5.2 `mobile/src/components/ai-chat.tsx`
- [ ] 5.3 `mobile/src/lib/markdown-render.tsx` — markdown rules carry color via a style object. Move the style object inside the component via `useStyles`.
- [ ] 5.4 `mobile/src/components/sales/bulk-add-sheet.tsx`
- [ ] 5.5 `mobile/src/components/inventory/movement-sheet.tsx`

---

## Phase 6 — Auth screens

### Task 6.1 – Task 6.4: Migrate auth screens via Recipe R

- [ ] 6.1 `mobile/src/app/login.tsx`
- [ ] 6.2 `mobile/src/app/signup.tsx`
- [ ] 6.3 `mobile/src/app/recover-password.tsx`
- [ ] 6.4 `mobile/src/app/reset-password.tsx`

Commit each as `refactor(auth): migrate <screen> to useThemeColors`.

---

## Phase 7 — App screens (tabs + stacks)

### Task 7.1: Migrate `sales.tsx` (also uses `LinearGradient` directly)

**Files:**
- Modify: `mobile/src/app/(app)/sales.tsx`

- [ ] **Step 1: Read the file to see how `LinearGradient` is used.**

```bash
grep -n "LinearGradient\|gradientStops" mobile/src/app/(app)/sales.tsx
```

- [ ] **Step 2: Apply Recipe R to migrate `colors` usage.** Separately, replace the `LinearGradient` usage with a plain `View` that has `backgroundColor: colors.surface` (or whichever palette token best matches the design intent — verify visually). Remove the `LinearGradient` import and any `gradientStops` reference.

- [ ] **Step 3: Typecheck.**

```bash
bun run typecheck
```

- [ ] **Step 4: Commit.**

```bash
git add mobile/src/app/(app)/sales.tsx
git commit -m "refactor(sales): migrate to useThemeColors + drop gradient"
```

### Task 7.2 – Task 7.27: Migrate remaining screens via Recipe R

For each file, apply Recipe R. Commit individually using `refactor(<area>): migrate <screen> to useThemeColors` (use `home`, `setups`, `seeds`, `inventory`, `library`, `batch`, `setup`, `produce`, etc. as appropriate).

- [ ] 7.2  `mobile/src/app/(app)/index.tsx` (home)
- [ ] 7.3  `mobile/src/app/(app)/setups.tsx`
- [ ] 7.4  `mobile/src/app/(app)/seeds.tsx`
- [ ] 7.5  `mobile/src/app/(app)/inventory.tsx`
- [ ] 7.6  `mobile/src/app/(app)/checklist.tsx`
- [ ] 7.7  `mobile/src/app/(app)/settings.tsx`
- [ ] 7.8  `mobile/src/app/(app)/inventory-new.tsx`
- [ ] 7.9  `mobile/src/app/(app)/inventory/[id].tsx`
- [ ] 7.10 `mobile/src/app/(app)/produce-new.tsx`
- [ ] 7.11 `mobile/src/app/(app)/produce/[id].tsx`
- [ ] 7.12 `mobile/src/app/(app)/sale-new.tsx`
- [ ] 7.13 `mobile/src/app/(app)/setup/new.tsx`
- [ ] 7.14 `mobile/src/app/(app)/setup/[id]/index.tsx`
- [ ] 7.15 `mobile/src/app/(app)/setup/[id]/edit.tsx`
- [ ] 7.16 `mobile/src/app/(app)/batch/new.tsx`
- [ ] 7.17 `mobile/src/app/(app)/batch/[id].tsx`
- [ ] 7.18 `mobile/src/app/(app)/library/index.tsx`
- [ ] 7.19 `mobile/src/app/(app)/library/crops/index.tsx`
- [ ] 7.20 `mobile/src/app/(app)/library/crops/[id].tsx`
- [ ] 7.21 `mobile/src/app/(app)/library/guides/index.tsx`
- [ ] 7.22 `mobile/src/app/(app)/library/guides/[id].tsx`
- [ ] 7.23 `mobile/src/app/(app)/library/pests/index.tsx`
- [ ] 7.24 `mobile/src/app/(app)/library/pests/[id].tsx`

---

## Phase 8 — Remove legacy alias

### Task 8.1: Remove deprecated `colors` export

**Files:**
- Modify: `mobile/src/constants/theme.ts`

- [ ] **Step 1: Confirm no remaining imports reference `colors` directly.**

Run from repo root:

```bash
grep -rn "import { colors" mobile/src
grep -rn "import {.*\bcolors\b" mobile/src
```

Expected: only matches inside `theme.ts` itself, none in consumer files. If any remain, finish their migration before continuing.

- [ ] **Step 2: Remove these lines from `mobile/src/constants/theme.ts`:**

```ts
/**
 * Deprecated. Use `useThemeColors()` instead.
 * Retained during the light/dark migration so non-migrated files still compile.
 * Remove after Phase 8.
 */
export const colors = darkColors;
```

- [ ] **Step 3: Typecheck.**

```bash
bun run typecheck
```

Expected: 0 errors. If errors appear, the grep in Step 1 missed something — find and migrate, then re-run typecheck.

- [ ] **Step 4: Lint.**

```bash
bun run lint
```

- [ ] **Step 5: Commit.**

```bash
git add mobile/src/constants/theme.ts
git commit -m "chore(theme): remove deprecated colors alias"
```

---

## Phase 9 — QA + cleanup

### Task 9.1: Audit `expo-linear-gradient` usage

- [ ] **Step 1: Confirm no remaining uses.**

```bash
grep -rn "LinearGradient\|expo-linear-gradient" mobile/src
```

If empty, remove the package:

```bash
cd mobile && bun remove expo-linear-gradient
```

If there are still uses, leave the package installed; just note them in the commit message.

- [ ] **Step 2: Commit (if removed).**

```bash
git add mobile/package.json mobile/bun.lock
git commit -m "chore(deps): drop expo-linear-gradient"
```

### Task 9.2: Visual QA — dark mode

- [ ] **Step 1: Start the iOS simulator (or Android emulator) in dark mode.**

```bash
cd mobile && bun run ios
```

In simulator: Features → Toggle Appearance → Dark.

- [ ] **Step 2: Walk through every top-level tab.**

Verify each renders without missing/black-on-black/white-on-white text:
- Home (`/`)
- Setups
- Seeds
- Inventory
- Sales
- Settings (gear from tab bar or wherever exposed)
- Library
- Checklist
- Auth: log out and exercise Login, Signup, Recover, Reset

- [ ] **Step 3: Exercise modals and sheets.**

Open: inventory movement sheet, bulk-add sheet (sales), AI chat, date picker, combobox dropdowns. Verify legibility.

### Task 9.3: Visual QA — light mode

- [ ] **Step 1: Toggle the simulator to light appearance.**

In iOS simulator: Features → Toggle Appearance → Light.

- [ ] **Step 2: Walk through the same flows as Task 9.2.**

For any screen that looks broken (e.g. white text on white bg, status icon vanishing), open the offending file and verify it uses `useThemeColors()` rather than a hardcoded color. Fix and commit as `fix(theme): correct <area> contrast in light mode`.

### Task 9.4: Verify mid-session switching

- [ ] **Step 1: With the app open, toggle simulator appearance.**

In simulator: Features → Toggle Appearance.

- [ ] **Step 2: Confirm screens re-render to new mode without restart.** If a screen doesn't, that file's `useThemeColors` call is likely outside a React component (e.g. inside a module-level constant). Fix and commit.

### Task 9.5: Final typecheck + lint

- [ ] **Step 1: Run both.**

```bash
cd mobile && bun run typecheck && bun run lint
```

Expected: clean. Address any remaining issues, commit fixes individually.

### Task 9.6: Smoke notice on existing builds

- [ ] **Step 1: Note that EAS/preview builds in the repo root (e.g. `mobile/build-*.apk`) predate this change and remain at the old palette.** No action required — they're snapshots, not source. Mention in the eventual PR description.

---

## Self-Review

- **Spec coverage:** every spec section maps to tasks.
	- Light/dark palettes — Task 1.1.
	- `useThemeColors` hook — Task 1.1.
	- `useStyles` helper — Task 1.3.
	- Gradient dropped — Task 1.2.
	- Brand green as 10% accent — Task 1.1 (`primary` token in both palettes), enforced by leaving `buttonSolidBg`, `primary` etc. green.
	- Status/system-type/category hues unchanged — Task 1.1.
	- StatusBar mode-aware — Task 2.1.
	- 56 file sweep — Phases 4–7.
	- Mode-aware `colorScheme: "dark"` in `date-picker.tsx` — Task 4.21.
	- Markdown render — Task 5.3.
	- AI chat — Task 5.2.
	- Solid `bg` not gradient — Task 1.2 (`GradientBackground`) + Task 7.1 (sales).
	- Legacy alias removal — Task 8.1.
	- Visual QA — Task 9.2 / 9.3.
	- `null` color scheme defaults to dark — Task 1.1 (`scheme === "light" ? lightColors : darkColors` — anything else returns dark).
	- No manual toggle — by omission (not in plan).
- **Placeholder scan:** no TBD/TODO. All steps contain exact code or exact commands.
- **Type consistency:** `useThemeColors` returns `ThemeColors` everywhere; `useStyles` signature consistent; `colors` is the local convention in components after migration.

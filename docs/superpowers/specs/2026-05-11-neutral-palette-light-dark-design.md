# Neutral Palette + Light/Dark Mode (60-30-10)

**Date:** 2026-05-11
**Scope:** Mobile app (`mobile/`) only. No backend/frontend web changes.
**Goal:** Apply 60-30-10 color rule. Most UI surfaces become neutral (white/black depending on mode). Brand green retained as 10% accent. Add automatic light/dark mode based on system preference.

## Color Theory Reference

60-30-10 rule:

- **60% dominant** — backgrounds, large surfaces. Neutral.
- **30% secondary** — cards, sidebars, modals, raised surfaces. Lighter/darker neutral.
- **10% accent** — CTAs, active states, focus rings, key icons. Brand green `#8FBE5C` (dark) / `#5C8A3A` (light).

Status colors (success/warning/error/info), system-type chips (NFT/DFT/DutchBucket/Kratky/SNAP), inventory category icons, and produce/expiry status icons retain their hues. Each appears as small icon-sized footprint within the 10% accent budget.

## Token Design

### Light Palette

| Token | Value | Role |
|---|---|---|
| `bg` | `#FFFFFF` | 60% dominant background |
| `bgMid` | `#F5F5F5` | 30% mid surface |
| `bgLight` | `#EEEEEE` | 30% raised |
| `surface` | `#FAFAFA` | 30% card |
| `surfaceVariant` | `rgba(10,10,10,0.04)` | subtle overlay |
| `glass` | `rgba(10,10,10,0.06)` | translucent surface |
| `glassHover` | `rgba(10,10,10,0.10)` | hover state |
| `cardGlassOverlay` | `rgba(10,10,10,0.03)` | card overlay |
| `text` | `#0A0A0A` | primary text |
| `textSecondary` | `rgba(10,10,10,0.65)` | secondary text |
| `textMuted` | `rgba(10,10,10,0.45)` | muted text |
| `textDisabled` | `rgba(10,10,10,0.30)` | disabled |
| `placeholder` | `rgba(10,10,10,0.40)` | input placeholder |
| `border` | `rgba(10,10,10,0.12)` | default border |
| `borderLight` | `rgba(10,10,10,0.08)` | subtle border |
| `borderStrong` | `rgba(10,10,10,0.18)` | strong border |
| `borderInput` | `rgba(10,10,10,0.15)` | input border |
| `tabBarTopBorder` | `rgba(10,10,10,0.08)` | tab bar separator |
| `tabBarBg` | `rgba(255,255,255,0.85)` | tab bar bg |
| `primary` | `#5C8A3A` | 10% accent (darker green for light bg AA contrast) |
| `primaryLight` | `#8FBE5C` | hover/lighter accent |
| `primaryDark` | `#4A7028` | pressed accent |
| `primaryDeep` | `#2F4A1A` | deep accent |
| `accent` | `#D49050` | secondary accent (kept) |
| `buttonSolidBg` | `#5C8A3A` | CTA bg |
| `buttonSolidActive` | `#4A7028` | CTA pressed |

### Dark Palette

| Token | Value | Role |
|---|---|---|
| `bg` | `#0A0A0A` | 60% dominant background |
| `bgMid` | `#161616` | 30% mid surface |
| `bgLight` | `#1F1F1F` | 30% raised |
| `surface` | `#141414` | 30% card |
| `surfaceVariant` | `rgba(250,250,250,0.06)` | subtle overlay |
| `glass` | `rgba(250,250,250,0.08)` | translucent surface |
| `glassHover` | `rgba(250,250,250,0.12)` | hover state |
| `cardGlassOverlay` | `rgba(250,250,250,0.04)` | card overlay |
| `text` | `#FAFAFA` | primary text |
| `textSecondary` | `rgba(250,250,250,0.72)` | secondary text |
| `textMuted` | `rgba(250,250,250,0.50)` | muted text |
| `textDisabled` | `rgba(250,250,250,0.30)` | disabled |
| `placeholder` | `rgba(250,250,250,0.40)` | input placeholder |
| `border` | `rgba(250,250,250,0.12)` | default border |
| `borderLight` | `rgba(250,250,250,0.08)` | subtle border |
| `borderStrong` | `rgba(250,250,250,0.15)` | strong border |
| `borderInput` | `rgba(250,250,250,0.15)` | input border |
| `tabBarTopBorder` | `rgba(250,250,250,0.06)` | tab bar separator |
| `tabBarBg` | `rgba(10,10,10,0.85)` | tab bar bg |
| `primary` | `#8FBE5C` | 10% accent (lighter green for dark bg AA contrast) |
| `primaryLight` | `#B8D67A` | hover |
| `primaryDark` | `#6B9A3D` | pressed |
| `primaryDeep` | `#4A7028` | deep |
| `accent` | `#D49050` | secondary accent (kept) |
| `buttonSolidBg` | `#5C8A3A` | CTA bg |
| `buttonSolidActive` | `#4A7028` | CTA pressed |

### Shared Across Both Modes (no light/dark variant)

Status, system type, category, and produce/expiry hues stay identical between modes:

- `success: #8FBE5C`, `successLight: rgba(143,190,92,0.15)`
- `warning: #D49050`, `warningLight: rgba(212,144,80,0.15)`
- `error: #E89AA5`, `errorLight: rgba(232,154,165,0.15)`
- `info: #4FB8E8`, `infoLight: rgba(79,184,232,0.15)`
- `borderError: #E89AA5`
- `salesAccent`, `restockAccent` + light variants — unchanged
- `systemTypes` map — unchanged
- `inventoryCategoryMeta` — unchanged except `other.color` becomes mode-aware textMuted
- `produceStatusMeta` — unchanged except `sold.color` becomes mode-aware textMuted
- `expiryStatusMeta` — unchanged

### Gradient

Current 5-stop green gradient on screens is anti-neutral. Replace:

- **Light mode:** solid `bg` (`#FFFFFF`), no gradient.
- **Dark mode:** subtle neutral gradient `["#000000", "#0A0A0A", "#141414", "#0A0A0A", "#000000"]` or solid `bg`.

Decision: solid `bg` for both modes. Drop gradient entirely. Cleaner, matches 60-30-10 dominant principle.

`gradientStops`, `gradientLocations`, `gradientStart`, `gradientEnd` exports become mode-aware or removed. Consumers using `LinearGradient` switch to plain `View` w/ `bg`.

## API Design

### `useThemeColors()` Hook

```ts
// src/constants/theme.ts
import { useColorScheme } from "react-native";

export const lightColors = { /* ... */ } as const;
export const darkColors = { /* ... */ } as const;
export type ThemeColors = typeof lightColors;

export function useThemeColors(): ThemeColors {
  const scheme = useColorScheme();
  return scheme === "light" ? lightColors : darkColors;
}
```

Default to dark when scheme is `null`/`undefined` (preserves current behavior on launch before scheme resolves).

### `makeStyles` Pattern

Most current files declare `StyleSheet.create({ ... colors.text ... })` at module scope. Must move inside components:

```tsx
// Before
const styles = StyleSheet.create({ root: { backgroundColor: colors.bg } });
function Screen() { return <View style={styles.root} />; }

// After
function Screen() {
  const colors = useThemeColors();
  const styles = useMemo(() => StyleSheet.create({
    root: { backgroundColor: colors.bg },
  }), [colors]);
  return <View style={styles.root} />;
}
```

Helper to reduce boilerplate:

```ts
// src/lib/use-styles.ts
export function useStyles<T>(factory: (c: ThemeColors) => T): T {
  const colors = useThemeColors();
  return useMemo(() => factory(colors), [colors]);
}
```

Usage:

```tsx
const styles = useStyles((c) => StyleSheet.create({
  root: { backgroundColor: c.bg, color: c.text },
}));
```

### Backwards Compat Shim

Export legacy `colors` constant aliased to `darkColors` so non-reactive imports keep compiling during migration. Remove after sweep complete.

```ts
export const colors = darkColors; // deprecated, use useThemeColors()
```

## File Sweep

56 files import `colors`. Each needs:

1. Replace top-level `const styles = StyleSheet.create(...)` w/ `useStyles((c) => ...)` inside component.
2. Replace bare `colors.X` references in JSX w/ `c.X` inside the factory (or `useThemeColors()` call when used in JSX directly, e.g., icon `color` prop).
3. For `LinearGradient` usage on screen backgrounds: replace w/ `<View style={{ backgroundColor: c.bg, flex: 1 }}>` (gradient removed).

Files affected (from earlier grep, 56 total). Critical paths:

- `src/app/(app)/*.tsx` — main screens
- `src/app/login.tsx`, `signup.tsx`, `recover-password.tsx`, `reset-password.tsx`
- `src/components/**` — shared UI
- `src/lib/markdown-render.tsx`
- `src/components/ui/date-picker.tsx` — has hardcoded `colorScheme: "dark"`, must become mode-aware

## StatusBar

Mobile uses `expo-status-bar`. Make `style` mode-aware (`"light"` in dark mode, `"dark"` in light mode). Single config in `_layout.tsx`.

## Edge Cases

- **`useColorScheme()` returns `null`** before first paint → fall back to dark (current behavior preserves continuity).
- **Modals/overlays via `react-native-modal`** — backdrop opacity may need adjustment for light mode (current dark bg masks easily; light bg needs darker backdrop).
- **GIF/PNG assets** — mascot, welcome gif, app icons — unchanged. They carry their own color.
- **`react-native-svg` icons** — drive `color` prop from `useThemeColors()`.
- **AI chat markdown** — `markdown-render.tsx` color refs must use hook.
- **Date picker** (`date-picker.tsx:108`) — `colorScheme: "dark"` hardcode → conditional.

## Non-Goals

- No manual light/dark toggle in settings. System preference only. (Can add later as separate spec.)
- No theme persistence/storage.
- No re-skin of brand assets (icon, gif).
- No backend or web frontend changes.
- No new accent color introduction.

## Testing Strategy

- Visual smoke test each top-level screen in both modes via iOS simulator and Android emulator.
- Toggle system appearance mid-session, confirm screens re-render correctly.
- Verify status bar contrast on both modes.
- Verify text contrast meets WCAG AA: `text` on `bg`, `textSecondary` on `bg`, `primary` on `bg` for CTAs.
- Confirm modals/overlays remain legible.

## Migration Order

Phased to allow incremental review:

1. Token layer — add `lightColors`, `darkColors`, `useThemeColors`, `useStyles`. Keep legacy `colors = darkColors` alias.
2. Drop gradient. Update screens to solid `bg`.
3. Migrate `src/app/(app)/_layout.tsx` + tab bar (high traffic).
4. Migrate `src/app/(app)/index.tsx` (home).
5. Migrate remaining `(app)` screens.
6. Migrate auth screens (`login`, `signup`, etc.).
7. Migrate shared components.
8. Migrate `markdown-render`, `date-picker`, `offline-banner`, `ai-chat`.
9. Remove legacy `colors` alias.
10. Visual QA pass both modes.

## Open Questions

None. All decisions locked.

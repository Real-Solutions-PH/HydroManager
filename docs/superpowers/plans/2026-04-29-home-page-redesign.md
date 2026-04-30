# Home Page Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the mobile home screen to match the new UX references — localized greeting, daily check-in card, today's-tasks progress ring, KPI grid, severity-coded alerts, upcoming harvests row, recent activity feed, and a 3×2 quick-actions grid — backed by existing APIs with mocks where the backend doesn't yet support a section.

**Architecture:** Full rewrite of `mobile/src/app/(app)/index.tsx`. Two new shared UI primitives (`ProgressRing`, `AlertCard`) live under `mobile/src/components/ui/`. All other sub-components stay inline in the home screen file. New copy goes through the existing `useT()` i18n hook (en + tl dicts in `mobile/src/lib/i18n.ts`).

**Tech Stack:** Expo + expo-router, React Native, TanStack Query, react-native-svg (already installed), Ionicons, existing theme tokens in `mobile/src/constants/theme.ts`.

**Verification:** Project has no test runner. Each task uses `bun --cwd mobile typecheck` (resolves to `tsc --noEmit`) and a final manual smoke as the gate. No unit tests are written. Commits are kept small.

---

## File Structure

| Path | Action | Responsibility |
|---|---|---|
| `mobile/src/components/ui/progress-ring.tsx` | Create | Circular SVG progress indicator |
| `mobile/src/components/ui/alert-card.tsx` | Create | Severity-coded alert row (urgent / low / info) |
| `mobile/src/lib/i18n.ts` | Modify | Add new keys under `home.*` in both `en` and `tl` |
| `mobile/src/app/(app)/index.tsx` | Rewrite | Home screen sections + inline sub-components |

---

## Task 1: Extend i18n dictionaries

**Files:**
- Modify: `mobile/src/lib/i18n.ts` (extend the `en.home` and `tl.home` objects)

- [ ] **Step 1: Add new keys to `en.home`**

Open `mobile/src/lib/i18n.ts`. Locate the `en.home` object (currently ends after `no_setups`). Replace the `home` block with the version below (keeps existing keys, adds new ones). Existing screens may reference `today`, `today_subtitle`, `stats_setups`, etc. — leave those keys present.

```ts
home: {
    // existing
    greeting: "Hi,",
    default_name: "Grower",
    today: "Today",
    today_subtitle: "At-a-glance farm status",
    stats_setups: "Setups",
    stats_batches: "Batches",
    stats_harvest: "Near Harvest",
    stats_low_stock: "Low Stock",
    quick_actions: "Quick Actions",
    new_setup: "New Setup",
    start_batch: "Start a Batch",
    add_inventory: "Add Inventory Item",
    alerts: "Alerts",
    low_stock_title: "Low Stock",
    setups_section: "Setups",
    setups_subtitle: "Your active systems",
    no_setups: "No setups yet. Add your first.",
    // new
    greeting_morning: "Good morning! 🇵🇭",
    greeting_afternoon: "Good afternoon! 🇵🇭",
    greeting_evening: "Good evening! 🇵🇭",
    farm_suffix: "'s Farm",
    checkin_quote: "How's your farm today? 👋",
    checkin_summary: "{tasks} tasks pending • {harvests} batches ready to check • {low} low stock",
    todays_tasks: "Today's Tasks",
    tasks_done_count: "{done} of {total} tasks completed today",
    kpi_active_setups: "Active Setups",
    kpi_plant_batches: "Plant Batches",
    kpi_near_harvest: "Near Harvest",
    kpi_low_stock: "Low Stock",
    alert_severity_urgent: "URGENT",
    alert_severity_low: "LOW",
    upcoming_harvests: "Upcoming Harvests",
    see_all: "See all",
    days_left: "{n}d left",
    recent_activity: "Recent Activity",
    qa_new_batch: "New Batch",
    qa_log_reading: "Log Reading",
    qa_crop_guide: "Crop Guide",
    qa_add_sale: "Add Sale",
    qa_restock: "Restock",
    qa_tasks: "Tasks",
},
```

(Flat keys — no nested `kpi.*` / `alert.*` / `qa.*` — to keep the typed `t()` lookups simple and match the existing flat shape.)

- [ ] **Step 2: Add the same new keys to `tl.home`**

In the `tl.home` block (currently ends after `no_setups`), add the matching Filipino translations. Existing keys remain.

```ts
home: {
    // existing
    greeting: "Kumusta,",
    default_name: "Magsasaka",
    today: "Ngayon",
    today_subtitle: "Mabilis na tanaw ng sakahan",
    stats_setups: "Setup",
    stats_batches: "Batch",
    stats_harvest: "Malapit nang Anihin",
    stats_low_stock: "Kulang na Stock",
    quick_actions: "Mabilisang Aksyon",
    new_setup: "Bagong Setup",
    start_batch: "Magsimula ng Batch",
    add_inventory: "Magdagdag ng Imbentaryo",
    alerts: "Mga Alerto",
    low_stock_title: "Kulang ang Stock",
    setups_section: "Mga Setup",
    setups_subtitle: "Iyong aktibong mga sistema",
    no_setups: "Wala pang setup. Magdagdag.",
    // new
    greeting_morning: "Magandang umaga! 🇵🇭",
    greeting_afternoon: "Magandang hapon! 🇵🇭",
    greeting_evening: "Magandang gabi! 🇵🇭",
    farm_suffix: " Farm",
    checkin_quote: "Kumusta ang farm mo ngayon! 👋",
    checkin_summary: "{tasks} gawain natitira • {harvests} batch handa nang suriin • {low} kulang na stock",
    todays_tasks: "Mga Gawain Ngayon",
    tasks_done_count: "{done} sa {total} gawain natapos ngayon",
    kpi_active_setups: "Aktibong Setup",
    kpi_plant_batches: "Batch ng Halaman",
    kpi_near_harvest: "Malapit Anihin",
    kpi_low_stock: "Mababang Stock",
    alert_severity_urgent: "URGENTE",
    alert_severity_low: "MABABA",
    upcoming_harvests: "Mga Paparating na Ani",
    see_all: "Tingnan lahat",
    days_left: "{n}d natitira",
    recent_activity: "Kamakailang Aktibidad",
    qa_new_batch: "Bagong Batch",
    qa_log_reading: "Itala ang Reading",
    qa_crop_guide: "Gabay sa Pananim",
    qa_add_sale: "Magdagdag ng Benta",
    qa_restock: "Punan ang Stock",
    qa_tasks: "Mga Gawain",
},
```

- [ ] **Step 3: Typecheck**

Run from repo root:

```bash
bun --cwd mobile typecheck
```

Expected: PASS (no new errors). The `tl: typeof en` constraint enforces parity — both dicts must contain identical keys.

- [ ] **Step 4: Commit**

```bash
git add mobile/src/lib/i18n.ts
git commit -m "feat(i18n): add home redesign keys (en + tl)"
```

---

## Task 2: Create `ProgressRing` primitive

**Files:**
- Create: `mobile/src/components/ui/progress-ring.tsx`

- [ ] **Step 1: Write the component**

```tsx
import type { ReactNode } from "react";
import { View } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { colors } from "@/constants/theme";

interface ProgressRingProps {
    size: number;
    progress: number; // 0..1
    strokeWidth?: number;
    color?: string;
    trackColor?: string;
    children?: ReactNode;
}

export function ProgressRing({
    size,
    progress,
    strokeWidth = 6,
    color = colors.primaryLight,
    trackColor = colors.glass,
    children,
}: ProgressRingProps) {
    const clamped = Math.max(0, Math.min(1, progress));
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference * (1 - clamped);
    const center = size / 2;
    const percent = Math.round(clamped * 100);

    return (
        <View
            style={{ width: size, height: size }}
            accessibilityRole="progressbar"
            accessibilityValue={{ now: percent, min: 0, max: 100 }}
        >
            <Svg width={size} height={size}>
                <Circle
                    cx={center}
                    cy={center}
                    r={radius}
                    stroke={trackColor}
                    strokeWidth={strokeWidth}
                    fill="none"
                />
                <Circle
                    cx={center}
                    cy={center}
                    r={radius}
                    stroke={color}
                    strokeWidth={strokeWidth}
                    fill="none"
                    strokeDasharray={`${circumference} ${circumference}`}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    transform={`rotate(-90 ${center} ${center})`}
                />
            </Svg>
            {children ? (
                <View
                    style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                >
                    {children}
                </View>
            ) : null}
        </View>
    );
}
```

- [ ] **Step 2: Typecheck**

```bash
bun --cwd mobile typecheck
```

Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add mobile/src/components/ui/progress-ring.tsx
git commit -m "feat(ui): add ProgressRing primitive"
```

---

## Task 3: Create `AlertCard` primitive

**Files:**
- Create: `mobile/src/components/ui/alert-card.tsx`

- [ ] **Step 1: Write the component**

```tsx
import { Ionicons } from "@expo/vector-icons";
import { Pressable, View } from "react-native";
import { Card } from "@/components/ui/card";
import { Text } from "@/components/ui/text";
import { colors, radii, spacing } from "@/constants/theme";

export type AlertSeverity = "urgent" | "low" | "info";

interface AlertCardProps {
    severity: AlertSeverity;
    icon: React.ComponentProps<typeof Ionicons>["name"];
    title: string;
    subtitle: string;
    pillLabel?: string;
    onPress?: () => void;
    chevron?: boolean;
}

const SEVERITY = {
    urgent: {
        border: colors.error,
        pillBg: colors.errorLight,
        pillText: colors.error,
        iconBg: colors.errorLight,
        iconColor: colors.error,
    },
    low: {
        border: colors.warning,
        pillBg: colors.warningLight,
        pillText: colors.warning,
        iconBg: colors.warningLight,
        iconColor: colors.warning,
    },
    info: {
        border: colors.info,
        pillBg: colors.infoLight,
        pillText: colors.info,
        iconBg: colors.infoLight,
        iconColor: colors.info,
    },
} as const;

export function AlertCard({
    severity,
    icon,
    title,
    subtitle,
    pillLabel,
    onPress,
    chevron,
}: AlertCardProps) {
    const s = SEVERITY[severity];

    const body = (
        <View
            style={{
                borderLeftWidth: 4,
                borderLeftColor: s.border,
                borderRadius: radii.lg,
            }}
        >
            <Card>
                <View
                    style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: spacing.sm,
                    }}
                >
                    <View
                        style={{
                            width: 40,
                            height: 40,
                            borderRadius: radii.md,
                            backgroundColor: s.iconBg,
                            alignItems: "center",
                            justifyContent: "center",
                        }}
                    >
                        <Ionicons name={icon} size={20} color={s.iconColor} />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text weight="semibold">{title}</Text>
                        <Text size="sm" tone="muted">
                            {subtitle}
                        </Text>
                    </View>
                    {pillLabel ? (
                        <View
                            style={{
                                paddingHorizontal: spacing.sm,
                                paddingVertical: 4,
                                borderRadius: radii.full,
                                backgroundColor: s.pillBg,
                            }}
                        >
                            <Text
                                size="xs"
                                weight="bold"
                                style={{ color: s.pillText }}
                            >
                                {pillLabel}
                            </Text>
                        </View>
                    ) : null}
                    {chevron ? (
                        <Ionicons
                            name="chevron-forward"
                            size={18}
                            color={colors.textMuted}
                        />
                    ) : null}
                </View>
            </Card>
        </View>
    );

    if (onPress) {
        return (
            <Pressable
                onPress={onPress}
                accessibilityRole="button"
                style={({ pressed }) => ({
                    opacity: pressed ? 0.92 : 1,
                })}
            >
                {body}
            </Pressable>
        );
    }
    return body;
}
```

- [ ] **Step 2: Typecheck**

```bash
bun --cwd mobile typecheck
```

Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add mobile/src/components/ui/alert-card.tsx
git commit -m "feat(ui): add AlertCard primitive"
```

---

## Task 4: Rewrite home screen — header + check-in + tasks + KPI

**Files:**
- Rewrite: `mobile/src/app/(app)/index.tsx`

This task replaces the existing home screen with a partial new layout: header, daily check-in, tasks ring, KPI grid. Sections 5–8 (alerts, harvests, activity, quick actions) are added in Task 5. Splitting the rewrite into two commits keeps each diff reviewable.

- [ ] **Step 1: Replace `index.tsx` with the new top-half implementation**

Full file contents:

```tsx
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { Link } from "expo-router";
import { Pressable, ScrollView, View } from "react-native";
import { Card } from "@/components/ui/card";
import { GradientBackground } from "@/components/ui/gradient-background";
import { ProgressRing } from "@/components/ui/progress-ring";
import { Text } from "@/components/ui/text";
import { colors, radii, spacing } from "@/constants/theme";
import {
    batchesApi,
    checklistApi,
    inventoryApi,
    setupsApi,
    usersApi,
} from "@/lib/hydro-api";
import { useT } from "@/lib/i18n";

const TASKS_PROGRESS_MOCK = 0.67;
const TASKS_DONE_MOCK = 8;
const TASKS_TOTAL_MOCK = 12;

function getGreetingKey(hour: number): string {
    if (hour < 12) return "home.greeting_morning";
    if (hour < 18) return "home.greeting_afternoon";
    return "home.greeting_evening";
}

export default function HomeScreen() {
    const { t, locale } = useT();

    const userQ = useQuery({ queryKey: ["me"], queryFn: () => usersApi.me() });
    const setupsQ = useQuery({
        queryKey: ["setups"],
        queryFn: () => setupsApi.list(),
    });
    const batchesQ = useQuery({
        queryKey: ["batches"],
        queryFn: () => batchesApi.list(),
    });
    const inventoryQ = useQuery({
        queryKey: ["inventory"],
        queryFn: () => inventoryApi.list(),
    });
    const checklistQ = useQuery({
        queryKey: ["checklist"],
        queryFn: () => checklistApi.list(),
    });

    const firstName =
        userQ.data?.full_name?.split(" ")[0] ?? t("home.default_name");
    const farmName = t("home.farm_label", { name: firstName });
    const greeting = t(getGreetingKey(new Date().getHours()));

    const lowStock = (inventoryQ.data?.data ?? []).filter((i) => i.is_low_stock);
    const harvestReady = (batchesQ.data?.data ?? []).filter(
        (b) =>
            Math.floor(
                (Date.now() - new Date(b.started_at).getTime()) / 86400000,
            ) >= 25,
    );
    const tasksPending = checklistQ.data?.count ?? 0;

    const dateLabel = new Intl.DateTimeFormat(
        locale === "tl" ? "fil-PH" : "en-US",
        { month: "long", day: "numeric", year: "numeric" },
    ).format(new Date());

    return (
        <GradientBackground>
            <ScrollView
                contentContainerStyle={{
                    paddingBottom: spacing.xxxl,
                    gap: spacing.md,
                }}
                style={{ flex: 1 }}
            >
                {/* Header */}
                <View
                    style={{
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "space-between",
                        paddingHorizontal: spacing.md,
                        paddingTop: spacing.xs,
                    }}
                >
                    <View style={{ flex: 1 }}>
                        <Text size="sm" tone="muted">
                            {greeting}
                        </Text>
                        <Text size="xxl" weight="bold">
                            {farmName}
                        </Text>
                    </View>
                    <View style={{ flexDirection: "row", gap: spacing.xs }}>
                        <Link href="/checklist" asChild>
                            <Pressable
                                accessibilityLabel="Notifications"
                                accessibilityRole="button"
                                style={{
                                    width: 44,
                                    height: 44,
                                    borderRadius: radii.md,
                                    backgroundColor: colors.glass,
                                    alignItems: "center",
                                    justifyContent: "center",
                                }}
                            >
                                <Ionicons
                                    name="notifications-outline"
                                    size={20}
                                    color={colors.text}
                                />
                                {tasksPending + lowStock.length > 0 ? (
                                    <View
                                        style={{
                                            position: "absolute",
                                            top: 8,
                                            right: 10,
                                            width: 8,
                                            height: 8,
                                            borderRadius: 4,
                                            backgroundColor: colors.error,
                                        }}
                                    />
                                ) : null}
                            </Pressable>
                        </Link>
                        <Link href="/settings" asChild>
                            <Pressable
                                accessibilityLabel="Profile"
                                accessibilityRole="button"
                                style={{
                                    width: 44,
                                    height: 44,
                                    borderRadius: radii.md,
                                    backgroundColor: colors.primaryDark,
                                    alignItems: "center",
                                    justifyContent: "center",
                                }}
                            >
                                <Text weight="bold">
                                    {firstName.charAt(0).toUpperCase()}
                                </Text>
                            </Pressable>
                        </Link>
                    </View>
                </View>

                {/* Daily Check-in */}
                <View style={{ paddingHorizontal: spacing.md }}>
                    <Card>
                        <View
                            style={{
                                flexDirection: "row",
                                gap: spacing.sm,
                                alignItems: "center",
                            }}
                        >
                            <View
                                style={{
                                    width: 64,
                                    height: 64,
                                    borderRadius: radii.lg,
                                    backgroundColor: colors.successLight,
                                    alignItems: "center",
                                    justifyContent: "center",
                                }}
                            >
                                <Ionicons
                                    name="leaf"
                                    size={32}
                                    color={colors.primaryLight}
                                />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text weight="bold" size="md">
                                    {`"${t("home.checkin_quote")}"`}
                                </Text>
                                <Text size="sm" tone="muted">
                                    {t("home.checkin_summary", {
                                        tasks: String(tasksPending),
                                        harvests: String(harvestReady.length),
                                        low: String(lowStock.length),
                                    })}
                                </Text>
                            </View>
                        </View>
                    </Card>
                </View>

                {/* Today's Tasks */}
                <View style={{ paddingHorizontal: spacing.md }}>
                    <Card>
                        <View
                            style={{
                                flexDirection: "row",
                                alignItems: "center",
                                justifyContent: "space-between",
                            }}
                        >
                            <View style={{ flex: 1 }}>
                                <Text weight="bold" size="lg">
                                    {t("home.todays_tasks")}
                                </Text>
                                <Text size="sm" tone="muted">
                                    {dateLabel}
                                </Text>
                            </View>
                            <ProgressRing
                                size={64}
                                strokeWidth={6}
                                progress={TASKS_PROGRESS_MOCK}
                                color={colors.primaryLight}
                                accessibilityLabel="Today's tasks completion"
                            >
                                <Text size="sm" weight="bold">
                                    {`${Math.round(TASKS_PROGRESS_MOCK * 100)}%`}
                                </Text>
                            </ProgressRing>
                        </View>
                        <View
                            style={{
                                height: 6,
                                borderRadius: radii.full,
                                backgroundColor: colors.glass,
                                marginTop: spacing.sm,
                                overflow: "hidden",
                            }}
                        >
                            <View
                                style={{
                                    width: `${Math.round(TASKS_PROGRESS_MOCK * 100)}%`,
                                    height: "100%",
                                    backgroundColor: colors.primaryLight,
                                }}
                            />
                        </View>
                        <Text
                            size="sm"
                            tone="muted"
                            style={{ marginTop: spacing.xs }}
                        >
                            {t("home.tasks_done_count", {
                                done: String(TASKS_DONE_MOCK),
                                total: String(TASKS_TOTAL_MOCK),
                            })}
                        </Text>
                    </Card>
                </View>

                {/* KPI Grid 2x2 */}
                <View
                    style={{
                        flexDirection: "row",
                        flexWrap: "wrap",
                        gap: spacing.sm,
                        paddingHorizontal: spacing.md,
                    }}
                >
                    <KpiTile
                        icon="grid"
                        iconBg={colors.successLight}
                        iconColor={colors.primaryLight}
                        value={setupsQ.data?.count ?? 0}
                        label={t("home.kpi_active_setups")}
                    />
                    <KpiTile
                        icon="leaf"
                        iconBg={colors.infoLight}
                        iconColor={colors.info}
                        value={batchesQ.data?.count ?? 0}
                        label={t("home.kpi_plant_batches")}
                    />
                    <KpiTile
                        icon="nutrition"
                        iconBg={colors.successLight}
                        iconColor={colors.primaryLight}
                        value={harvestReady.length}
                        label={t("home.kpi_near_harvest")}
                    />
                    <KpiTile
                        icon="alert-circle"
                        iconBg={colors.errorLight}
                        iconColor={colors.error}
                        value={lowStock.length}
                        label={t("home.kpi_low_stock")}
                    />
                </View>
            </ScrollView>
        </GradientBackground>
    );
}

function KpiTile({
    icon,
    iconBg,
    iconColor,
    value,
    label,
}: {
    icon: React.ComponentProps<typeof Ionicons>["name"];
    iconBg: string;
    iconColor: string;
    value: number | string;
    label: string;
}) {
    return (
        <View
            style={{
                flex: 1,
                minWidth: "47%",
                padding: spacing.md,
                borderRadius: radii.lg,
                backgroundColor: colors.surfaceVariant,
                borderWidth: 1,
                borderColor: colors.border,
                gap: spacing.sm,
            }}
        >
            <View
                style={{
                    width: 36,
                    height: 36,
                    borderRadius: radii.md,
                    backgroundColor: iconBg,
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                <Ionicons name={icon} size={18} color={iconColor} />
            </View>
            <Text size="xxxl" weight="bold">
                {value}
            </Text>
            <Text size="sm" tone="muted">
                {label}
            </Text>
        </View>
    );
}
```

Notes:
- `useT()` returns `{ t, locale }`. The existing `t()` helper at `mobile/src/lib/i18n.ts:293` natively interpolates `{var}` placeholders via the second `params` argument. Use `t("home.checkin_summary", { tasks, harvests, low })` directly — no helper needed.

- [ ] **Step 2: Typecheck**

```bash
bun --cwd mobile typecheck
```

Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add mobile/src/app/(app)/index.tsx
git commit -m "feat(home): rewrite header, check-in, tasks ring, KPI grid"
```

---

## Task 5: Add alerts, upcoming harvests, recent activity, quick actions

**Files:**
- Modify: `mobile/src/app/(app)/index.tsx`

This task adds the bottom four sections. The existing `ScrollView` from Task 4 is reused; new sections are appended before its closing tag.

- [ ] **Step 1: Add new imports at the top of `index.tsx`**

Update the import block to add `AlertCard` and `AlertSeverity`:

```tsx
import { AlertCard, type AlertSeverity } from "@/components/ui/alert-card";
```

- [ ] **Step 2: Add helper data + types above `HomeScreen`**

Insert after `TASKS_TOTAL_MOCK = 12;`:

```tsx
const ASSUMED_DAYS_TO_HARVEST = 30;

interface ActivityItem {
    id: string;
    icon: React.ComponentProps<typeof Ionicons>["name"];
    iconBg: string;
    iconColor: string;
    title: string;
    timeAgo: string;
}

const ACTIVITY_MOCK: ActivityItem[] = [
    {
        id: "a1",
        icon: "checkmark-circle",
        iconBg: colors.successLight,
        iconColor: colors.primaryLight,
        title: "pH/EC logged for DFT-A",
        timeAgo: "2h ago",
    },
    {
        id: "a2",
        icon: "leaf",
        iconBg: colors.infoLight,
        iconColor: colors.info,
        title: "Pechay Batch A-001 → Vegetative",
        timeAgo: "5h ago",
    },
    {
        id: "a3",
        icon: "cube",
        iconBg: colors.warningLight,
        iconColor: colors.warning,
        title: "Rockwool cubes restocked (50 pcs)",
        timeAgo: "1d ago",
    },
    {
        id: "a4",
        icon: "trending-up",
        iconBg: "rgba(206, 147, 216, 0.15)",
        iconColor: "#CE93D8",
        title: "Sale recorded — ₱480 Pechay",
        timeAgo: "2d ago",
    },
];

interface HomeAlert {
    id: string;
    severity: AlertSeverity;
    icon: React.ComponentProps<typeof Ionicons>["name"];
    title: string;
    subtitle: string;
    pillLabel?: string;
    chevron?: boolean;
}
```

- [ ] **Step 3: Build alert + harvest derivations inside `HomeScreen`**

Just before the `return (`, add:

```tsx
const alerts: HomeAlert[] = [];
// Mock pH out-of-range alert until readings API surfaces here
alerts.push({
    id: "ph-mock",
    severity: "urgent",
    icon: "warning",
    title: "DFT-A pH Out of Range",
    subtitle: "Current: 7.2 — Target: 5.5–6.5",
    pillLabel: t("home.alert_severity_urgent"),
});
const firstLow = lowStock[0];
if (firstLow) {
    alerts.push({
        id: `low-${firstLow.id}`,
        severity: "low",
        icon: "cube",
        title: `${firstLow.name} Running Low`,
        subtitle: `${firstLow.current_stock} ${firstLow.unit} remaining — min: ${firstLow.min_stock ?? "?"}`,
        pillLabel: t("home.alert_severity_low"),
    });
}
const firstReady = harvestReady[0];
if (firstReady) {
    const days = Math.floor(
        (Date.now() - new Date(firstReady.started_at).getTime()) / 86400000,
    );
    alerts.push({
        id: `ready-${firstReady.id}`,
        severity: "info",
        icon: "time",
        title: `${firstReady.variety_name} Batch Ready to Check`,
        subtitle: `Day ${days} — Harvest window: Day 25–35`,
        chevron: true,
    });
}

const upcomingHarvests = (batchesQ.data?.data ?? [])
    .map((b) => {
        const days = Math.floor(
            (Date.now() - new Date(b.started_at).getTime()) / 86400000,
        );
        const daysLeft = Math.max(0, ASSUMED_DAYS_TO_HARVEST - days);
        return { batch: b, daysLeft };
    })
    .sort((a, b) => a.daysLeft - b.daysLeft)
    .slice(0, 3);
```

Note: `inventoryApi` items expose a `min_stock` field — confirm the property name when reading the `Inventory` interface in `mobile/src/lib/hydro-api.ts`. If the field is named differently (e.g. `reorder_point`, `min_quantity`), adjust the subtitle string to use the correct field. If no minimum is exposed at all, drop the ` — min: …` suffix.

- [ ] **Step 4: Append the four new sections before the `ScrollView` closing tag**

After the closing `</View>` of the KPI grid (the last existing block) and before `</ScrollView>`, add:

```tsx
                {/* Alerts */}
                {alerts.length > 0 ? (
                    <View
                        style={{
                            paddingHorizontal: spacing.md,
                            gap: spacing.sm,
                        }}
                    >
                        <Text size="lg" weight="bold">
                            {t("home.alerts")}
                        </Text>
                        {alerts.map((a) => (
                            <AlertCard
                                key={a.id}
                                severity={a.severity}
                                icon={a.icon}
                                title={a.title}
                                subtitle={a.subtitle}
                                pillLabel={a.pillLabel}
                                chevron={a.chevron}
                            />
                        ))}
                    </View>
                ) : null}

                {/* Upcoming Harvests */}
                {upcomingHarvests.length > 0 ? (
                    <View style={{ gap: spacing.sm }}>
                        <View
                            style={{
                                flexDirection: "row",
                                alignItems: "center",
                                justifyContent: "space-between",
                                paddingHorizontal: spacing.md,
                            }}
                        >
                            <Text size="lg" weight="bold">
                                {t("home.upcoming_harvests")}
                            </Text>
                            <Link href="/setups" asChild>
                                <Pressable accessibilityRole="link">
                                    <Text size="sm" tone="primary">
                                        {t("home.see_all")}
                                    </Text>
                                </Pressable>
                            </Link>
                        </View>
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={{
                                paddingHorizontal: spacing.md,
                                gap: spacing.sm,
                            }}
                        >
                            {upcomingHarvests.map(({ batch, daysLeft }) => {
                                const urgent = daysLeft < 7;
                                return (
                                    <View
                                        key={batch.id}
                                        style={{
                                            width: 140,
                                            padding: spacing.sm,
                                            borderRadius: radii.lg,
                                            backgroundColor:
                                                colors.surfaceVariant,
                                            borderWidth: 1,
                                            borderColor: colors.border,
                                            alignItems: "center",
                                            gap: spacing.xs,
                                        }}
                                    >
                                        <View
                                            style={{
                                                width: 44,
                                                height: 44,
                                                borderRadius: radii.md,
                                                backgroundColor:
                                                    colors.successLight,
                                                alignItems: "center",
                                                justifyContent: "center",
                                            }}
                                        >
                                            <Ionicons
                                                name="leaf"
                                                size={22}
                                                color={colors.primaryLight}
                                            />
                                        </View>
                                        <Text weight="bold">
                                            {batch.variety_name}
                                        </Text>
                                        <Text size="xs" tone="muted">
                                            {`${batch.initial_count} plants`}
                                        </Text>
                                        <View
                                            style={{
                                                paddingHorizontal: spacing.sm,
                                                paddingVertical: 4,
                                                borderRadius: radii.full,
                                                backgroundColor: urgent
                                                    ? colors.errorLight
                                                    : colors.successLight,
                                            }}
                                        >
                                            <Text
                                                size="xs"
                                                weight="bold"
                                                style={{
                                                    color: urgent
                                                        ? colors.error
                                                        : colors.primaryLight,
                                                }}
                                            >
                                                {t("home.days_left", {
                                                    n: String(daysLeft),
                                                })}
                                            </Text>
                                        </View>
                                    </View>
                                );
                            })}
                        </ScrollView>
                    </View>
                ) : null}

                {/* Recent Activity */}
                <View
                    style={{
                        paddingHorizontal: spacing.md,
                        gap: spacing.sm,
                    }}
                >
                    <Text size="lg" weight="bold">
                        {t("home.recent_activity")}
                    </Text>
                    <Card>
                        {ACTIVITY_MOCK.map((a, idx) => (
                            <View
                                key={a.id}
                                style={{
                                    flexDirection: "row",
                                    alignItems: "center",
                                    gap: spacing.sm,
                                    paddingVertical: spacing.sm,
                                    borderBottomWidth:
                                        idx === ACTIVITY_MOCK.length - 1 ? 0 : 1,
                                    borderBottomColor: colors.borderLight,
                                }}
                            >
                                <View
                                    style={{
                                        width: 36,
                                        height: 36,
                                        borderRadius: radii.md,
                                        backgroundColor: a.iconBg,
                                        alignItems: "center",
                                        justifyContent: "center",
                                    }}
                                >
                                    <Ionicons
                                        name={a.icon}
                                        size={18}
                                        color={a.iconColor}
                                    />
                                </View>
                                <Text style={{ flex: 1 }}>{a.title}</Text>
                                <Text size="xs" tone="muted">
                                    {a.timeAgo}
                                </Text>
                            </View>
                        ))}
                    </Card>
                </View>

                {/* Quick Actions */}
                <View
                    style={{
                        paddingHorizontal: spacing.md,
                        gap: spacing.sm,
                    }}
                >
                    <Text size="lg" weight="bold">
                        {t("home.quick_actions")}
                    </Text>
                    <View
                        style={{
                            flexDirection: "row",
                            flexWrap: "wrap",
                            gap: spacing.sm,
                        }}
                    >
                        <QuickActionTile
                            icon="add"
                            iconBg={colors.successLight}
                            iconColor={colors.primaryLight}
                            label={t("home.qa_new_batch")}
                            href="/batch/new"
                        />
                        <QuickActionTile
                            icon="water"
                            iconBg={colors.infoLight}
                            iconColor={colors.info}
                            label={t("home.qa_log_reading")}
                            href="/checklist"
                        />
                        <QuickActionTile
                            icon="book"
                            iconBg={colors.warningLight}
                            iconColor={colors.warning}
                            label={t("home.qa_crop_guide")}
                            href="/library/crops"
                        />
                        <QuickActionTile
                            icon="trending-up"
                            iconBg="rgba(206, 147, 216, 0.15)"
                            iconColor="#CE93D8"
                            label={t("home.qa_add_sale")}
                            href="/sale-new"
                        />
                        <QuickActionTile
                            icon="cube"
                            iconBg="rgba(128, 222, 234, 0.15)"
                            iconColor="#80DEEA"
                            label={t("home.qa_restock")}
                            href="/inventory-new"
                        />
                        <QuickActionTile
                            icon="flash"
                            iconBg={colors.successLight}
                            iconColor={colors.primaryLight}
                            label={t("home.qa_tasks")}
                            href="/checklist"
                        />
                    </View>
                </View>
```

- [ ] **Step 5: Add `QuickActionTile` sub-component at the bottom of the file**

Append after the `KpiTile` definition:

```tsx
function QuickActionTile({
    icon,
    iconBg,
    iconColor,
    label,
    href,
}: {
    icon: React.ComponentProps<typeof Ionicons>["name"];
    iconBg: string;
    iconColor: string;
    label: string;
    href: string;
}) {
    return (
        <Link href={href as never} asChild>
            <Pressable
                accessibilityRole="button"
                style={({ pressed }) => ({
                    flex: 1,
                    minWidth: "30%",
                    padding: spacing.md,
                    borderRadius: radii.lg,
                    backgroundColor: pressed
                        ? colors.glassHover
                        : colors.surfaceVariant,
                    borderWidth: 1,
                    borderColor: colors.border,
                    gap: spacing.xs,
                    alignItems: "center",
                })}
            >
                <View
                    style={{
                        width: 36,
                        height: 36,
                        borderRadius: radii.md,
                        backgroundColor: iconBg,
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                >
                    <Ionicons name={icon} size={18} color={iconColor} />
                </View>
                <Text weight="semibold" size="sm">
                    {label}
                </Text>
            </Pressable>
        </Link>
    );
}
```

- [ ] **Step 6: Typecheck**

```bash
bun --cwd mobile typecheck
```

Expected: PASS. If TypeScript complains about `Link href={href as never}`, that pattern is already used elsewhere in this file historically — keep it. If it errors, change the prop type to the `Href` type from `expo-router` and import accordingly.

- [ ] **Step 7: Lint**

```bash
bun --cwd mobile lint
```

Expected: clean (Biome formats automatically with `--write --unsafe`).

- [ ] **Step 8: Commit**

```bash
git add mobile/src/app/(app)/index.tsx
git commit -m "feat(home): add alerts, upcoming harvests, activity, quick actions"
```

---

## Task 6: Manual smoke test

**Files:** none modified.

This task verifies the redesign on a real (or simulated) device since there are no automated UI tests.

- [ ] **Step 1: Start the dev server**

```bash
bun --cwd mobile start
```

Open in iOS simulator (press `i`) or scan with Expo Go.

- [ ] **Step 2: Verify visual layout (en)**

With `en` locale (default):

- Header shows time-based English greeting + `{Name}'s Farm` + bell + avatar.
- Daily check-in card shows quote and summary line with non-zero counts (or zeros if account is empty — that's still acceptable).
- Today's Tasks card shows progress ring at 67%, today's date, progress bar, "8 of 12 tasks completed today".
- KPI grid shows four tiles in 2×2 with correct counts.
- Alerts section shows the mocked pH urgent alert plus any low-stock or harvest-ready entries (or just pH if none).
- Upcoming Harvests row scrolls horizontally showing batch tiles (if any batches exist).
- Recent Activity shows the four mock rows.
- Quick Actions shows 6 tiles in 3 columns × 2 rows.
- All quick action tiles navigate to a real route on tap (no expo-router 404).
- Bell icon navigates to `/checklist`.
- Avatar navigates to `/settings`.

- [ ] **Step 3: Verify visual layout (tl)**

In Settings, switch the language to Tagalog. Return to Home. Confirm:
- Greeting becomes `Magandang umaga/hapon/gabi! 🇵🇭` matching the time of day.
- Quote becomes `"Kumusta ang farm mo ngayon! 👋"`.
- All section headers, KPI labels, alert pill labels, and quick action labels render in Tagalog.
- No empty `{var}` placeholder strings appear.

- [ ] **Step 4: Verify accessibility**

- Bell and avatar buttons have screen-reader labels (use VoiceOver / TalkBack to confirm).
- ProgressRing announces as "67 percent, progress bar" or equivalent.
- All touch targets feel ≥44pt under finger.

- [ ] **Step 5: Verify reduced motion + Dynamic Type**

- iOS: Settings → Accessibility → Display & Text Size → Larger Text. Increase to max. Confirm no truncation breaks the layout.
- iOS: Settings → Accessibility → Motion → Reduce Motion. Reload app. Confirm nothing animates inappropriately (there should be nothing to gate, but verify anyway).

- [ ] **Step 6: Final commit (only if any fixes were needed)**

If any issues surfaced and were fixed:

```bash
git add -A
git commit -m "fix(home): manual smoke fixes"
```

If no fixes were needed, skip this step. Do not create an empty commit.

---

## Acceptance Criteria

- [ ] Home screen visually matches the three reference screenshots within reasonable component-library fidelity.
- [ ] All copy ships in both `en` and `tl`.
- [ ] Greeting copy varies by time of day.
- [ ] All quick actions navigate to a real route (no dead taps).
- [ ] Alerts section is hidden when there are zero alerts.
- [ ] No regressions in tab navigation or other tabs.
- [ ] `bun --cwd mobile typecheck` passes.
- [ ] `bun --cwd mobile lint` passes.

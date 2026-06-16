import { Redirect, Tabs, usePathname, useRouter } from "expo-router";
import {
	DollarSign,
	Grid3x3,
	Home,
	Menu,
	Package,
	Sprout,
} from "lucide-react-native";
import { useEffect, useState } from "react";
import { View } from "react-native";
import {
	InteractiveMenu,
	type InteractiveMenuItem,
} from "@/components/ui/interactive-menu";
import { MoreSheet, type MoreSheetLink } from "@/components/ui/more-sheet";
import { useThemeColors } from "@/constants/theme";
import { useAuthStore } from "@/stores/auth-store";
import { useNavHistoryStore } from "@/stores/nav-history-store";

const HIDDEN_TAB = {
	href: null,
	tabBarItemStyle: { display: "none" as const },
} as const;

const TAB_ITEMS: InteractiveMenuItem[] = [
	{ key: "index", label: "Home", icon: Home },
	{ key: "setups", label: "Setups", icon: Grid3x3 },
	{ key: "seeds", label: "Seeds", icon: Sprout },
	{ key: "inventory", label: "Inventory", icon: Package },
	{ key: "sales", label: "Sales", icon: DollarSign },
	{ key: "more", label: "More", icon: Menu },
];

// Tab routes that live "under" More. The bar stays visible on these and the
// More item shows as active. `library` is a nested stack, so all its
// sub-screens (crops, guides, pests) inherit this too.
const MORE_ROUTES = new Set(["tasks", "library", "settings"]);

const MORE_LINKS: MoreSheetLink[] = [
	{
		href: "/tasks",
		icon: "checkbox-outline",
		title: "Tasks",
		subtitle: "Daily to-dos, reminders & recurring chores",
	},
	{
		href: "/library",
		icon: "library-outline",
		title: "Library",
		subtitle: "Crop guides, grow guides & pest references",
	},
	{
		href: "/settings",
		icon: "settings-outline",
		title: "Settings",
		subtitle: "Account, preferences & app options",
	},
];

export default function AppLayout() {
	const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
	const pathname = usePathname();
	const router = useRouter();
	const pushHistory = useNavHistoryStore((s) => s.push);
	const colors = useThemeColors();
	const [moreOpen, setMoreOpen] = useState(false);

	useEffect(() => {
		if (pathname) pushHistory(pathname);
	}, [pathname, pushHistory]);

	if (!isAuthenticated) return <Redirect href="/login" />;

	const activeMoreHref =
		MORE_LINKS.find(
			(l) => pathname === l.href || pathname?.startsWith(`${l.href}/`),
		)?.href ?? null;

	return (
		<View style={{ flex: 1, backgroundColor: colors.bg }}>
			<Tabs
				screenOptions={{
					headerShown: false,
					sceneStyle: { backgroundColor: colors.bg },
				}}
				tabBar={(props) => {
					const activeRoute = props.state.routes[props.state.index];
					const activeKey = activeRoute?.name ?? TAB_ITEMS[0].key;
					const visibleKeys = new Set(TAB_ITEMS.map((i) => i.key));
					// Keep the bar (with More highlighted) on More-group screens;
					// hide it on other drill-down pages that have their own back nav.
					const isMoreRoute = MORE_ROUTES.has(activeKey);
					if (!visibleKeys.has(activeKey) && !isMoreRoute) return null;
					const effectiveKey = isMoreRoute ? "more" : activeKey;
					return (
						<InteractiveMenu
							items={TAB_ITEMS}
							activeKey={effectiveKey}
							onSelect={(key) => {
								if (key === "more") {
									setMoreOpen((v) => !v);
									return;
								}
								setMoreOpen(false);
								const target = props.state.routes.find((r) => r.name === key);
								if (!target) return;
								const event = props.navigation.emit({
									type: "tabPress",
									target: target.key,
									canPreventDefault: true,
								});
								if (!event.defaultPrevented) {
									props.navigation.navigate(target.name);
								}
							}}
						/>
					);
				}}
			>
				<Tabs.Screen name="index" options={{ title: "Home" }} />
				<Tabs.Screen name="setups" options={{ title: "Setups" }} />
				<Tabs.Screen name="seeds" options={{ title: "Seeds" }} />
				<Tabs.Screen name="checklist" options={HIDDEN_TAB} />
				<Tabs.Screen name="inventory" options={{ title: "Inventory" }} />
				<Tabs.Screen name="sales" options={{ title: "Sales" }} />
				<Tabs.Screen name="library" options={HIDDEN_TAB} />
				<Tabs.Screen name="settings" options={HIDDEN_TAB} />
				<Tabs.Screen name="tasks" options={HIDDEN_TAB} />
				<Tabs.Screen name="tasks/new" options={HIDDEN_TAB} />
				<Tabs.Screen name="tasks/[id]" options={HIDDEN_TAB} />
				<Tabs.Screen name="inventory-new" options={HIDDEN_TAB} />
				<Tabs.Screen name="inventory/[id]" options={HIDDEN_TAB} />
				<Tabs.Screen name="produce-new" options={HIDDEN_TAB} />
				<Tabs.Screen name="produce/[id]" options={HIDDEN_TAB} />
				<Tabs.Screen name="sale-new" options={HIDDEN_TAB} />
				<Tabs.Screen name="setup" options={HIDDEN_TAB} />
				<Tabs.Screen name="batch" options={HIDDEN_TAB} />
				<Tabs.Screen name="seeds/new" options={HIDDEN_TAB} />
			</Tabs>
			<MoreSheet
				open={moreOpen}
				links={MORE_LINKS}
				activeHref={activeMoreHref}
				onClose={() => setMoreOpen(false)}
				onSelect={(href) => {
					setMoreOpen(false);
					router.push(href as never);
				}}
			/>
		</View>
	);
}

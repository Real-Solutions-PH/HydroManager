import { Redirect, Tabs, usePathname } from "expo-router";
import {
	BookOpen,
	CheckSquare,
	DollarSign,
	Grid3x3,
	Home,
	Package,
} from "lucide-react-native";
import { useEffect } from "react";
import { View } from "react-native";
import { AIChatFab } from "@/components/ai-chat";
import { OfflineBanner } from "@/components/offline-banner";
import {
	InteractiveMenu,
	type InteractiveMenuItem,
} from "@/components/ui/interactive-menu";
import { colors } from "@/constants/theme";
import { useAuthStore } from "@/stores/auth-store";
import { useNavHistoryStore } from "@/stores/nav-history-store";

const HIDDEN_TAB = {
	href: null,
	tabBarItemStyle: { display: "none" as const },
} as const;

const TAB_ITEMS: InteractiveMenuItem[] = [
	{ key: "index", label: "Home", icon: Home },
	{ key: "setups", label: "Setups", icon: Grid3x3 },
	{ key: "checklist", label: "Tasks", icon: CheckSquare },
	{ key: "inventory", label: "Inventory", icon: Package },
	{ key: "sales", label: "Sales", icon: DollarSign },
	{ key: "library", label: "Library", icon: BookOpen },
];

export default function AppLayout() {
	const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
	const pathname = usePathname();
	const pushNav = useNavHistoryStore((s) => s.push);

	useEffect(() => {
		if (pathname) pushNav(pathname);
	}, [pathname, pushNav]);

	if (!isAuthenticated) return <Redirect href="/login" />;

	return (
		<View className="flex-1" style={{ backgroundColor: colors.bg }}>
			<OfflineBanner />
			<Tabs
				screenOptions={{
					headerShown: false,
					sceneStyle: { backgroundColor: colors.bg },
				}}
				tabBar={(props) => {
					const activeRoute = props.state.routes[props.state.index];
					const activeKey = activeRoute?.name ?? TAB_ITEMS[0].key;
					const visibleKeys = new Set(TAB_ITEMS.map((i) => i.key));
					if (!visibleKeys.has(activeKey)) return null;
					return (
						<InteractiveMenu
							items={TAB_ITEMS}
							activeKey={activeKey}
							onSelect={(key) => {
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
				<Tabs.Screen name="checklist" options={{ title: "Tasks" }} />
				<Tabs.Screen name="inventory" options={{ title: "Inventory" }} />
				<Tabs.Screen name="sales" options={{ title: "Sales" }} />
				<Tabs.Screen name="library" options={{ title: "Library" }} />
				<Tabs.Screen name="settings" options={HIDDEN_TAB} />
				<Tabs.Screen name="inventory-new" options={HIDDEN_TAB} />
				<Tabs.Screen name="inventory/[id]" options={HIDDEN_TAB} />
				<Tabs.Screen name="produce-new" options={HIDDEN_TAB} />
				<Tabs.Screen name="produce/[id]" options={HIDDEN_TAB} />
				<Tabs.Screen name="sale-new" options={HIDDEN_TAB} />
				<Tabs.Screen name="setup" options={HIDDEN_TAB} />
				<Tabs.Screen name="batch" options={HIDDEN_TAB} />
			</Tabs>
			<AIChatFab />
		</View>
	);
}

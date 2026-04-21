import { Ionicons } from "@expo/vector-icons";
import { Redirect, Tabs } from "expo-router";
import { View } from "react-native";
import { AIChatFab } from "@/components/ai-chat";
import { OfflineBanner } from "@/components/offline-banner";
import { colors } from "@/constants/theme";
import { useAuthStore } from "@/stores/auth-store";

type IoniconName = React.ComponentProps<typeof Ionicons>["name"];

function tabIcon(name: IoniconName, focused: boolean, color: string) {
	const resolved: IoniconName = focused
		? name
		: (`${name}-outline` as IoniconName);
	return <Ionicons name={resolved} size={22} color={color} />;
}

const HIDDEN_TAB = {
	href: null,
	tabBarItemStyle: { display: "none" as const },
	tabBarButton: () => null,
} as const;

export default function AppLayout() {
	const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

	if (!isAuthenticated) return <Redirect href="/login" />;

	return (
		<View className="flex-1" style={{ backgroundColor: colors.bg }}>
			<OfflineBanner />
			<Tabs
				screenOptions={{
					headerShown: false,
					tabBarStyle: {
						backgroundColor: colors.tabBarBg,
						borderTopColor: colors.tabBarTopBorder,
						borderTopWidth: 1,
						height: 65,
						paddingTop: 6,
						paddingBottom: 10,
					},
					tabBarActiveTintColor: colors.text,
					tabBarInactiveTintColor: colors.textMuted,
					tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
					sceneStyle: { backgroundColor: colors.bg },
				}}
			>
				<Tabs.Screen
					name="index"
					options={{
						title: "Home",
						tabBarIcon: ({ focused, color }) => tabIcon("home", focused, color),
					}}
				/>
				<Tabs.Screen
					name="setups"
					options={{
						title: "Setups",
						tabBarIcon: ({ focused, color }) => tabIcon("grid", focused, color),
					}}
				/>
				<Tabs.Screen
					name="checklist"
					options={{
						title: "Tasks",
						tabBarIcon: ({ focused, color }) =>
							tabIcon("checkbox", focused, color),
					}}
				/>
				<Tabs.Screen
					name="inventory"
					options={{
						title: "Inventory",
						tabBarIcon: ({ focused, color }) => tabIcon("cube", focused, color),
					}}
				/>
				<Tabs.Screen
					name="sales"
					options={{
						title: "Sales",
						tabBarIcon: ({ focused, color }) => tabIcon("cash", focused, color),
					}}
				/>
				<Tabs.Screen name="crops" options={HIDDEN_TAB} />
				<Tabs.Screen name="settings" options={HIDDEN_TAB} />
				<Tabs.Screen name="inventory-new" options={HIDDEN_TAB} />
				<Tabs.Screen name="sale-new" options={HIDDEN_TAB} />
				<Tabs.Screen name="setup" options={HIDDEN_TAB} />
				<Tabs.Screen name="batch" options={HIDDEN_TAB} />
			</Tabs>
			<AIChatFab />
		</View>
	);
}

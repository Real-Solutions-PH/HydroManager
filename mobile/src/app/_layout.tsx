import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Providers } from "@/components/providers";
import { useEffectiveTheme } from "@/constants/theme";

function ThemedStatusBar() {
	const theme = useEffectiveTheme();
	return <StatusBar style={theme === "light" ? "dark" : "light"} translucent />;
}

export default function RootLayout() {
	return (
		<Providers>
			<ThemedStatusBar />
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

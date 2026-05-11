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

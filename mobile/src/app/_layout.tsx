import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Fragment } from "react";
import { Providers } from "@/components/providers";
import { useEffectiveTheme } from "@/constants/theme";

function ThemedStatusBar() {
	const theme = useEffectiveTheme();
	return <StatusBar style={theme === "light" ? "dark" : "light"} translucent />;
}

/**
 * Keys the children on the effective theme so the entire tree remounts when
 * the user toggles light/dark. This lets non-hook `import { colors }` sites
 * pick up the new palette through the live Proxy in constants/theme.
 */
function ThemeRoot({ children }: { children: React.ReactNode }) {
	const theme = useEffectiveTheme();
	return <Fragment key={theme}>{children}</Fragment>;
}

export default function RootLayout() {
	return (
		<Providers>
			<ThemedStatusBar />
			<ThemeRoot>
				<Stack screenOptions={{ headerShown: false }}>
					<Stack.Screen name="(app)" />
					<Stack.Screen name="login" />
					<Stack.Screen name="signup" />
					<Stack.Screen name="recover-password" />
					<Stack.Screen name="reset-password" />
				</Stack>
			</ThemeRoot>
		</Providers>
	);
}

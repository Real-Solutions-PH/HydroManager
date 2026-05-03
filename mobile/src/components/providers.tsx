import AsyncStorage from "@react-native-async-storage/async-storage";
import { PortalHost } from "@rn-primitives/portal";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import { QueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import type { ReactNode } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Toaster } from "sonner-native";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { initializeDatabase } from "@/lib/database";

initializeDatabase();

const ONE_DAY = 1000 * 60 * 60 * 24;

export const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			retry: 1,
			staleTime: 1000 * 60 * 5,
			gcTime: ONE_DAY,
			networkMode: "always",
		},
		mutations: {
			networkMode: "always",
		},
	},
});

const persister = createAsyncStoragePersister({
	storage: AsyncStorage,
	key: "hydroguide-rq-cache",
	throttleTime: 1000,
});

interface ProvidersProps {
	children: ReactNode;
}

function AppInitializer() {
	useNetworkStatus();
	return null;
}

export function Providers({ children }: ProvidersProps) {
	return (
		<GestureHandlerRootView style={{ flex: 1 }}>
			<SafeAreaProvider>
				<PersistQueryClientProvider
					client={queryClient}
					persistOptions={{
						persister,
						maxAge: ONE_DAY,
						buster: "v3",
					}}
				>
					<AppInitializer />
					{children}
					<PortalHost />
					<Toaster />
				</PersistQueryClientProvider>
			</SafeAreaProvider>
		</GestureHandlerRootView>
	);
}

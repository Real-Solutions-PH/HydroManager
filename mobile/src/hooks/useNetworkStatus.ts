import NetInfo from "@react-native-community/netinfo";
import { useEffect } from "react";
import { useNetworkStore } from "@/stores/network-store";

export function useNetworkStatus() {
	const setNetworkState = useNetworkStore((s) => s.setNetworkState);

	useEffect(() => {
		const unsubscribe = NetInfo.addEventListener((state) => {
			const isConnected = state.isConnected ?? false;
			const type =
				state.type === "wifi"
					? "wifi"
					: state.type === "cellular"
						? "cellular"
						: state.type === "none"
							? "none"
							: "unknown";
			setNetworkState(isConnected, type);
		});

		return () => unsubscribe();
	}, [setNetworkState]);
}

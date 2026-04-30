import { useRouter } from "expo-router";
import { useCallback } from "react";
import { useNavHistoryStore } from "@/stores/nav-history-store";

export function useBack(fallback: string = "/") {
	const router = useRouter();
	return useCallback(() => {
		const prev = useNavHistoryStore.getState().pop();
		if (prev) {
			router.replace(prev as never);
			return;
		}
		if (router.canGoBack()) {
			router.back();
			return;
		}
		router.replace(fallback as never);
	}, [router, fallback]);
}

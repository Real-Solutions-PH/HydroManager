import { useRouter, usePathname } from "expo-router";
import { useCallback } from "react";

function getParentRoute(pathname: string): string {
	const exact: Record<string, string> = {
		"/setup/new": "/setups",
		"/batch/new": "/seeds",
		"/inventory-new": "/inventory",
		"/produce-new": "/inventory",
		"/sale-new": "/sales",
		"/settings": "/",
		"/library": "/",
	};
	if (exact[pathname]) return exact[pathname];

	const setupEdit = pathname.match(/^\/setup\/([^/]+)\/edit$/);
	if (setupEdit) return `/setup/${setupEdit[1]}`;

	if (/^\/setup\/[^/]+$/.test(pathname)) return "/setups";
	if (/^\/batch\/[^/]+$/.test(pathname)) return "/seeds";
	if (/^\/inventory\/[^/]+$/.test(pathname)) return "/inventory";
	if (/^\/produce\/[^/]+$/.test(pathname)) return "/inventory";

	const libDetail = pathname.match(/^\/library\/([^/]+)\/[^/]+$/);
	if (libDetail) return `/library/${libDetail[1]}`;
	if (/^\/library\/[^/]+$/.test(pathname)) return "/library";

	return "/";
}

export function useBack(fallback?: string) {
	const router = useRouter();
	const pathname = usePathname();
	return useCallback(() => {
		const target = fallback ?? getParentRoute(pathname ?? "/");
		router.replace(target as never);
	}, [router, pathname, fallback]);
}

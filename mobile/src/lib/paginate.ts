import type { Paged } from "@/lib/hydro-api";

export const PAGE_SIZE = 20;

export function flattenPages<T>(
	data: { pages: Paged<T>[] } | undefined,
): T[] {
	return data?.pages.flatMap((p) => p.data) ?? [];
}

export function getNextSkip<T>(
	last: Paged<T>,
	pages: Paged<T>[],
): number | undefined {
	const loaded = pages.reduce((a, p) => a + p.data.length, 0);
	return loaded < last.count ? loaded : undefined;
}

import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import {
	type ClimateProviderName,
	climateApi,
	cropsApi,
	type GuideCategory,
	libraryApi,
	type PestKind,
} from "@/lib/hydro-api";
import { PAGE_SIZE } from "@/lib/paginate";

const STALE = 1000 * 60 * 30;

export function useCrops(
	query?: string,
	category?: "leafy" | "herb" | "fruiting" | "other",
) {
	return useInfiniteQuery({
		queryKey: ["library", "crops", query ?? "", category ?? ""],
		queryFn: ({ pageParam = 0 }) =>
			cropsApi.list(query || undefined, category, {
				skip: pageParam,
				limit: PAGE_SIZE,
			}),
		initialPageParam: 0,
		getNextPageParam: (last, pages) => {
			const loaded = pages.reduce((a, p) => a + p.data.length, 0);
			return loaded < last.count ? loaded : undefined;
		},
		staleTime: STALE,
	});
}

export function useCrop(id: string | undefined) {
	return useQuery({
		queryKey: ["library", "crops", "detail", id],
		queryFn: () => cropsApi.get(id as string),
		enabled: !!id,
		staleTime: STALE,
	});
}

export function useGuides(query?: string, category?: GuideCategory) {
	return useInfiniteQuery({
		queryKey: ["library", "guides", query ?? "", category ?? ""],
		queryFn: ({ pageParam = 0 }) =>
			libraryApi.guides.list(query || undefined, category, {
				skip: pageParam,
				limit: PAGE_SIZE,
			}),
		initialPageParam: 0,
		getNextPageParam: (last, pages) => {
			const loaded = pages.reduce((a, p) => a + p.data.length, 0);
			return loaded < last.count ? loaded : undefined;
		},
		staleTime: STALE,
	});
}

export function useGuide(id: string | undefined) {
	return useQuery({
		queryKey: ["library", "guides", "detail", id],
		queryFn: () => libraryApi.guides.get(id as string),
		enabled: !!id,
		staleTime: STALE,
	});
}

export function usePests(query?: string, kind?: PestKind) {
	return useInfiniteQuery({
		queryKey: ["library", "pests", query ?? "", kind ?? ""],
		queryFn: ({ pageParam = 0 }) =>
			libraryApi.pests.list(query || undefined, kind, {
				skip: pageParam,
				limit: PAGE_SIZE,
			}),
		initialPageParam: 0,
		getNextPageParam: (last, pages) => {
			const loaded = pages.reduce((a, p) => a + p.data.length, 0);
			return loaded < last.count ? loaded : undefined;
		},
		staleTime: STALE,
	});
}

export function usePest(id: string | undefined) {
	return useQuery({
		queryKey: ["library", "pests", "detail", id],
		queryFn: () => libraryApi.pests.get(id as string),
		enabled: !!id,
		staleTime: STALE,
	});
}

export function useCropStats() {
	return useQuery({
		queryKey: ["library", "crops", "stats"],
		queryFn: () => cropsApi.stats(),
		staleTime: 1000 * 60 * 5,
	});
}

export function useClimateNormals(args: {
	lat: number | null;
	lon: number | null;
	month: number | null;
	provider?: ClimateProviderName;
}) {
	const { lat, lon, month, provider } = args;
	return useQuery({
		queryKey: ["climate", "normals", lat, lon, month, provider ?? "open_meteo"],
		queryFn: () =>
			climateApi.normals({
				lat: lat as number,
				lon: lon as number,
				month: month as number,
				provider,
			}),
		enabled: lat != null && lon != null && month != null,
		staleTime: 1000 * 60 * 60 * 6,
	});
}

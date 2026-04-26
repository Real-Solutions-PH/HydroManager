import { useQuery } from "@tanstack/react-query";
import {
	cropsApi,
	type GuideCategory,
	libraryApi,
	type PestKind,
} from "@/lib/hydro-api";

const STALE = 1000 * 60 * 30;

export function useCrops(
	query?: string,
	category?: "leafy" | "herb" | "fruiting" | "other",
) {
	return useQuery({
		queryKey: ["library", "crops", query ?? "", category ?? ""],
		queryFn: () => cropsApi.list(query || undefined, category),
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
	return useQuery({
		queryKey: ["library", "guides", query ?? "", category ?? ""],
		queryFn: () => libraryApi.guides.list(query || undefined, category),
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
	return useQuery({
		queryKey: ["library", "pests", query ?? "", kind ?? ""],
		queryFn: () => libraryApi.pests.list(query || undefined, kind),
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

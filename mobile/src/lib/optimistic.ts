import type { QueryClient, QueryKey } from "@tanstack/react-query";

type EntityWithId = { id: string };

export function patchEntity<T extends EntityWithId>(
	old: unknown,
	id: string,
	patch: Partial<T> | ((entity: T) => T),
): unknown {
	if (old == null) return old;
	const apply = (e: T): T => {
		if (e?.id !== id) return e;
		return typeof patch === "function"
			? (patch as (entity: T) => T)(e)
			: { ...e, ...(patch as Partial<T>) };
	};
	const o = old as Record<string, unknown>;
	if (Array.isArray(o.pages)) {
		return {
			...o,
			pages: (o.pages as Array<Record<string, unknown>>).map((p) => ({
				...p,
				data: Array.isArray(p.data) ? (p.data as T[]).map(apply) : p.data,
			})),
		};
	}
	if (Array.isArray(o.data)) {
		return { ...o, data: (o.data as T[]).map(apply) };
	}
	if (Array.isArray(old)) {
		return (old as T[]).map(apply);
	}
	if ((old as T).id === id) {
		return typeof patch === "function"
			? (patch as (entity: T) => T)(old as T)
			: { ...(old as object), ...(patch as Partial<T>) };
	}
	return old;
}

export function removeEntity(old: unknown, id: string): unknown {
	if (old == null) return old;
	const keep = (e: EntityWithId) => e?.id !== id;
	const o = old as Record<string, unknown>;
	if (Array.isArray(o.pages)) {
		return {
			...o,
			pages: (o.pages as Array<Record<string, unknown>>).map((p) => {
				if (!Array.isArray(p.data)) return p;
				const data = (p.data as EntityWithId[]).filter(keep);
				const removed = (p.data as EntityWithId[]).length - data.length;
				const count =
					typeof p.count === "number"
						? Math.max(0, p.count - removed)
						: p.count;
				return { ...p, data, count };
			}),
		};
	}
	if (Array.isArray(o.data)) {
		const data = (o.data as EntityWithId[]).filter(keep);
		const removed = (o.data as EntityWithId[]).length - data.length;
		const count =
			typeof o.count === "number" ? Math.max(0, o.count - removed) : o.count;
		return { ...o, data, count };
	}
	if (Array.isArray(old)) {
		return (old as EntityWithId[]).filter(keep);
	}
	return old;
}

export async function snapshotAndCancel(
	qc: QueryClient,
	keys: QueryKey[],
): Promise<Array<[QueryKey, unknown]>> {
	await Promise.all(keys.map((k) => qc.cancelQueries({ queryKey: k })));
	return keys.flatMap((k) => qc.getQueriesData({ queryKey: k }));
}

export function rollback(
	qc: QueryClient,
	snapshot: Array<[QueryKey, unknown]>,
) {
	for (const [key, data] of snapshot) {
		qc.setQueryData(key, data);
	}
}

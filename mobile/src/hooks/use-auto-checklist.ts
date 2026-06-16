import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import {
	type Batch,
	batchesApi,
	type ChecklistTask,
	checklistApi,
} from "@/lib/hydro-api";
import { QK, STALE } from "@/lib/query-config";
import { mmkv } from "@/lib/storage";

export type UrgencyKey = "overdue" | "today" | "soon";

export interface AutoTask {
	id: string;
	title: string;
	detail: string;
	urgency: UrgencyKey;
	batchId?: string;
}

const COMPLETIONS_KEY = "hydro-checklist-completed";

function todayKey(): string {
	const d = new Date();
	return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

function loadCompleted(): Set<string> {
	try {
		const raw = mmkv.getString(COMPLETIONS_KEY);
		if (!raw) return new Set();
		const parsed = JSON.parse(raw) as { date: string; ids: string[] };
		if (parsed.date !== todayKey()) return new Set();
		return new Set(parsed.ids);
	} catch {
		return new Set();
	}
}

function saveCompleted(ids: Set<string>): void {
	mmkv.set(
		COMPLETIONS_KEY,
		JSON.stringify({ date: todayKey(), ids: Array.from(ids) }),
	);
}

function deriveLocalTasks(batches: Batch[]): AutoTask[] {
	const out: AutoTask[] = [];
	const now = Date.now();
	for (const b of batches) {
		if (b.archived_at) continue;
		const age = Math.floor((now - new Date(b.started_at).getTime()) / 86400000);
		if (age >= 2) {
			out.push({
				id: `${b.id}-check`,
				title: `Check germination: ${b.variety_name}`,
				detail: `Day ${age} since sow. Log germinated count.`,
				urgency: age > 5 ? "overdue" : "today",
				batchId: b.id,
			});
		}
		if (age >= 7 && age % 2 === 0) {
			out.push({
				id: `${b.id}-ph`,
				title: `Log pH/EC reading: ${b.variety_name}`,
				detail: "Every 2 days for active reservoir.",
				urgency: "today",
				batchId: b.id,
			});
		}
		if (age >= 25) {
			out.push({
				id: `${b.id}-harvest`,
				title: `Harvest ready? ${b.variety_name}`,
				detail: `${age} days elapsed. Inspect for harvest signs.`,
				urgency: "soon",
				batchId: b.id,
			});
		}
	}
	return out;
}

function mapApiTask(t: ChecklistTask): AutoTask {
	return {
		id: t.id,
		title: t.title,
		detail: t.detail,
		urgency: t.urgency,
		batchId: t.batch_id,
	};
}

function orderByUrgency(tasks: AutoTask[]): AutoTask[] {
	const rank: Record<UrgencyKey, number> = { overdue: 0, today: 1, soon: 2 };
	return [...tasks].sort((a, b) => rank[a.urgency] - rank[b.urgency]);
}

/**
 * Setup-aware auto-generated daily checklist. Prefers the backend rule engine
 * and falls back to a local derivation when it is unavailable. Completion is
 * tracked locally (per-day, MMKV) since these items are ephemeral guidance.
 */
export function useAutoChecklist() {
	const serverTasks = useQuery({
		queryKey: QK.checklist(),
		queryFn: () => checklistApi.list(),
		retry: 0,
		staleTime: STALE.checklist,
	});
	const batches = useQuery({
		queryKey: QK.batches.list(),
		queryFn: () => batchesApi.list(),
		enabled: serverTasks.isError || serverTasks.data?.tasks === undefined,
		staleTime: STALE.batches,
	});

	const tasks = useMemo(() => {
		if (serverTasks.data?.tasks) {
			return orderByUrgency(serverTasks.data.tasks.map(mapApiTask));
		}
		return orderByUrgency(deriveLocalTasks(batches.data?.data ?? []));
	}, [serverTasks.data, batches.data]);

	const [completed, setCompleted] = useState<Set<string>>(() =>
		loadCompleted(),
	);

	function toggle(id: string) {
		setCompleted((prev) => {
			const next = new Set(prev);
			if (next.has(id)) next.delete(id);
			else next.add(id);
			saveCompleted(next);
			return next;
		});
	}

	const hasBatches = (batches.data?.data ?? []).length > 0 || tasks.length > 0;

	return {
		tasks,
		completed,
		toggle,
		hasBatches,
		isLoading: serverTasks.isLoading,
	};
}

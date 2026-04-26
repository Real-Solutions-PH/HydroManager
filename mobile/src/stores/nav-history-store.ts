import { create } from "zustand";

const MAX = 30;

interface NavHistoryState {
	stack: string[];
	push: (path: string) => void;
	pop: () => string | undefined;
	clear: () => void;
}

export const useNavHistoryStore = create<NavHistoryState>((set, get) => ({
	stack: [],
	push: (path) => {
		const cur = get().stack;
		if (cur[cur.length - 1] === path) return;
		const next = [...cur, path];
		if (next.length > MAX) next.shift();
		set({ stack: next });
	},
	pop: () => {
		const cur = get().stack;
		if (cur.length === 0) return undefined;
		const next = cur.slice(0, -1);
		const prev = next[next.length - 1];
		set({ stack: next });
		return prev;
	},
	clear: () => set({ stack: [] }),
}));

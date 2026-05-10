import { create } from "zustand";

interface NavHistoryState {
	stack: string[];
	push: (path: string) => void;
	pop: () => string | null;
	clear: () => void;
}

const MAX = 20;

export const useNavHistoryStore = create<NavHistoryState>()((set, get) => ({
	stack: [],
	push: (path) => {
		const { stack } = get();
		if (stack[stack.length - 1] === path) return;
		const next = [...stack, path];
		if (next.length > MAX) next.shift();
		set({ stack: next });
	},
	pop: () => {
		const { stack } = get();
		if (stack.length === 0) return null;
		const next = stack.slice(0, -1);
		const previous = next[next.length - 1] ?? null;
		set({ stack: next });
		return previous;
	},
	clear: () => set({ stack: [] }),
}));

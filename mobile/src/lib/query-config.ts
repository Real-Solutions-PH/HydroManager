const MIN = 1000 * 60;

export const STALE = {
	me: MIN * 60,
	setups: MIN * 15,
	batches: MIN * 15,
	crops: MIN * 60,
	inventory: MIN * 5,
	checklist: MIN * 2,
	salesDashboard: MIN * 2,
	produce: MIN * 5,
} as const;

export interface InventoryListFilters {
	category?: string;
	nearExpiry?: boolean;
}

export const QK = {
	inventory: {
		all: ["inventory"] as const,
		lists: () => ["inventory", "list"] as const,
		list: (filters: InventoryListFilters = {}) =>
			["inventory", "list", filters] as const,
		detail: (id: string) => ["inventory", "detail", id] as const,
		movements: (id: string) => ["inventory", "movements", id] as const,
	},
} as const;

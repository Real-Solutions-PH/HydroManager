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

export interface SetupsListFilters {
	includeArchived?: boolean;
}

export interface BatchesListFilters {
	setupId?: string;
	includeArchived?: boolean;
}

export interface ProduceListFilters {
	status?: string;
	nearExpiry?: boolean;
}

export const QK = {
	me: () => ["me"] as const,
	crops: () => ["crops"] as const,
	checklist: () => ["checklist"] as const,
	aiQuota: () => ["ai-quota"] as const,
	inventory: {
		all: ["inventory"] as const,
		lists: () => ["inventory", "list"] as const,
		list: (filters: InventoryListFilters = {}) =>
			["inventory", "list", filters] as const,
		detail: (id: string) => ["inventory", "detail", id] as const,
		movements: (id: string) => ["inventory", "movements", id] as const,
	},
	setups: {
		all: ["setups"] as const,
		lists: () => ["setups", "list"] as const,
		list: (filters: SetupsListFilters = {}) =>
			["setups", "list", filters] as const,
		detail: (id: string) => ["setups", "detail", id] as const,
	},
	batches: {
		all: ["batches"] as const,
		lists: () => ["batches", "list"] as const,
		list: (filters: BatchesListFilters = {}) =>
			["batches", "list", filters] as const,
		detail: (id: string) => ["batches", "detail", id] as const,
	},
	produce: {
		all: ["produce"] as const,
		lists: () => ["produce", "list"] as const,
		list: (filters: ProduceListFilters = {}) =>
			["produce", "list", filters] as const,
		detail: (id: string) => ["produce", "detail", id] as const,
		movements: (id: string) => ["produce", "movements", id] as const,
	},
	sales: {
		all: ["sales"] as const,
		list: () => ["sales", "list"] as const,
		dashboard: () => ["sales", "dashboard"] as const,
	},
} as const;

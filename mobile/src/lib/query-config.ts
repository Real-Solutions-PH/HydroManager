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

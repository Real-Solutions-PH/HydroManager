import { api } from "@/lib/auth";

const V1 = "/api/v1";

export type SetupType = "DFT" | "NFT" | "DutchBucket" | "Kratky" | "SNAP";
export type SlotStatus = "empty" | "planted" | "growing" | "ready";

export interface Setup {
	id: string;
	owner_id: string;
	name: string;
	type: SetupType;
	slot_count: number;
	location_label: string | null;
	notes: string | null;
	installed_at: string | null;
	created_at: string;
	archived_at: string | null;
}

export interface SetupSlot {
	id: string;
	slot_code: string;
	position_index: number;
	status: SlotStatus;
}

export interface SetupPhoto {
	id: string;
	storage_url: string;
	uploaded_at: string;
}

export interface SetupDetail extends Setup {
	slots: SetupSlot[];
	photos: SetupPhoto[];
}

export type Milestone =
	| "Sowed"
	| "Germinated"
	| "SeedLeaves"
	| "TrueLeaves"
	| "Transplanted"
	| "Vegetative"
	| "Flowering"
	| "FruitSet"
	| "HarvestReady"
	| "Harvested"
	| "Failed";

export const MILESTONE_ORDER: Milestone[] = [
	"Sowed",
	"Germinated",
	"SeedLeaves",
	"TrueLeaves",
	"Transplanted",
	"Vegetative",
	"Flowering",
	"FruitSet",
	"HarvestReady",
	"Harvested",
];

export interface Batch {
	id: string;
	owner_id: string;
	setup_id: string;
	crop_guide_id: string | null;
	variety_name: string;
	initial_count: number;
	notes: string | null;
	started_at: string;
	archived_at: string | null;
}

export interface BatchStateCount {
	milestone_code: Milestone;
	count: number;
	updated_at: string;
}

export interface BatchTransition {
	id: string;
	from_milestone: Milestone;
	to_milestone: Milestone;
	count: number;
	occurred_at: string;
	notes: string | null;
	photo_url: string | null;
}

export interface BatchDetail extends Batch {
	state_counts: BatchStateCount[];
	recent_transitions: BatchTransition[];
}

export type InventoryCategory =
	| "seeds"
	| "media"
	| "nutrients"
	| "equipment"
	| "packaging"
	| "other";
export type InventoryUnit = "grams" | "pieces" | "liters" | "milliliters";
export type MovementType = "restock" | "consume" | "adjust";

export interface InventoryItem {
	id: string;
	owner_id: string;
	name: string;
	category: InventoryCategory;
	unit: InventoryUnit;
	current_stock: number;
	low_stock_threshold: number;
	notes: string | null;
	created_at: string;
	is_low_stock: boolean;
}

export interface InventoryMovement {
	id: string;
	item_id: string;
	movement_type: MovementType;
	quantity: number;
	cost_total: number | null;
	related_batch_id: string | null;
	occurred_at: string;
	notes: string | null;
}

export interface CropGuide {
	id: string;
	name_en: string;
	name_tl: string;
	category: "leafy" | "herb" | "fruiting" | "other";
	recommended_setups: string;
	ph_min: number;
	ph_max: number;
	ec_min: number;
	ec_max: number;
	days_to_harvest_min: number;
	days_to_harvest_max: number;
	typical_yield_grams: number | null;
	sunlight_hours: string | null;
	temperature_day_c: string | null;
	temperature_night_c: string | null;
	common_issues: string | null;
	harvest_indicator: string | null;
	image_key: string | null;
	source: string | null;
}

interface Paged<T> {
	data: T[];
	count: number;
}

export const setupsApi = {
	async list(includeArchived = false): Promise<Paged<Setup>> {
		const r = await api.get(`${V1}/setups/`, {
			params: { include_archived: includeArchived },
		});
		return r.data;
	},
	async get(id: string): Promise<SetupDetail> {
		const r = await api.get(`${V1}/setups/${id}`);
		return r.data;
	},
	async create(data: {
		name: string;
		type: SetupType;
		slot_count: number;
		location_label?: string;
		notes?: string;
	}): Promise<Setup> {
		const r = await api.post(`${V1}/setups/`, data);
		return r.data;
	},
	async archive(id: string): Promise<Setup> {
		const r = await api.post(`${V1}/setups/${id}/archive`);
		return r.data;
	},
	async delete(id: string): Promise<void> {
		await api.delete(`${V1}/setups/${id}`);
	},
};

export const batchesApi = {
	async list(params?: {
		setup_id?: string;
		include_archived?: boolean;
	}): Promise<Paged<Batch>> {
		const r = await api.get(`${V1}/batches/`, { params });
		return r.data;
	},
	async get(id: string): Promise<BatchDetail> {
		const r = await api.get(`${V1}/batches/${id}`);
		return r.data;
	},
	async create(data: {
		setup_id: string;
		variety_name: string;
		initial_count: number;
		crop_guide_id?: string | null;
		notes?: string;
	}): Promise<Batch> {
		const r = await api.post(`${V1}/batches/`, data);
		return r.data;
	},
	async transition(
		id: string,
		data: {
			from_milestone: Milestone;
			to_milestone: Milestone;
			count: number;
			notes?: string;
		},
	): Promise<BatchTransition> {
		const r = await api.post(`${V1}/batches/${id}/transitions`, data);
		return r.data;
	},
	async harvest(
		id: string,
		data: { weight_grams: number; count: number; notes?: string },
	): Promise<unknown> {
		const r = await api.post(`${V1}/batches/${id}/harvests`, data);
		return r.data;
	},
	async archive(id: string): Promise<Batch> {
		const r = await api.post(`${V1}/batches/${id}/archive`);
		return r.data;
	},
};

export const inventoryApi = {
	async list(category?: InventoryCategory): Promise<Paged<InventoryItem>> {
		const r = await api.get(`${V1}/inventory/items`, {
			params: category ? { category } : undefined,
		});
		return r.data;
	},
	async create(data: {
		name: string;
		category: InventoryCategory;
		unit: InventoryUnit;
		current_stock: number;
		low_stock_threshold: number;
		notes?: string;
	}): Promise<InventoryItem> {
		const r = await api.post(`${V1}/inventory/items`, data);
		return r.data;
	},
	async movement(
		id: string,
		data: {
			movement_type: MovementType;
			quantity: number;
			cost_total?: number;
			notes?: string;
		},
	): Promise<InventoryMovement> {
		const r = await api.post(`${V1}/inventory/items/${id}/movements`, data);
		return r.data;
	},
	async delete(id: string): Promise<void> {
		await api.delete(`${V1}/inventory/items/${id}`);
	},
};

export const cropsApi = {
	async list(
		query?: string,
		category?: "leafy" | "herb" | "fruiting" | "other",
	): Promise<Paged<CropGuide>> {
		const r = await api.get(`${V1}/crops/`, {
			params: { query, category },
		});
		return r.data;
	},
	async get(id: string): Promise<CropGuide> {
		const r = await api.get(`${V1}/crops/${id}`);
		return r.data;
	},
};

export const SETUP_TYPE_COLOR: Record<SetupType, { fg: string; bg: string }> = {
	DFT: { fg: "#42A5F5", bg: "rgba(66,165,245,0.15)" },
	NFT: { fg: "#66BB6A", bg: "rgba(102,187,106,0.15)" },
	DutchBucket: { fg: "#FFB74D", bg: "rgba(255,183,77,0.15)" },
	Kratky: { fg: "#CE93D8", bg: "rgba(206,147,216,0.15)" },
	SNAP: { fg: "#80DEEA", bg: "rgba(128,222,234,0.15)" },
};

export const INVENTORY_CATEGORY_COLOR: Record<
	InventoryCategory,
	{ fg: string; bg: string }
> = {
	seeds: { fg: "#66BB6A", bg: "rgba(102,187,106,0.15)" },
	media: { fg: "#FFB74D", bg: "rgba(255,183,77,0.15)" },
	nutrients: { fg: "#42A5F5", bg: "rgba(66,165,245,0.15)" },
	equipment: { fg: "#CE93D8", bg: "rgba(206,147,216,0.15)" },
	packaging: { fg: "#80DEEA", bg: "rgba(128,222,234,0.15)" },
	other: { fg: "rgba(255,255,255,0.5)", bg: "rgba(255,255,255,0.06)" },
};

export type UserTier = "free" | "grower" | "pro";
export type SaleChannel = "direct" | "market" | "delivery" | "resto" | "other";
export type PaymentStatus = "paid" | "pending" | "cancelled";

export interface SaleItem {
	id: string;
	crop_name: string;
	quantity: number;
	unit: string;
	unit_price: number;
	linked_batch_id: string | null;
}

export interface Sale {
	id: string;
	owner_id: string;
	buyer_label: string | null;
	channel: SaleChannel;
	sold_at: string;
	payment_status: PaymentStatus;
	notes: string | null;
	items: SaleItem[];
}

export interface Dashboard {
	gross_current_month: number;
	gross_last_90_days: number;
	gross_ytd: number;
	cogs_current_month: number;
	cogs_last_90_days: number;
	cogs_ytd: number;
	net_margin_pct: number;
	top_crops: { crop: string; revenue: number }[];
	channel_revenue: { channel: string; revenue: number }[];
}

export interface ChecklistTask {
	id: string;
	source: string;
	urgency: "overdue" | "today" | "soon";
	title: string;
	detail: string;
	batch_id?: string;
	setup_id?: string;
	item_id?: string;
	section: string;
}

export interface ChatResponse {
	answer: string;
	language: string;
	citations: { type: string; id: string; label: string }[];
	messages_used: number;
}

export interface Quota {
	tier: UserTier;
	used: number;
	limit: number;
	remaining: number;
	period_start: string;
}

export const salesApi = {
	async list(): Promise<Paged<Sale>> {
		const r = await api.get(`${V1}/sales/`);
		return r.data;
	},
	async create(data: {
		buyer_label?: string;
		channel?: SaleChannel;
		payment_status?: PaymentStatus;
		notes?: string;
		items: Array<{
			crop_name: string;
			quantity: number;
			unit: string;
			unit_price: number;
			linked_batch_id?: string | null;
		}>;
	}): Promise<Sale> {
		const r = await api.post(`${V1}/sales/`, data);
		return r.data;
	},
	async delete(id: string): Promise<void> {
		await api.delete(`${V1}/sales/${id}`);
	},
	async dashboard(): Promise<Dashboard> {
		const r = await api.get(`${V1}/sales/dashboard`);
		return r.data;
	},
};

export const checklistApi = {
	async list(): Promise<{ tasks: ChecklistTask[]; count: number }> {
		const r = await api.get(`${V1}/checklist/`);
		return r.data;
	},
};

export const hydroAiApi = {
	async chat(message: string): Promise<ChatResponse> {
		const r = await api.post(`${V1}/hydro-ai/chat`, { message });
		return r.data;
	},
	async quota(): Promise<Quota> {
		const r = await api.get(`${V1}/hydro-ai/quota`);
		return r.data;
	},
	async visionOnboard(image_url: string): Promise<{
		setup_type: string;
		estimated_slot_count: number;
		layout_hint: string;
		confidence: number;
	}> {
		const r = await api.post(`${V1}/hydro-ai/vision/setup-onboard`, {
			image_url,
		});
		return r.data;
	},
};

export const photosApi = {
	async upload(
		scope: string,
		uri: string,
		filename: string,
		mime: string,
	): Promise<{ url: string }> {
		const form = new FormData();
		form.append("scope", scope);
		form.append("file", {
			uri,
			name: filename,
			type: mime,
		} as unknown as Blob);
		const r = await api.post(`${V1}/hydro/photos/upload`, form, {
			headers: { "Content-Type": "multipart/form-data" },
		});
		return r.data;
	},
};

export const paymongoApi = {
	async checkout(
		target_tier: "grower" | "pro",
		billing_cycle: "monthly" | "yearly",
	): Promise<{ checkout_url: string; amount_php: number }> {
		const r = await api.post(`${V1}/paymongo/checkout`, {
			target_tier,
			billing_cycle,
		});
		return r.data;
	},
};

export const usersApi = {
	async me(): Promise<{
		id: string;
		email: string;
		full_name: string | null;
		tier: UserTier;
		locale: string;
	}> {
		const r = await api.get(`${V1}/users/me`);
		return r.data;
	},
	async updateMe(data: {
		full_name?: string;
		email?: string;
		locale?: string;
	}): Promise<unknown> {
		const r = await api.patch(`${V1}/users/me`, data);
		return r.data;
	},
};

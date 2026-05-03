import * as FileSystem from "expo-file-system";
import { Platform } from "react-native";
import { API_URL, api, getAccessToken } from "@/lib/auth";

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
	primary_photo_url: string | null;
}

export interface SetupSlot {
	id: string;
	slot_code: string;
	position_index: number;
	status: SlotStatus;
	batch_id: string | null;
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
	slots_used: number | null;
	seeds_per_slot: number | null;
	notes: string | null;
	started_at: string;
	archived_at: string | null;
	legacy: boolean;
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
export type ExpiryStatus = "ok" | "warning" | "expired";

export interface InventoryItem {
	id: string;
	owner_id: string;
	name: string;
	category: InventoryCategory;
	unit: InventoryUnit;
	current_stock: number;
	low_stock_threshold: number;
	unit_cost: number | null;
	notes: string | null;
	created_at: string;
	is_low_stock: boolean;
	expiry_date: string | null;
	expiry_status: ExpiryStatus;
	days_until_expiry: number | null;
	last_restocked_at: string | null;
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

export interface CropRisk {
	title: string;
	description: string;
	mitigation: string;
}

export interface CropGrowthStage {
	stage: string;
	day_min: number;
	day_max: number;
	description: string;
	actions: string[];
}
export type ProduceStatus = "ready" | "reserved" | "sold";
export type ProduceMovementType =
	| "harvest"
	| "reserve"
	| "sell"
	| "discard"
	| "adjust";

export interface Produce {
	id: string;
	owner_id: string;
	name: string;
	source_batch_id: string | null;
	quantity: number;
	unit: string;
	status: ProduceStatus;
	harvested_at: string;
	expiry_date: string | null;
	expiry_status: ExpiryStatus;
	days_until_expiry: number | null;
	selling_price: number | null;
	notes: string | null;
	created_at: string;
}

export interface ProduceMovement {
	id: string;
	produce_id: string;
	movement_type: ProduceMovementType;
	quantity: number;
	related_sale_id: string | null;
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
	image_url: string | null;
	ec_seedling: number | null;
	ec_vegetative: number | null;
	ec_mature: number | null;
	ec_fruiting: number | null;
	water_temp_c: string | null;
	humidity_pct: string | null;
	growlight_hours: string | null;
	local_price_php_per_kg_min: number | null;
	local_price_php_per_kg_max: number | null;
	tips: string[] | null;
	risks: CropRisk[] | null;
	growth_stages: CropGrowthStage[] | null;
}

export type GuideCategory =
	| "setup"
	| "nutrition"
	| "business"
	| "safety"
	| "operations"
	| "other";

export interface LibraryGuide {
	id: string;
	title: string;
	summary: string;
	category: GuideCategory;
	body_md: string;
	image_key: string | null;
	image_url: string | null;
	read_time_min: number | null;
	tags: string[] | null;
	source: string | null;
}

export type PestKind = "pest" | "disease" | "deficiency";
export type PestSeverity = "low" | "medium" | "high";

export interface LibraryPest {
	id: string;
	name: string;
	kind: PestKind;
	severity: PestSeverity;
	affected_crops: string[] | null;
	symptoms: string[] | null;
	causes: string[] | null;
	prevention: string[] | null;
	treatment: string[] | null;
	image_key: string | null;
	image_url: string | null;
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
	async update(
		id: string,
		data: {
			name?: string;
			type?: SetupType;
			slot_count?: number;
			location_label?: string | null;
			notes?: string | null;
			installed_at?: string | null;
		},
	): Promise<Setup> {
		const r = await api.put(`${V1}/setups/${id}`, data);
		return r.data;
	},
	async archive(id: string): Promise<Setup> {
		const r = await api.post(`${V1}/setups/${id}/archive`);
		return r.data;
	},
	async delete(id: string): Promise<void> {
		await api.delete(`${V1}/setups/${id}`);
	},
	async addPhoto(id: string, storage_url: string): Promise<SetupPhoto> {
		const r = await api.post(`${V1}/setups/${id}/photos`, { storage_url });
		return r.data;
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
		slots_used: number;
		seeds_per_slot: number;
		crop_guide_id?: string | null;
		notes?: string;
		started_at?: string;
	}): Promise<Batch> {
		const r = await api.post(`${V1}/batches/`, data);
		return r.data;
	},
	async update(
		id: string,
		data: {
			setup_id?: string;
			variety_name?: string;
			crop_guide_id?: string | null;
			notes?: string | null;
			started_at?: string | null;
		},
	): Promise<Batch> {
		const r = await api.put(`${V1}/batches/${id}`, data);
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
	async delete(id: string): Promise<void> {
		await api.delete(`${V1}/batches/${id}`);
	},
	async allocateSlots(
		id: string,
		data: { slots_used: number; seeds_per_slot: number },
	): Promise<Batch> {
		const r = await api.post(`${V1}/batches/${id}/allocate-slots`, data);
		return r.data;
	},
};

export const inventoryApi = {
	async list(params?: {
		category?: InventoryCategory;
		near_expiry?: boolean;
	}): Promise<Paged<InventoryItem>> {
		const r = await api.get(`${V1}/inventory/items`, {
			params: {
				category: params?.category,
				near_expiry: params?.near_expiry ? true : undefined,
			},
		});
		return r.data;
	},
	async get(id: string): Promise<InventoryItem> {
		const r = await api.get(`${V1}/inventory/items/${id}`);
		return r.data;
	},
	async create(data: {
		name: string;
		category: InventoryCategory;
		unit: InventoryUnit;
		current_stock: number;
		low_stock_threshold: number;
		unit_cost?: number | null;
		expiry_date?: string | null;
		notes?: string;
	}): Promise<InventoryItem> {
		const r = await api.post(`${V1}/inventory/items`, data);
		return r.data;
	},
	async update(
		id: string,
		data: {
			name?: string;
			category?: InventoryCategory;
			unit?: InventoryUnit;
			low_stock_threshold?: number;
			unit_cost?: number | null;
			expiry_date?: string | null;
			notes?: string;
		},
	): Promise<InventoryItem> {
		const r = await api.put(`${V1}/inventory/items/${id}`, data);
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
	async movements(id: string): Promise<Paged<InventoryMovement>> {
		const r = await api.get(`${V1}/inventory/items/${id}/movements`);
		return r.data;
	},
	async delete(id: string): Promise<void> {
		await api.delete(`${V1}/inventory/items/${id}`);
	},
};

export const produceApi = {
	async list(params?: {
		status?: ProduceStatus | "all";
		near_expiry?: boolean;
	}): Promise<Paged<Produce>> {
		const r = await api.get(`${V1}/produce/`, {
			params: {
				status:
					params?.status && params.status !== "all" ? params.status : undefined,
				near_expiry: params?.near_expiry ? true : undefined,
			},
		});
		return r.data;
	},
	async get(id: string): Promise<Produce> {
		const r = await api.get(`${V1}/produce/${id}`);
		return r.data;
	},
	async create(data: {
		name: string;
		source_batch_id?: string | null;
		quantity: number;
		unit: string;
		harvested_at: string;
		expiry_date?: string | null;
		selling_price?: number | null;
		notes?: string;
	}): Promise<Produce> {
		const r = await api.post(`${V1}/produce/`, data);
		return r.data;
	},
	async update(
		id: string,
		data: {
			name?: string;
			quantity?: number;
			unit?: string;
			status?: ProduceStatus;
			expiry_date?: string | null;
			selling_price?: number | null;
			notes?: string;
		},
	): Promise<Produce> {
		const r = await api.patch(`${V1}/produce/${id}`, data);
		return r.data;
	},
	async movement(
		id: string,
		data: {
			movement_type: ProduceMovementType;
			quantity: number;
			notes?: string;
		},
	): Promise<ProduceMovement> {
		const r = await api.post(`${V1}/produce/${id}/movements`, data);
		return r.data;
	},
	async movements(id: string): Promise<Paged<ProduceMovement>> {
		const r = await api.get(`${V1}/produce/${id}/movements`);
		return r.data;
	},
	async nearExpiry(): Promise<Paged<Produce>> {
		const r = await api.get(`${V1}/produce/near-expiry`);
		return r.data;
	},
	async delete(id: string): Promise<void> {
		await api.delete(`${V1}/produce/${id}`);
	},
};

export interface CropStatValue {
	min: number;
	max: number;
	avg: number;
}

export interface CropStatsResponse {
	stats: Record<string, CropStatValue>;
}

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
	async stats(): Promise<CropStatsResponse> {
		const r = await api.get(`${V1}/crops/stats`);
		return r.data;
	},
};

export type ClimateProviderName = "open_meteo" | "nasa_power";

export interface ClimateNormals {
	provider: string;
	lat: number;
	lon: number;
	month: number;
	air_temp_c_avg: number | null;
	air_temp_c_min: number | null;
	air_temp_c_max: number | null;
	humidity_pct_avg: number | null;
	sunlight_hours_avg: number | null;
	precipitation_mm_total: number | null;
	solar_radiation_mj_m2_day: number | null;
}

export const climateApi = {
	async normals(params: {
		lat: number;
		lon: number;
		month: number;
		provider?: ClimateProviderName;
	}): Promise<ClimateNormals> {
		const r = await api.get(`${V1}/climate/normals`, { params });
		return r.data;
	},
	async providers(): Promise<{ providers: string[] }> {
		const r = await api.get(`${V1}/climate/providers`);
		return r.data;
	},
};

export const libraryApi = {
	guides: {
		async list(
			query?: string,
			category?: GuideCategory,
		): Promise<Paged<LibraryGuide>> {
			const r = await api.get(`${V1}/library/guides/`, {
				params: { query, category },
			});
			return r.data;
		},
		async get(id: string): Promise<LibraryGuide> {
			const r = await api.get(`${V1}/library/guides/${id}`);
			return r.data;
		},
	},
	pests: {
		async list(query?: string, kind?: PestKind): Promise<Paged<LibraryPest>> {
			const r = await api.get(`${V1}/library/pests/`, {
				params: { query, kind },
			});
			return r.data;
		},
		async get(id: string): Promise<LibraryPest> {
			const r = await api.get(`${V1}/library/pests/${id}`);
			return r.data;
		},
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

export const PRODUCE_STATUS_COLOR: Record<
	ProduceStatus,
	{ fg: string; bg: string }
> = {
	ready: { fg: "#66BB6A", bg: "rgba(102,187,106,0.15)" },
	reserved: { fg: "#FFB74D", bg: "rgba(255,183,77,0.15)" },
	sold: { fg: "rgba(255,255,255,0.5)", bg: "rgba(255,255,255,0.06)" },
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
	linked_produce_id: string | null;
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
	gross_current_week: number;
	gross_current_month: number;
	gross_last_90_days: number;
	gross_ytd: number;
	cogs_current_week: number;
	cogs_current_month: number;
	cogs_last_90_days: number;
	cogs_ytd: number;
	net_current_week: number;
	net_current_month: number;
	net_last_90_days: number;
	net_ytd: number;
	net_margin_pct: number;
	sold_count_week: number;
	sold_count_month: number;
	produce_ready_count: number;
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
			linked_produce_id?: string | null;
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
		mime: string,
	): Promise<{ url: string }> {
		const token = await getAccessToken();
		const endpoint = `${API_URL}${V1}/hydro/photos/upload`;

		if (Platform.OS === "web") {
			const blob = await (await fetch(uri)).blob();
			const form = new FormData();
			form.append("scope", scope);
			const ext = mime.split("/")[1] || "jpg";
			form.append("file", blob, `upload-${Date.now()}.${ext}`);
			const res = await fetch(endpoint, {
				method: "POST",
				body: form,
				headers: token ? { Authorization: `Bearer ${token}` } : undefined,
			});
			if (!res.ok) {
				throw new Error(`Upload failed (${res.status}): ${await res.text()}`);
			}
			return res.json();
		}

		const res = await FileSystem.uploadAsync(endpoint, uri, {
			httpMethod: "POST",
			uploadType: FileSystem.FileSystemUploadType.MULTIPART,
			fieldName: "file",
			mimeType: mime,
			parameters: { scope },
			headers: token ? { Authorization: `Bearer ${token}` } : {},
		});
		if (res.status < 200 || res.status >= 300) {
			throw new Error(`Upload failed (${res.status}): ${res.body}`);
		}
		try {
			return JSON.parse(res.body) as { url: string };
		} catch {
			throw new Error(`Upload returned non-JSON: ${res.body}`);
		}
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

export const passwordApi = {
	async recover(email: string): Promise<{ message: string }> {
		const r = await api.post(
			`${V1}/password-recovery/${encodeURIComponent(email)}`,
		);
		return r.data;
	},
	async reset(
		token: string,
		newPassword: string,
	): Promise<{ message: string }> {
		const r = await api.post(`${V1}/reset-password/`, {
			token,
			new_password: newPassword,
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

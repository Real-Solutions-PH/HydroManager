import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

type Locale = "en" | "tl";

const en = {
	greeting: "Hi",
	tabs: {
		home: "Home",
		setups: "Setups",
		crops: "Crops",
		tasks: "Tasks",
		inventory: "Inventory",
		sales: "Sales",
	},
	home: {
		today: "Today",
		today_subtitle: "At-a-glance farm status",
		stats_setups: "Setups",
		stats_batches: "Batches",
		stats_harvest: "Near Harvest",
		stats_low_stock: "Low Stock",
		quick_actions: "Quick Actions",
		new_setup: "New Setup",
		start_batch: "Start a Batch",
		add_inventory: "Add Inventory Item",
		alerts: "Alerts",
		low_stock_title: "Low Stock",
		setups_section: "Setups",
		setups_subtitle: "Your active systems",
		no_setups: "No setups yet. Add your first.",
	},
	setups: {
		title: "Setups",
		filter_all: "All",
		filter_active: "Active",
		filter_archived: "Archived",
		slots: "{n} slots",
		empty: "No setups yet. Tap + New.",
	},
	crops: {
		title: "Crops",
		search: "Search crops (en/tl)",
		empty: "No crops matched.",
	},
	checklist: {
		title: "Tasks",
		subtitle: "Setup-aware daily checklist",
		progress: "Today's progress",
		overdue: "{n} overdue",
		today: "{n} today",
		soon: "{n} soon",
		empty: "Start a batch to see setup-aware tasks.",
		caught_up: "All caught up!",
	},
	inventory: {
		title: "Inventory",
		search: "Search inventory",
		empty: "No items. Tap + New.",
		low_stock: "LOW",
		min: "Min {n} {unit}",
	},
	sales: {
		title: "Sales",
		dashboard: "Dashboard",
		gross_month: "Gross (month)",
		gross_90: "Gross (90d)",
		gross_ytd: "Gross (YTD)",
		net_margin: "Net margin",
		new_sale: "New Sale",
		empty: "No sales yet.",
		pro_required:
			"Sales & COGS tracking is a Pro feature. Upgrade to track revenue and margin.",
		upgrade: "Upgrade to Pro",
	},
	ai: {
		title: "Crop Assistant",
		placeholder: "Ask about your farm...",
		send: "Send",
		quota: "{used}/{limit} used this month",
		over_quota: "Quota exhausted. Upgrade for more.",
	},
	settings: {
		title: "Settings",
		language: "Language",
		english: "English",
		tagalog: "Tagalog",
		tier: "Tier",
		upgrade: "Upgrade",
	},
	actions: {
		create: "Create",
		cancel: "Cancel",
		save: "Save",
		delete: "Delete",
		archive: "Archive",
		new: "New",
	},
};

const tl: typeof en = {
	greeting: "Kumusta",
	tabs: {
		home: "Tahanan",
		setups: "Mga Setup",
		crops: "Mga Halaman",
		tasks: "Gawain",
		inventory: "Imbentaryo",
		sales: "Benta",
	},
	home: {
		today: "Ngayon",
		today_subtitle: "Mabilis na tanaw ng sakahan",
		stats_setups: "Setup",
		stats_batches: "Batch",
		stats_harvest: "Malapit nang Anihin",
		stats_low_stock: "Kulang na Stock",
		quick_actions: "Mabilisang Aksyon",
		new_setup: "Bagong Setup",
		start_batch: "Magsimula ng Batch",
		add_inventory: "Magdagdag ng Imbentaryo",
		alerts: "Mga Alerto",
		low_stock_title: "Kulang ang Stock",
		setups_section: "Mga Setup",
		setups_subtitle: "Iyong aktibong mga sistema",
		no_setups: "Wala pang setup. Magdagdag.",
	},
	setups: {
		title: "Mga Setup",
		filter_all: "Lahat",
		filter_active: "Aktibo",
		filter_archived: "Naka-archive",
		slots: "{n} na slot",
		empty: "Wala pang setup. Pindutin ang + New.",
	},
	crops: {
		title: "Mga Halaman",
		search: "Hanapin (en/tl)",
		empty: "Walang tumugma.",
	},
	checklist: {
		title: "Gawain",
		subtitle: "Listahan batay sa iyong setup",
		progress: "Progress ngayon",
		overdue: "{n} hulí na",
		today: "{n} ngayon",
		soon: "{n} malapit na",
		empty: "Magsimula ng batch para makakita ng gawain.",
		caught_up: "Tapos na lahat!",
	},
	inventory: {
		title: "Imbentaryo",
		search: "Hanapin sa imbentaryo",
		empty: "Walang laman. Pindutin ang + New.",
		low_stock: "KULANG",
		min: "Min {n} {unit}",
	},
	sales: {
		title: "Benta",
		dashboard: "Dashboard",
		gross_month: "Benta (buwan)",
		gross_90: "Benta (90 araw)",
		gross_ytd: "Benta (taon)",
		net_margin: "Net margin",
		new_sale: "Bagong Benta",
		empty: "Walang benta.",
		pro_required:
			"Ang Sales & COGS ay Pro na pitsur. Mag-upgrade para masundan ang kita.",
		upgrade: "Mag-upgrade sa Pro",
	},
	ai: {
		title: "Katulong sa Pananim",
		placeholder: "Magtanong tungkol sa iyong sakahan...",
		send: "Ipadala",
		quota: "{used}/{limit} nagamit ngayong buwan",
		over_quota: "Naubos na quota. Mag-upgrade.",
	},
	settings: {
		title: "Mga Setting",
		language: "Wika",
		english: "English",
		tagalog: "Tagalog",
		tier: "Antas",
		upgrade: "Mag-upgrade",
	},
	actions: {
		create: "Likhain",
		cancel: "Kanselahin",
		save: "I-save",
		delete: "Burahin",
		archive: "I-archive",
		new: "Bago",
	},
};

const dicts = { en, tl } as const;

interface I18nState {
	locale: Locale;
	setLocale: (l: Locale) => void;
}

export const useI18n = create<I18nState>()(
	persist(
		(set) => ({
			locale: "en",
			setLocale: (locale) => set({ locale }),
		}),
		{
			name: "hydro-locale",
			storage: createJSONStorage(() => AsyncStorage),
		},
	),
);

export function t(
	path: string,
	params: Record<string, string | number> = {},
): string {
	const locale = useI18n.getState().locale;
	const root = dicts[locale] as Record<string, unknown>;
	const parts = path.split(".");
	let cur: unknown = root;
	for (const p of parts) {
		if (typeof cur !== "object" || cur === null) return path;
		cur = (cur as Record<string, unknown>)[p];
	}
	if (typeof cur !== "string") return path;
	let out = cur;
	for (const [k, v] of Object.entries(params)) {
		out = out.replace(`{${k}}`, String(v));
	}
	return out;
}

export function useT() {
	const locale = useI18n((s) => s.locale);
	return { t, locale };
}

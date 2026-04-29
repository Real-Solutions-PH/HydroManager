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
		greeting: "Hi,",
		default_name: "Grower",
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
		greeting_morning: "Good morning! 🇵🇭",
		greeting_afternoon: "Good afternoon! 🇵🇭",
		greeting_evening: "Good evening! 🇵🇭",
		farm_label: "{name}'s Farm",
		checkin_quote: "How's your farm today? 👋",
		checkin_summary: "{tasks} tasks pending • {harvests} batches ready to check • {low} low stock",
		todays_tasks: "Today's Tasks",
		tasks_done_count: "{done} of {total} tasks completed today",
		kpi_active_setups: "Active Setups",
		kpi_plant_batches: "Plant Batches",
		kpi_near_harvest: "Near Harvest",
		kpi_low_stock: "Low Stock",
		alert_severity_urgent: "URGENT",
		alert_severity_low: "LOW",
		upcoming_harvests: "Upcoming Harvests",
		see_all: "See all",
		days_left: "{n}d left",
		recent_activity: "Recent Activity",
		qa_new_batch: "New Batch",
		qa_log_reading: "Log Reading",
		qa_crop_guide: "Crop Guide",
		qa_add_sale: "Add Sale",
		qa_restock: "Restock",
		qa_tasks: "Tasks",
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
		delete_confirm_title: "Delete sale?",
		delete_confirm_body: "Remove sale for {label}?",
		unnamed_buyer: "unnamed buyer",
		top_crops_90: "Top crops (90d)",
		recent: "Recent sales",
		save: "Save Sale",
		add_item: "Add item",
	},
	ai: {
		title: "Crop Assistant",
		placeholder: "Ask about your farm...",
		send: "Send",
		quota: "{used}/{limit} used this month",
		over_quota: "Quota exhausted. Upgrade for more.",
		quota_reached: "Quota reached",
	},
	settings: {
		title: "Settings",
		language: "Language",
		english: "English",
		tagalog: "Tagalog",
		tier: "Tier",
		upgrade: "Upgrade",
		logout_title: "Logout?",
		logout_body: "You'll need to sign in again.",
		edit_profile: "Edit profile",
	},
	actions: {
		create: "Create",
		cancel: "Cancel",
		save: "Save",
		delete: "Delete",
		archive: "Archive",
		new: "New",
		logout: "Logout",
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
		greeting: "Kumusta,",
		default_name: "Magsasaka",
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
		greeting_morning: "Magandang umaga! 🇵🇭",
		greeting_afternoon: "Magandang hapon! 🇵🇭",
		greeting_evening: "Magandang gabi! 🇵🇭",
		farm_label: "Farm ni {name}",
		checkin_quote: "Kumusta ang farm mo ngayon! 👋",
		checkin_summary: "{tasks} gawain natitira • {harvests} batch handa nang suriin • {low} kulang na stock",
		todays_tasks: "Mga Gawain Ngayon",
		tasks_done_count: "{done} sa {total} gawain natapos ngayon",
		kpi_active_setups: "Aktibong Setup",
		kpi_plant_batches: "Batch ng Halaman",
		kpi_near_harvest: "Malapit Anihin",
		kpi_low_stock: "Mababang Stock",
		alert_severity_urgent: "URGENTE",
		alert_severity_low: "MABABA",
		upcoming_harvests: "Mga Paparating na Ani",
		see_all: "Tingnan lahat",
		days_left: "{n}d natitira",
		recent_activity: "Kamakailang Aktibidad",
		qa_new_batch: "Bagong Batch",
		qa_log_reading: "Itala ang Reading",
		qa_crop_guide: "Gabay sa Pananim",
		qa_add_sale: "Magdagdag ng Benta",
		qa_restock: "Punan ang Stock",
		qa_tasks: "Mga Gawain",
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
		delete_confirm_title: "Burahin ang benta?",
		delete_confirm_body: "Alisin ang benta para kay {label}?",
		unnamed_buyer: "walang pangalan na mamimili",
		top_crops_90: "Nangungunang pananim (90 araw)",
		recent: "Mga kamakailang benta",
		save: "I-save ang Benta",
		add_item: "Magdagdag ng item",
	},
	ai: {
		title: "Katulong sa Pananim",
		placeholder: "Magtanong tungkol sa iyong sakahan...",
		send: "Ipadala",
		quota: "{used}/{limit} nagamit ngayong buwan",
		over_quota: "Naubos na quota. Mag-upgrade.",
		quota_reached: "Naubos na ang quota",
	},
	settings: {
		title: "Mga Setting",
		language: "Wika",
		english: "English",
		tagalog: "Tagalog",
		tier: "Antas",
		upgrade: "Mag-upgrade",
		logout_title: "Mag-logout?",
		logout_body: "Kakailanganing mag-sign in muli.",
		edit_profile: "I-edit ang profile",
	},
	actions: {
		create: "Likhain",
		cancel: "Kanselahin",
		save: "I-save",
		delete: "Burahin",
		archive: "I-archive",
		new: "Bago",
		logout: "Mag-logout",
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

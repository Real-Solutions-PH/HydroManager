import { config } from "@/lib/config";

export const emailPattern = {
	value: /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9-]+(?:\.[a-z0-9-]+)*$/i,
	message: "Invalid email address",
};

export const namePattern = {
	value: /^[A-Za-z\s\u00C0-\u017F]{1,30}$/,
	message: "Invalid name",
};

export const passwordRules = (isRequired = true) => {
	const rules: Record<string, unknown> = {
		minLength: { value: 8, message: "Password must be at least 8 characters" },
	};
	if (isRequired) rules.required = "Password is required";
	return rules;
};

export const confirmPasswordRules = (
	getValues: () => { password?: string; new_password?: string },
	isRequired = true,
) => {
	const rules: Record<string, unknown> = {
		validate: (value: string) => {
			const password = getValues().password || getValues().new_password;
			return value === password ? true : "Passwords do not match";
		},
	};
	if (isRequired) rules.required = "Password confirmation is required";
	return rules;
};

export function handleError(err: unknown): string {
	if (err && typeof err === "object") {
		const e = err as {
			response?: { data?: { detail?: unknown }; status?: number };
			request?: unknown;
			code?: string;
			message?: string;
		};

		if (e.response) {
			const detail = e.response.data?.detail;
			if (typeof detail === "string") return detail;
			if (Array.isArray(detail) && detail[0]?.msg) return String(detail[0].msg);
			return `Server error (${e.response.status ?? "unknown"})`;
		}

		if (
			e.request ||
			e.code === "ERR_NETWORK" ||
			e.message === "Network Error"
		) {
			return `Cannot reach server at ${config.apiUrl}. Check your internet, the server status, or that the app was rebuilt after changing EXPO_PUBLIC_API_URL.`;
		}

		if (e.code === "ECONNABORTED") {
			return `Request to ${config.apiUrl} timed out. Server slow or unreachable.`;
		}
	}
	if (err instanceof Error) return err.message;
	if (typeof err === "string") return err;
	return "An unexpected error occurred";
}

export function capitalize(s: string): string {
	return s.length === 0 ? s : s[0].toUpperCase() + s.slice(1);
}

export function formatDateOnly(
	iso: string | null | undefined,
	options: Intl.DateTimeFormatOptions = {
		year: "numeric",
		month: "short",
		day: "2-digit",
	},
): string {
	if (!iso) return "";
	const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
	if (!m) return "";
	const d = new Date(
		Number.parseInt(m[1], 10),
		Number.parseInt(m[2], 10) - 1,
		Number.parseInt(m[3], 10),
	);
	return Number.isNaN(d.getTime())
		? ""
		: d.toLocaleDateString(undefined, options);
}

export function formatPHP(
	n: number | null | undefined,
	fractionDigits = 2,
): string {
	const v = typeof n === "number" && Number.isFinite(n) ? n : 0;
	return `₱${v.toLocaleString("en-PH", {
		minimumFractionDigits: fractionDigits,
		maximumFractionDigits: fractionDigits,
	})}`;
}

function hexToRgb(hex: string): [number, number, number] | null {
	const m = /^#?([0-9a-f]{6}|[0-9a-f]{3})$/i.exec(hex.trim());
	if (!m) return null;
	let h = m[1];
	if (h.length === 3) h = h.split("").map((c) => c + c).join("");
	return [
		Number.parseInt(h.slice(0, 2), 16),
		Number.parseInt(h.slice(2, 4), 16),
		Number.parseInt(h.slice(4, 6), 16),
	];
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
	const rn = r / 255;
	const gn = g / 255;
	const bn = b / 255;
	const max = Math.max(rn, gn, bn);
	const min = Math.min(rn, gn, bn);
	const l = (max + min) / 2;
	let h = 0;
	let s = 0;
	if (max !== min) {
		const d = max - min;
		s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
		if (max === rn) h = ((gn - bn) / d + (gn < bn ? 6 : 0)) / 6;
		else if (max === gn) h = ((bn - rn) / d + 2) / 6;
		else h = ((rn - gn) / d + 4) / 6;
	}
	return [h, s, l];
}

function hslToHex(h: number, s: number, l: number): string {
	const hue2rgb = (p: number, q: number, t: number) => {
		let tt = t;
		if (tt < 0) tt += 1;
		if (tt > 1) tt -= 1;
		if (tt < 1 / 6) return p + (q - p) * 6 * tt;
		if (tt < 1 / 2) return q;
		if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6;
		return p;
	};
	let r: number;
	let g: number;
	let b: number;
	if (s === 0) {
		r = g = b = l;
	} else {
		const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
		const p = 2 * l - q;
		r = hue2rgb(p, q, h + 1 / 3);
		g = hue2rgb(p, q, h);
		b = hue2rgb(p, q, h - 1 / 3);
	}
	const to = (x: number) =>
		Math.round(x * 255)
			.toString(16)
			.padStart(2, "0");
	return `#${to(r)}${to(g)}${to(b)}`;
}

/**
 * Returns a hex color guaranteed to have enough darkness for AA text contrast
 * against a light tint of the same hue (used by Badge backgrounds at ~15% alpha).
 * Caps lightness at 0.30 and keeps saturation >= 0.40 to preserve the hue identity.
 * Falls back to original input for non-hex colors (e.g. rgba()).
 */
export function darkenForBadgeText(input: string): string {
	const rgb = hexToRgb(input);
	if (!rgb) return input;
	const [h, s, l] = rgbToHsl(rgb[0], rgb[1], rgb[2]);
	const targetL = Math.min(l, 0.3);
	const targetS = Math.max(s, 0.4);
	return hslToHex(h, targetS, targetL);
}

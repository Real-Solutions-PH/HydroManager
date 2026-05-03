import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { config } from "@/lib/config";

export function cn(...inputs: ClassValue[]): string {
	return twMerge(clsx(inputs));
}

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

		if (e.request || e.code === "ERR_NETWORK" || e.message === "Network Error") {
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
	return Number.isNaN(d.getTime()) ? "" : d.toLocaleDateString(undefined, options);
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

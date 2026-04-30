import Constants from "expo-constants";

const extra = Constants.expoConfig?.extra ?? {};

function readString(
	envValue: string | undefined,
	extraValue: unknown,
	fallback: string,
): string {
	if (envValue && envValue.length > 0) return envValue;
	if (typeof extraValue === "string" && extraValue.length > 0)
		return extraValue;
	return fallback;
}

export const config = {
	apiUrl: readString(
		process.env.EXPO_PUBLIC_API_URL,
		extra.apiUrl,
		"http://localhost:8000",
	),
} as const;

export type AppConfig = typeof config;

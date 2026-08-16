import axios, { type AxiosInstance } from "axios";
import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import { config } from "@/lib/config";
import { useAuthStore } from "@/stores/auth-store";

const ACCESS_TOKEN_KEY = "access_token";
const REFRESH_TOKEN_KEY = "refresh_token";

const isWeb = Platform.OS === "web";

const webStorage = {
	getItem(key: string): string | null {
		if (globalThis.window === undefined || !globalThis.localStorage)
			return null;
		return globalThis.localStorage.getItem(key);
	},
	setItem(key: string, value: string): void {
		if (globalThis.window === undefined || !globalThis.localStorage) return;
		globalThis.localStorage.setItem(key, value);
	},
	removeItem(key: string): void {
		if (globalThis.window === undefined || !globalThis.localStorage) return;
		globalThis.localStorage.removeItem(key);
	},
};

export const API_URL = config.apiUrl;

async function storageGet(key: string): Promise<string | null> {
	try {
		if (isWeb) return webStorage.getItem(key);
		return await SecureStore.getItemAsync(key);
	} catch {
		return null;
	}
}

async function storageSet(key: string, value: string): Promise<void> {
	if (isWeb) {
		webStorage.setItem(key, value);
		return;
	}
	await SecureStore.setItemAsync(key, value);
}

async function storageRemove(key: string): Promise<void> {
	if (isWeb) {
		webStorage.removeItem(key);
		return;
	}
	await SecureStore.deleteItemAsync(key);
}

export const getAccessToken = () => storageGet(ACCESS_TOKEN_KEY);
export const setAccessToken = (token: string) =>
	storageSet(ACCESS_TOKEN_KEY, token);
export const clearAccessToken = () => storageRemove(ACCESS_TOKEN_KEY);

export const getRefreshToken = () => storageGet(REFRESH_TOKEN_KEY);
export const setRefreshToken = (token: string) =>
	storageSet(REFRESH_TOKEN_KEY, token);
export const clearRefreshToken = () => storageRemove(REFRESH_TOKEN_KEY);

export async function clearTokens(): Promise<void> {
	await clearAccessToken();
	await clearRefreshToken();
}

export async function isLoggedIn(): Promise<boolean> {
	const token = await getAccessToken();
	return !!token;
}

let redirecting = false;

async function handleUnauthorized() {
	if (redirecting) return;
	redirecting = true;
	try {
		await clearTokens();
		useAuthStore.getState().clearAuth();
		router.replace("/login");
	} finally {
		setTimeout(() => {
			redirecting = false;
		}, 1000);
	}
}

// Single in-flight refresh so a burst of concurrent 401s triggers exactly one
// refresh call; all callers await the same promise.
let refreshPromise: Promise<string | null> | null = null;

async function performRefresh(): Promise<string | null> {
	const refreshToken = await getRefreshToken();
	if (!refreshToken) return null;
	try {
		// Bare axios (not the api instance) so this call can't recurse through
		// the response interceptor below.
		const { data } = await axios.post<{
			access_token: string;
			refresh_token: string;
		}>(`${API_URL}/api/v1/login/refresh-token`, {
			refresh_token: refreshToken,
		});
		await setAccessToken(data.access_token);
		await setRefreshToken(data.refresh_token);
		return data.access_token;
	} catch {
		return null;
	}
}

function refreshAccessToken(): Promise<string | null> {
	if (!refreshPromise) {
		refreshPromise = performRefresh().finally(() => {
			refreshPromise = null;
		});
	}
	return refreshPromise;
}

export function createApiClient(): AxiosInstance {
	const instance = axios.create({ baseURL: API_URL });

	instance.interceptors.request.use(async (config) => {
		const token = await getAccessToken();
		if (token) {
			config.headers.Authorization = `Bearer ${token}`;
		}
		return config;
	});

	instance.interceptors.response.use(
		(response) => response,
		async (error) => {
			const status = error?.response?.status;
			const originalRequest = error?.config;
			const url: string = originalRequest?.url ?? "";
			// Endpoints that must never trigger a refresh-retry: obtaining or
			// refreshing tokens. A 401 from these is terminal.
			const isAuthEndpoint =
				url.includes("/login/access-token") ||
				url.includes("/login/refresh-token") ||
				url.includes("/users/signup");

			if (
				status === 401 &&
				!isAuthEndpoint &&
				originalRequest &&
				!originalRequest._retry
			) {
				originalRequest._retry = true;
				const newToken = await refreshAccessToken();
				if (newToken) {
					originalRequest.headers = originalRequest.headers ?? {};
					originalRequest.headers.Authorization = `Bearer ${newToken}`;
					return instance(originalRequest);
				}
				// Refresh failed (no/expired refresh token) — clear and bounce.
				void handleUnauthorized();
			}
			return Promise.reject(error);
		},
	);

	return instance;
}

export const api = createApiClient();

import axios, { type AxiosInstance } from "axios";
import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import { config } from "@/lib/config";
import { useAuthStore } from "@/stores/auth-store";

const ACCESS_TOKEN_KEY = "access_token";

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

export async function getAccessToken(): Promise<string | null> {
	try {
		if (isWeb) return webStorage.getItem(ACCESS_TOKEN_KEY);
		return await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
	} catch {
		return null;
	}
}

export async function setAccessToken(token: string): Promise<void> {
	if (isWeb) {
		webStorage.setItem(ACCESS_TOKEN_KEY, token);
		return;
	}
	await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, token);
}

export async function clearAccessToken(): Promise<void> {
	if (isWeb) {
		webStorage.removeItem(ACCESS_TOKEN_KEY);
		return;
	}
	await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
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
		await clearAccessToken();
		useAuthStore.getState().clearAuth();
		router.replace("/login");
	} finally {
		setTimeout(() => {
			redirecting = false;
		}, 1000);
	}
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
		(error) => {
			const status = error?.response?.status;
			const url: string = error?.config?.url ?? "";
			const isLoginEndpoint =
				url.includes("/login/access-token") || url.includes("/users/signup");
			if ((status === 401 || status === 403) && !isLoginEndpoint) {
				void handleUnauthorized();
			}
			return Promise.reject(error);
		},
	);

	return instance;
}

export const api = createApiClient();

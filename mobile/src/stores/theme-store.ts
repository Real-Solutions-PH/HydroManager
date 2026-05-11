import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { mmkvStorage } from "@/lib/storage";

export type ThemeMode = "system" | "light" | "dark";

interface ThemeState {
	mode: ThemeMode;
	setMode: (mode: ThemeMode) => void;
}

export const useThemeStore = create<ThemeState>()(
	persist(
		(set) => ({
			mode: "system",
			setMode: (mode) => set({ mode }),
		}),
		{
			name: "theme-store",
			storage: createJSONStorage(() => mmkvStorage),
		},
	),
);

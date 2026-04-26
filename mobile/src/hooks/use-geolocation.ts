import * as Location from "expo-location";
import { useCallback, useEffect, useState } from "react";

export interface Coords {
	lat: number;
	lon: number;
}

export interface GeolocationState {
	coords: Coords | null;
	error: string | null;
	status: "idle" | "requesting" | "ready" | "denied" | "error";
	refresh: () => Promise<void>;
}

export function useGeolocation(auto: boolean = true): GeolocationState {
	const [coords, setCoords] = useState<Coords | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [status, setStatus] = useState<GeolocationState["status"]>("idle");

	const refresh = useCallback(async () => {
		setStatus("requesting");
		setError(null);
		try {
			const { status: perm } = await Location.requestForegroundPermissionsAsync();
			if (perm !== "granted") {
				setStatus("denied");
				setError("Location permission denied");
				return;
			}
			const pos = await Location.getCurrentPositionAsync({
				accuracy: Location.Accuracy.Balanced,
			});
			setCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude });
			setStatus("ready");
		} catch (e) {
			setStatus("error");
			setError(e instanceof Error ? e.message : "Failed to get location");
		}
	}, []);

	useEffect(() => {
		if (auto) refresh();
	}, [auto, refresh]);

	return { coords, error, status, refresh };
}

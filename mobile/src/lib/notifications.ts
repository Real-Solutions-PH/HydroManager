import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import type { Task } from "@/lib/hydro-api";
import { mmkv } from "@/lib/storage";

const MAP_KEY = "hydro-task-notif-map";
const isNative = Platform.OS !== "web";

/** Foreground display behavior. Call once at app start (no-op on web). */
export function configureNotificationHandler(): void {
	if (!isNative) return;
	Notifications.setNotificationHandler({
		handleNotification: async () => ({
			shouldShowAlert: true,
			shouldPlaySound: false,
			shouldSetBadge: false,
		}),
	});
}

/** Ask for notification permission once. Returns whether it is granted. */
export async function ensureNotificationPermission(): Promise<boolean> {
	if (!isNative) return false;
	const current = await Notifications.getPermissionsAsync();
	if (current.granted) return true;
	if (!current.canAskAgain) return false;
	const requested = await Notifications.requestPermissionsAsync();
	return requested.granted;
}

function loadMap(): Record<string, string> {
	try {
		const raw = mmkv.getString(MAP_KEY);
		return raw ? (JSON.parse(raw) as Record<string, string>) : {};
	} catch {
		return {};
	}
}

function saveMap(map: Record<string, string>): void {
	mmkv.set(MAP_KEY, JSON.stringify(map));
}

/**
 * Reconcile scheduled local reminders with the current task list. Cancels the
 * app's previously scheduled task notifications and reschedules one per active
 * task with a future due date. Local-only; no-op on web.
 */
export async function syncTaskReminders(tasks: Task[]): Promise<void> {
	if (!isNative) return;

	const previous = loadMap();
	await Promise.all(
		Object.values(previous).map((id) =>
			Notifications.cancelScheduledNotificationAsync(id).catch(() => undefined),
		),
	);

	const next: Record<string, string> = {};
	const now = Date.now();
	for (const task of tasks) {
		if (task.completed_at || !task.due_at) continue;
		const when = new Date(task.due_at).getTime();
		if (Number.isNaN(when) || when <= now) continue;
		try {
			const notifId = await Notifications.scheduleNotificationAsync({
				content: {
					title: task.title,
					body: task.body ?? "Task due",
					sound: true,
				},
				trigger: {
					type: Notifications.SchedulableTriggerInputTypes.DATE,
					date: new Date(when),
				},
			});
			next[task.id] = notifId;
		} catch {
			// scheduling failures (e.g. permission revoked) are non-fatal
		}
	}
	saveMap(next);
}

import { useEffect, useState } from "react";
import { Platform, Pressable, View } from "react-native";
import { Text } from "@/components/ui/text";
import { radii, spacing, useThemeColors } from "@/constants/theme";

type BeforeInstallPromptEvent = Event & {
	prompt: () => Promise<void>;
	userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const DISMISS_KEY = "pwa-install-dismissed-at";
const COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000;

function isStandalone(): boolean {
	if (typeof window === "undefined") return false;
	if (window.matchMedia?.("(display-mode: standalone)").matches) return true;
	// iOS Safari legacy flag
	return (window.navigator as { standalone?: boolean }).standalone === true;
}

function isIOS(): boolean {
	if (typeof navigator === "undefined") return false;
	return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function isMobile(): boolean {
	if (typeof navigator === "undefined") return false;
	return /android|iphone|ipad|ipod|mobile/i.test(navigator.userAgent);
}

function recentlyDismissed(): boolean {
	if (typeof localStorage === "undefined") return false;
	const raw = localStorage.getItem(DISMISS_KEY);
	if (!raw) return false;
	const ts = Number(raw);
	if (!Number.isFinite(ts)) return false;
	return Date.now() - ts < COOLDOWN_MS;
}

function markDismissed() {
	try {
		localStorage.setItem(DISMISS_KEY, String(Date.now()));
	} catch {}
}

export function PwaInstallPrompt() {
	const colors = useThemeColors();
	const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(
		null,
	);
	const [iosVisible, setIosVisible] = useState(false);

	useEffect(() => {
		if (Platform.OS !== "web") return;
		if (isStandalone()) return;
		if (recentlyDismissed()) return;

		const onBeforeInstall = (e: Event) => {
			e.preventDefault();
			setDeferred(e as BeforeInstallPromptEvent);
		};

		const onInstalled = () => {
			setDeferred(null);
			setIosVisible(false);
		};

		window.addEventListener("beforeinstallprompt", onBeforeInstall);
		window.addEventListener("appinstalled", onInstalled);

		if (isIOS() && isMobile()) {
			setIosVisible(true);
		}

		return () => {
			window.removeEventListener("beforeinstallprompt", onBeforeInstall);
			window.removeEventListener("appinstalled", onInstalled);
		};
	}, []);

	if (Platform.OS !== "web") return null;

	const handleInstall = async () => {
		if (!deferred) return;
		try {
			await deferred.prompt();
			await deferred.userChoice;
		} catch {}
		setDeferred(null);
	};

	const handleDismiss = () => {
		markDismissed();
		setDeferred(null);
		setIosVisible(false);
	};

	const show = deferred !== null || iosVisible;
	if (!show) return null;

	const message = deferred
		? "Install Bot-choy for quick access"
		: "Add Bot-choy to your Home Screen: tap Share, then 'Add to Home Screen'";

	return (
		<View
			style={{
				position: "absolute",
				left: spacing.md,
				right: spacing.md,
				bottom: spacing.lg,
				backgroundColor: colors.surface,
				borderRadius: radii.lg,
				borderWidth: 1,
				borderColor: colors.border,
				padding: spacing.md,
				flexDirection: "row",
				alignItems: "center",
				gap: spacing.sm,
				shadowColor: "#000",
				shadowOpacity: 0.15,
				shadowRadius: 12,
				shadowOffset: { width: 0, height: 4 },
				elevation: 6,
				zIndex: 9999,
			}}
		>
			<View style={{ flex: 1 }}>
				<Text size="sm" style={{ color: colors.text, fontWeight: "600" }}>
					{message}
				</Text>
			</View>
			{deferred ? (
				<Pressable
					onPress={handleInstall}
					style={{
						backgroundColor: colors.buttonSolidBg,
						paddingHorizontal: spacing.md,
						paddingVertical: spacing.xs,
						borderRadius: radii.md,
					}}
				>
					<Text size="sm" style={{ color: "#FFFFFF", fontWeight: "600" }}>
						Install
					</Text>
				</Pressable>
			) : null}
			<Pressable
				onPress={handleDismiss}
				accessibilityLabel="Dismiss install prompt"
				style={{
					paddingHorizontal: spacing.sm,
					paddingVertical: spacing.xs,
				}}
			>
				<Text size="sm" style={{ color: colors.textSecondary }}>
					✕
				</Text>
			</Pressable>
		</View>
	);
}

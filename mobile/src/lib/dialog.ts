import { Alert, Platform } from "react-native";

type ConfirmOpts = {
	title: string;
	message?: string;
	confirmLabel?: string;
	cancelLabel?: string;
	destructive?: boolean;
	onConfirm: () => void;
	onCancel?: () => void;
};

export function confirmDialog({
	title,
	message,
	confirmLabel = "OK",
	cancelLabel = "Cancel",
	destructive = false,
	onConfirm,
	onCancel,
}: ConfirmOpts) {
	if (Platform.OS === "web") {
		const text = message ? `${title}\n\n${message}` : title;
		if (typeof window !== "undefined" && window.confirm(text)) {
			onConfirm();
		} else {
			onCancel?.();
		}
		return;
	}
	Alert.alert(title, message, [
		{ text: cancelLabel, style: "cancel", onPress: onCancel },
		{
			text: confirmLabel,
			style: destructive ? "destructive" : "default",
			onPress: onConfirm,
		},
	]);
}

export function alertDialog(title: string, message?: string) {
	if (Platform.OS === "web") {
		const text = message ? `${title}\n\n${message}` : title;
		if (typeof window !== "undefined") window.alert(text);
		return;
	}
	Alert.alert(title, message);
}

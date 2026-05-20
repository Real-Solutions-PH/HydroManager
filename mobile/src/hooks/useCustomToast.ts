import { toast } from "sonner-native";

export function useCustomToast() {
	return {
		success: (message: string) => toast.success(message),
		error: (message: string) => toast.error(message),
		info: (message: string) => toast(message),
		errorWithRetry: (message: string, onRetry: () => void) =>
			toast.error(message, {
				action: { label: "Retry", onClick: onRetry },
			}),
	};
}

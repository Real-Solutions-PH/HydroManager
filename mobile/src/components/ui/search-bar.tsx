import { Ionicons } from "@expo/vector-icons";
import { TextInput, View } from "react-native";
import { colors } from "@/constants/theme";

interface Props {
	value: string;
	onChangeText: (v: string) => void;
	placeholder?: string;
}

export function SearchBar({
	value,
	onChangeText,
	placeholder = "Search",
}: Props) {
	return (
		<View
			style={{
				flexDirection: "row",
				alignItems: "center",
				backgroundColor: colors.glass,
				borderWidth: 1,
				borderColor: colors.borderLight,
				borderRadius: 12,
				paddingHorizontal: 16,
				paddingVertical: 12,
			}}
		>
			<Ionicons
				name="search"
				size={18}
				color={colors.textMuted}
				style={{ marginRight: 8 }}
			/>
			<TextInput
				value={value}
				onChangeText={onChangeText}
				placeholder={placeholder}
				placeholderTextColor={colors.placeholder}
				style={{ flex: 1, fontSize: 15, color: colors.text }}
			/>
		</View>
	);
}

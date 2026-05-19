import { Image, Pressable, Text as RNText, View } from "react-native";
import { Text } from "@/components/ui/text";
import { useThemeColors } from "@/constants/theme";
import type { InventoryItem } from "@/lib/hydro-api";

export const PACKET_SIZE = 84;
export const PACKET_TOTAL_HEIGHT = PACKET_SIZE + 36; // cell + name caption

export function SeedPacketCell({
	item,
	imageUrl,
	onPress,
}: {
	item: InventoryItem;
	imageUrl?: string | null;
	onPress: () => void;
}) {
	const colors = useThemeColors();
	const low = item.is_low_stock;
	const expiring =
		item.expiry_status === "warning" || item.expiry_status === "expired";
	const bg = low ? colors.warningLight : colors.glass;
	const border = expiring ? colors.warning : colors.border;
	const emoji = emojiFor(item.name);
	const caption = shortName(item.name);
	return (
		<View style={{ width: PACKET_SIZE, alignItems: "center", gap: 4 }}>
			<Pressable
				onPress={onPress}
				style={({ pressed }) => ({
					width: PACKET_SIZE,
					height: PACKET_SIZE,
					borderRadius: 10,
					borderWidth: 2,
					borderColor: border,
					backgroundColor: bg,
					alignItems: "center",
					justifyContent: "center",
					opacity: pressed ? 0.7 : 1,
				})}
			>
				{imageUrl ? (
					<Image
						source={{ uri: imageUrl }}
						style={{ width: 48, height: 48, borderRadius: 6 }}
					/>
				) : (
					<RNText style={{ fontSize: 36, lineHeight: 42 }}>{emoji}</RNText>
				)}
				<View
					style={{
						position: "absolute",
						bottom: 2,
						right: 2,
						minWidth: 24,
						paddingHorizontal: 4,
						paddingVertical: 1,
						borderRadius: 6,
						backgroundColor: "rgba(0,0,0,0.7)",
						alignItems: "center",
					}}
				>
					<Text
						size="xs"
						weight="bold"
						style={{ color: "#FFFFFF" }}
						numberOfLines={1}
					>
						{formatQty(item.current_stock)}
					</Text>
				</View>
			</Pressable>
			<Text
				size="xs"
				weight="semibold"
				numberOfLines={2}
				style={{
					textAlign: "center",
					lineHeight: 13,
					color: colors.text,
				}}
			>
				{caption}
			</Text>
		</View>
	);
}

function formatQty(n: number): string {
	if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
	return `${Math.floor(n)}`;
}

// Strip vendor/brand tags in parens and truncate.
function shortName(name: string, max = 22): string {
	const stripped = name.replace(/\s*\([^)]*\)\s*/g, " ").replace(/\s+/g, " ").trim();
	if (stripped.length <= max) return stripped;
	return `${stripped.slice(0, max - 1)}…`;
}

// Match crop keywords in the item name to a representative emoji.
// Order matters: more specific patterns first.
function emojiFor(name: string): string {
	const n = name.toLowerCase();
	if (/tomato|cherry/.test(n)) return "🍅";
	if (/bell\s*pepper|capsicum/.test(n)) return "🫑";
	if (/chili|chilli|siling|panigang/.test(n)) return "🌶️";
	if (/eggplant|talong/.test(n)) return "🍆";
	if (/cucumber|pipino/.test(n)) return "🥒";
	if (/melon|fujisawa|honeydew|cantaloupe/.test(n)) return "🍈";
	if (/lettuce|olmetie|romaine/.test(n)) return "🥬";
	if (/pechay|bok\s*choi|chinese\s*kale|kangkong|spinach|kale/.test(n))
		return "🥬";
	if (/basil/.test(n)) return "🌿";
	if (/ampalaya|bitter/.test(n)) return "🥒";
	if (/okra/.test(n)) return "🌱";
	if (/patola|loofah/.test(n)) return "🥒";
	if (/onion/.test(n)) return "🧅";
	if (/garlic/.test(n)) return "🧄";
	if (/carrot/.test(n)) return "🥕";
	if (/corn|mais/.test(n)) return "🌽";
	// Rijk Zwaan (RZ) varieties are typically tomato/pepper hybrids; default
	// to seedling since we can't disambiguate without a crop_guide link.
	return "🌱";
}

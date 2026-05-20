import { Image, Pressable, Text as RNText, View } from "react-native";
import { Text } from "@/components/ui/text";
import { useThemeColors } from "@/constants/theme";
import type { InventoryItem } from "@/lib/hydro-api";

export const PACKET_MIN_SIZE = 72;
export const PACKET_MAX_SIZE = 96;
export const PACKET_DEFAULT_SIZE = 84;
export const PACKET_CAPTION_HEIGHT = 36;
export const PACKET_TOTAL_HEIGHT = PACKET_DEFAULT_SIZE + PACKET_CAPTION_HEIGHT;
// Back-compat alias.
export const PACKET_SIZE = PACKET_DEFAULT_SIZE;

export function SeedPacketCell({
	item,
	imageUrl,
	onPress,
	size = PACKET_DEFAULT_SIZE,
}: {
	item: InventoryItem;
	imageUrl?: string | null;
	onPress: () => void;
	size?: number;
}) {
	const colors = useThemeColors();
	const low = item.is_low_stock;
	const expiring =
		item.expiry_status === "warning" || item.expiry_status === "expired";
	const bg = low ? colors.warningLight : colors.glass;
	const border = expiring ? colors.warning : colors.border;
	const emoji = emojiFor(item.name);
	const caption = shortName(item.name);
	const iconSize = Math.round(size * 0.57);
	const emojiFont = Math.round(size * 0.43);
	const emojiLine = Math.round(emojiFont * 1.17);
	const badgeMin = Math.max(20, Math.round(size * 0.29));
	const badgePadH = size < 80 ? 3 : 4;
	return (
		<View style={{ width: size, alignItems: "center", gap: 4 }}>
			<Pressable
				onPress={onPress}
				style={({ pressed }) => ({
					width: size,
					height: size,
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
						style={{ width: iconSize, height: iconSize, borderRadius: 6 }}
					/>
				) : (
					<RNText style={{ fontSize: emojiFont, lineHeight: emojiLine }}>
						{emoji}
					</RNText>
				)}
				<View
					style={{
						position: "absolute",
						bottom: 2,
						right: 2,
						minWidth: badgeMin,
						paddingHorizontal: badgePadH,
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
export function shortName(name: string, max = 22): string {
	const stripped = name.replace(/\s*\([^)]*\)\s*/g, " ").replace(/\s+/g, " ").trim();
	if (stripped.length <= max) return stripped;
	return `${stripped.slice(0, max - 1)}…`;
}

// Match crop keywords in the item name to a representative emoji.
// Order matters: more specific patterns first.
export function emojiFor(name: string): string {
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

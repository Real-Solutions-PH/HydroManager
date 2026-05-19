import { Ionicons } from "@expo/vector-icons";
import { Image, Pressable, View } from "react-native";
import { Text } from "@/components/ui/text";
import { useThemeColors } from "@/constants/theme";
import type { InventoryItem } from "@/lib/hydro-api";

export const PACKET_SIZE = 84;

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
    return (
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
                <Ionicons name="leaf" size={36} color={colors.primaryLight} />
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
    );
}

function formatQty(n: number): string {
    if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
    return `${Math.floor(n)}`;
}

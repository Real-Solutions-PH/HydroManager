import { Ionicons } from "@expo/vector-icons";
import { Pressable, View } from "react-native";
import { Text } from "@/components/ui/text";
import { spacing, useThemeColors } from "@/constants/theme";

export function SeedBankHandle({
    count,
    bottomOffset,
    onPress,
}: {
    count: number;
    bottomOffset: number;
    onPress: () => void;
}) {
    const colors = useThemeColors();
    return (
        <Pressable
            onPress={onPress}
            style={({ pressed }) => ({
                position: "absolute",
                left: spacing.md,
                right: spacing.md,
                bottom: bottomOffset,
                paddingVertical: 10,
                paddingHorizontal: spacing.md,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: colors.border,
                backgroundColor: pressed ? colors.glassHover : colors.surface,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: spacing.xs,
                shadowColor: "#000",
                shadowOpacity: 0.1,
                shadowRadius: 8,
                shadowOffset: { width: 0, height: -2 },
                elevation: 6,
            })}
        >
            <View
                style={{
                    width: 32,
                    height: 4,
                    borderRadius: 2,
                    backgroundColor: colors.border,
                    position: "absolute",
                    top: 4,
                    alignSelf: "center",
                }}
            />
            <Ionicons name="leaf" size={16} color={colors.primaryLight} />
            <Text weight="semibold">Seed Bank</Text>
            <Text tone="muted">· {count} pack{count === 1 ? "" : "s"}</Text>
        </Pressable>
    );
}

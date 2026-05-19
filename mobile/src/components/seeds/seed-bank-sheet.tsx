import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import { Modal, Pressable, ScrollView, View } from "react-native";
import { SearchBar } from "@/components/ui/search-bar";
import { Text } from "@/components/ui/text";
import { spacing, useThemeColors } from "@/constants/theme";
import { type CropGuide, type InventoryItem, inventoryApi } from "@/lib/hydro-api";
import { QK, STALE } from "@/lib/query-config";
import { SeedPacketCell } from "./seed-packet-cell";

type Sort = "name" | "qty" | "expiry";

export function SeedBankSheet({
    open,
    onClose,
    onSelect,
    cropsByName,
}: {
    open: boolean;
    onClose: () => void;
    onSelect: (item: InventoryItem) => void;
    cropsByName: Map<string, CropGuide>;
}) {
    const colors = useThemeColors();
    const [query, setQuery] = useState("");
    const [sort, setSort] = useState<Sort>("name");

    const seedsQ = useQuery({
        queryKey: [...QK.inventory.lists(), "seeds"],
        queryFn: () => inventoryApi.list({ category: "seeds", limit: 500 }),
        staleTime: STALE.inventory,
    });

    const items = useMemo(() => {
        const data = seedsQ.data?.data ?? [];
        const q = query.trim().toLowerCase();
        const filtered = q
            ? data.filter((d) => d.name.toLowerCase().includes(q))
            : data;
        const sorted = [...filtered].sort((a, b) => {
            if (sort === "qty") return b.current_stock - a.current_stock;
            if (sort === "expiry") {
                const ax = a.expiry_date ?? "9999-12-31";
                const bx = b.expiry_date ?? "9999-12-31";
                return ax.localeCompare(bx);
            }
            return a.name.localeCompare(b.name);
        });
        return sorted;
    }, [seedsQ.data, query, sort]);

    return (
        <Modal
            visible={open}
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >
            <Pressable style={{ flex: 1 }} onPress={onClose} />
            <View
                style={{
                    position: "absolute",
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: colors.bg,
                    borderTopLeftRadius: 24,
                    borderTopRightRadius: 24,
                    paddingTop: spacing.sm,
                    paddingHorizontal: spacing.md,
                    paddingBottom: spacing.xxl,
                    maxHeight: "82%",
                    borderTopWidth: 1,
                    borderColor: colors.border,
                }}
            >
                <View style={{ alignItems: "center", marginBottom: spacing.xs }}>
                    <View
                        style={{
                            width: 44,
                            height: 4,
                            borderRadius: 2,
                            backgroundColor: colors.border,
                        }}
                    />
                </View>
                <View
                    style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: spacing.sm,
                    }}
                >
                    <Text size="xl" weight="bold">
                        Seed Bank
                    </Text>
                    <Pressable
                        onPress={() => {
                            onClose();
                            router.push("/seeds/new");
                        }}
                        style={({ pressed }) => ({
                            flexDirection: "row",
                            alignItems: "center",
                            gap: spacing.xxs,
                            paddingHorizontal: spacing.sm,
                            paddingVertical: 8,
                            borderRadius: 999,
                            backgroundColor: pressed
                                ? colors.buttonSolidActive
                                : colors.buttonSolidBg,
                        })}
                    >
                        <Ionicons name="add" size={16} color="#FFFFFF" />
                        <Text weight="semibold" style={{ color: "#FFFFFF" }}>
                            Add Seed
                        </Text>
                    </Pressable>
                </View>

                <SearchBar
                    value={query}
                    onChangeText={setQuery}
                    placeholder="Search seeds..."
                />

                <View
                    style={{
                        flexDirection: "row",
                        gap: spacing.xs,
                        marginTop: spacing.xs,
                        marginBottom: spacing.sm,
                    }}
                >
                    {(["name", "qty", "expiry"] as const).map((s) => (
                        <Pressable
                            key={s}
                            onPress={() => setSort(s)}
                            style={({ pressed }) => ({
                                paddingHorizontal: spacing.sm,
                                paddingVertical: 4,
                                borderRadius: 999,
                                backgroundColor:
                                    sort === s ? colors.primaryLight : colors.glass,
                                opacity: pressed ? 0.7 : 1,
                            })}
                        >
                            <Text
                                size="xs"
                                weight="semibold"
                                style={{
                                    color: sort === s ? "#FFFFFF" : colors.text,
                                    textTransform: "capitalize",
                                }}
                            >
                                {s}
                            </Text>
                        </Pressable>
                    ))}
                </View>

                <ScrollView contentContainerStyle={{ paddingBottom: spacing.lg }}>
                    {seedsQ.isLoading ? (
                        <Text tone="muted">Loading seeds...</Text>
                    ) : seedsQ.isError ? (
                        <View style={{ alignItems: "center", padding: spacing.xl }}>
                            <Ionicons
                                name="alert-circle-outline"
                                size={48}
                                color={colors.error}
                            />
                            <Text
                                tone="muted"
                                style={{ marginTop: spacing.sm, textAlign: "center" }}
                            >
                                Failed to load seeds. {seedsQ.error?.message ?? ""}
                            </Text>
                        </View>
                    ) : items.length === 0 ? (
                        <View style={{ alignItems: "center", padding: spacing.xl }}>
                            <Ionicons
                                name="leaf-outline"
                                size={48}
                                color={colors.textMuted}
                            />
                            <Text tone="muted" style={{ marginTop: spacing.sm }}>
                                No seeds yet. Tap "Add Seed" to start.
                            </Text>
                        </View>
                    ) : (
                        <View
                            style={{
                                flexDirection: "row",
                                flexWrap: "wrap",
                                gap: spacing.sm,
                            }}
                        >
                            {items.map((item) => (
                                <SeedPacketCell
                                    key={item.id}
                                    item={item}
                                    imageUrl={
                                        cropsByName.get(item.name.toLowerCase())
                                            ?.image_url ?? null
                                    }
                                    onPress={() => onSelect(item)}
                                />
                            ))}
                        </View>
                    )}
                </ScrollView>
            </View>
        </Modal>
    );
}

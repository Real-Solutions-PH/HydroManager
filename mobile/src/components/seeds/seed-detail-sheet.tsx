import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { useState } from "react";
import {
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    View,
} from "react-native";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { spacing, useThemeColors } from "@/constants/theme";
import { alertDialog } from "@/lib/dialog";
import { type InventoryItem, inventoryApi } from "@/lib/hydro-api";
import { QK } from "@/lib/query-config";

type Mode = "view" | "restock";

export function SeedDetailSheet({
    item,
    onClose,
}: {
    item: InventoryItem | null;
    onClose: () => void;
}) {
    const colors = useThemeColors();
    const qc = useQueryClient();
    const [mode, setMode] = useState<Mode>("view");
    const [restockQty, setRestockQty] = useState("");
    const [restockCost, setRestockCost] = useState("");

    const movementsQ = useQuery({
        queryKey: item ? QK.inventory.movements(item.id) : ["noop"],
        queryFn: () =>
            item ? inventoryApi.movements(item.id) : Promise.resolve([]),
        enabled: !!item,
    });

    const restock = useMutation({
        mutationFn: () => {
            if (!item) throw new Error("no item");
            const qty = Number.parseFloat(restockQty);
            const cost = restockCost ? Number.parseFloat(restockCost) : undefined;
            if (!Number.isFinite(qty) || qty <= 0) throw new Error("Invalid qty");
            return inventoryApi.restock(item.id, {
                quantity: qty,
                cost_total: cost,
            });
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: QK.inventory.all });
            setMode("view");
            setRestockQty("");
            setRestockCost("");
        },
        onError: (e: Error) => alertDialog("Error", e.message),
    });

    if (!item) return null;

    return (
        <Modal
            visible
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <Pressable
                style={{
                    flex: 1,
                    backgroundColor: "rgba(0,0,0,0.45)",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: spacing.md,
                }}
                onPress={onClose}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : undefined}
                    style={{ width: "100%", maxWidth: 480 }}
                >
                    <Pressable
                        onPress={(e) => e.stopPropagation()}
                        style={{
                            backgroundColor: colors.bg,
                            borderRadius: 20,
                            padding: spacing.md,
                            borderWidth: 1,
                            borderColor: colors.border,
                            gap: spacing.sm,
                            maxHeight: "82%",
                        }}
                    >
                    <View
                        style={{
                            flexDirection: "row",
                            justifyContent: "space-between",
                            alignItems: "center",
                        }}
                    >
                        <Text size="lg" weight="bold">
                            {item.name}
                        </Text>
                        <Pressable onPress={onClose} hitSlop={10}>
                            <Ionicons name="close" size={24} color={colors.text} />
                        </Pressable>
                    </View>

                    <View
                        style={{
                            flexDirection: "row",
                            flexWrap: "wrap",
                            gap: spacing.sm,
                        }}
                    >
                        <Stat label="STOCK" value={`${item.current_stock} ${item.unit}`} />
                        <Stat
                            label="UNIT COST"
                            value={
                                item.unit_cost != null
                                    ? `₱${item.unit_cost.toFixed(2)}`
                                    : "—"
                            }
                        />
                        <Stat label="EXPIRES" value={item.expiry_date ?? "—"} />
                    </View>

                    {mode === "view" ? (
                        <>
                            <ScrollView style={{ maxHeight: 180 }}>
                                <Text size="xs" weight="semibold" tone="subtle">
                                    RECENT MOVEMENTS
                                </Text>
                                {(movementsQ.data ?? []).slice(0, 5).map((m) => (
                                    <Text key={m.id} size="sm" tone="muted">
                                        {m.movement_type} · {m.quantity} ·{" "}
                                        {new Date(m.occurred_at).toLocaleDateString()}
                                    </Text>
                                ))}
                            </ScrollView>

                            <View style={{ flexDirection: "row", gap: spacing.xs }}>
                                <View style={{ flex: 1 }}>
                                    <Button
                                        label="Plant"
                                        onPress={() => {
                                            onClose();
                                            router.push(`/batch/new?seed=${item.id}`);
                                        }}
                                    />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Button
                                        variant="ghost"
                                        label="Restock"
                                        onPress={() => setMode("restock")}
                                    />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Button
                                        variant="ghost"
                                        label="Edit"
                                        onPress={() => {
                                            onClose();
                                            router.push(`/inventory/${item.id}`);
                                        }}
                                    />
                                </View>
                            </View>
                        </>
                    ) : (
                        <>
                            <Input
                                placeholder="Quantity"
                                keyboardType="numeric"
                                value={restockQty}
                                onChangeText={setRestockQty}
                            />
                            <Input
                                placeholder="Total cost (optional)"
                                keyboardType="numeric"
                                value={restockCost}
                                onChangeText={setRestockCost}
                            />
                            <View style={{ flexDirection: "row", gap: spacing.xs }}>
                                <View style={{ flex: 1 }}>
                                    <Button
                                        label="Confirm Restock"
                                        isLoading={restock.isPending}
                                        onPress={() => restock.mutate()}
                                    />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Button
                                        variant="ghost"
                                        label="Cancel"
                                        onPress={() => setMode("view")}
                                    />
                                </View>
                            </View>
                        </>
                    )}
                    </Pressable>
                </KeyboardAvoidingView>
            </Pressable>
        </Modal>
    );
}

function Stat({ label, value }: { label: string; value: string }) {
    return (
        <View style={{ minWidth: 90 }}>
            <Text size="xs" weight="semibold" tone="subtle">
                {label}
            </Text>
            <Text weight="semibold">{value}</Text>
        </View>
    );
}

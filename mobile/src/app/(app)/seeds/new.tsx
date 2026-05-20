import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Combobox, type ComboboxOption } from "@/components/ui/combobox";
import { DatePicker } from "@/components/ui/date-picker";
import { GradientBackground } from "@/components/ui/gradient-background";
import { Input } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { spacing, useThemeColors } from "@/constants/theme";
import { useBack } from "@/hooks/use-back";
import { alertDialog } from "@/lib/dialog";
import { cropsApi, inventoryApi } from "@/lib/hydro-api";
import { QK, STALE } from "@/lib/query-config";

export default function NewSeedScreen() {
    const colors = useThemeColors();
    const qc = useQueryClient();
    const goBack = useBack();

    const cropsQ = useQuery({
        queryKey: QK.crops(),
        queryFn: () => cropsApi.list(),
        staleTime: STALE.crops,
    });

    const [name, setName] = useState("");
    const [cropId, setCropId] = useState<string | null>(null);
    const [qty, setQty] = useState("");
    const [unitCost, setUnitCost] = useState("");
    const [expiry, setExpiry] = useState<string | null>(null);
    const [lowThreshold, setLowThreshold] = useState("0");
    const [notes, setNotes] = useState("");

    const cropOptions: ComboboxOption[] = (cropsQ.data?.data ?? []).map((c) => ({
        value: c.id,
        label: c.name_en,
        subtitle: c.name_tl || c.category,
    }));

    const create = useMutation({
        mutationFn: async () => {
            const qtyN = Number.parseFloat(qty);
            const costN = unitCost ? Number.parseFloat(unitCost) : null;
            if (!Number.isFinite(qtyN) || qtyN <= 0) throw new Error("Quantity required");
            const item = await inventoryApi.create({
                name: name.trim(),
                category: "seeds",
                unit: "pieces",
                current_stock: qtyN,
                low_stock_threshold: Number.parseFloat(lowThreshold) || 0,
                unit_cost: costN,
                expiry_date: expiry,
                notes: notes.trim() || undefined,
            });
            if (costN != null) {
                await inventoryApi.restock(item.id, {
                    quantity: 0,
                    cost_total: qtyN * costN,
                });
            }
            return item;
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: QK.inventory.all });
            goBack();
        },
        onError: (e: Error) => alertDialog("Error", e.message),
    });

    const valid = name.trim().length > 0 && Number.parseFloat(qty) > 0;

    return (
        <GradientBackground>
            <ScrollView
                contentContainerStyle={{ padding: spacing.md, paddingBottom: spacing.xxxl }}
                keyboardShouldPersistTaps="handled"
            >
                <View
                    style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: spacing.xs,
                        marginBottom: spacing.xs,
                    }}
                >
                    <Pressable onPress={goBack}>
                        <Ionicons name="arrow-back" size={24} color={colors.text} />
                    </Pressable>
                    <Text size="xxl" weight="bold">
                        Add Seed
                    </Text>
                </View>

                <Card>
                    <Field label="Crop (Optional)">
                        <Combobox
                            value={cropId}
                            onValueChange={(v, opt) => {
                                setCropId(v);
                                if (opt && !name) setName(opt.label);
                            }}
                            options={cropOptions}
                            placeholder="Pick a crop"
                            allowClear
                        />
                    </Field>
                    <Field label="Name">
                        <Input value={name} onChangeText={setName} placeholder="e.g. Lettuce Grand Rapids" />
                    </Field>
                    <Field label="Quantity (pieces)">
                        <Input value={qty} onChangeText={setQty} keyboardType="numeric" />
                    </Field>
                    <Field label="Unit Cost (₱, optional)">
                        <Input value={unitCost} onChangeText={setUnitCost} keyboardType="numeric" />
                    </Field>
                    <Field label="Expiry Date (optional)">
                        <DatePicker value={expiry} onChange={setExpiry} placeholder="None" />
                    </Field>
                    <Field label="Low-stock threshold">
                        <Input value={lowThreshold} onChangeText={setLowThreshold} keyboardType="numeric" />
                    </Field>
                    <Field label="Notes">
                        <Input value={notes} onChangeText={setNotes} multiline placeholder="Optional" />
                    </Field>
                </Card>

                <View style={{ marginTop: spacing.lg, gap: spacing.xs }}>
                    <Button
                        label="Save Seed"
                        isDisabled={!valid || create.isPending}
                        isLoading={create.isPending}
                        onPress={() => create.mutate()}
                    />
                    <Button variant="ghost" label="Cancel" onPress={goBack} />
                </View>
            </ScrollView>
        </GradientBackground>
    );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <View style={{ gap: 6, marginBottom: spacing.md }}>
            <Text
                size="xs"
                weight="semibold"
                tone="subtle"
                style={{ textTransform: "uppercase", letterSpacing: 0.5 }}
            >
                {label}
            </Text>
            {children}
        </View>
    );
}

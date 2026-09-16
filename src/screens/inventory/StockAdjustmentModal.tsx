import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Product, StockMovementType } from "../../database/types";
import { LedgerColors } from "../../theme/colors";
import { Button } from "../../components/common/Button";
import { productRepository } from "../../repositories/productRepository";

interface StockAdjustmentModalProps {
  visible: boolean;
  product: Product | null;
  initialMode?: "purchase" | "correction";
  onClose: () => void;
  onSaved: () => void;
}

const CORRECTION_REASONS = [
  "Physical Count Discrepancy",
  "Damaged / Defective Goods",
  "Expired / Obsolete",
  "Customer Return",
  "Supplier Return",
];

export const StockAdjustmentModal: React.FC<StockAdjustmentModalProps> = ({
  visible,
  product,
  initialMode = "purchase",
  onClose,
  onSaved,
}) => {
  const [mode, setMode] = useState<StockMovementType>(initialMode);
  const [qty, setQty] = useState("");
  const [newCostPrice, setNewCostPrice] = useState("");
  const [note, setNote] = useState("");
  const [isNegative, setIsNegative] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible && product) {
      setMode(initialMode);
      setQty("");
      setNewCostPrice(String(product.cost_price));
      setNote("");
      setIsNegative(false);
    }
  }, [visible, product, initialMode]);

  if (!product) return null;

  const handleSave = async () => {
    const qtyNum = parseInt(qty, 10);
    if (isNaN(qtyNum) || qtyNum <= 0) {
      Alert.alert(
        "Invalid Quantity",
        "Please enter a valid quantity greater than zero.",
      );
      return;
    }

    const finalDelta = mode === "correction" && isNegative ? -qtyNum : qtyNum;

    if (mode === "correction" && !note.trim()) {
      Alert.alert(
        "Reason Required",
        "Please enter or select a reason for stock correction.",
      );
      return;
    }

    const updatedCost =
      mode === "purchase" && newCostPrice
        ? parseFloat(newCostPrice)
        : undefined;

    try {
      setLoading(true);
      await productRepository.adjustStock(
        product.id,
        finalDelta,
        mode,
        note.trim(),
        updatedCost,
      );
      onSaved();
      onClose();
    } catch (err: any) {
      Alert.alert(
        "Adjustment Failed",
        err?.message || "Could not adjust stock.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.modalOverlay}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.sheetContainer}>
          {/* Header */}
          <View style={styles.sheetHeader}>
            <View>
              <Text style={styles.sheetTitle}>Stock Adjustment</Text>
              <Text style={styles.sheetSubtitle}>{product.name}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color={LedgerColors.inkText} />
            </TouchableOpacity>
          </View>

          <View style={styles.sheetBody}>
            {/* Mode Switcher */}
            <View style={styles.tabSwitcher}>
              <TouchableOpacity
                style={[
                  styles.tabBtn,
                  mode === "purchase" && styles.tabBtnActive,
                ]}
                onPress={() => setMode("purchase")}
              >
                <Ionicons
                  name="arrow-down-circle-outline"
                  size={16}
                  color={
                    mode === "purchase"
                      ? LedgerColors.crimson
                      : LedgerColors.inkSecondary
                  }
                />
                <Text
                  style={[
                    styles.tabText,
                    mode === "purchase" && styles.tabTextActive,
                  ]}
                >
                  Purchase (Inward)
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.tabBtn,
                  mode === "correction" && styles.tabBtnActive,
                ]}
                onPress={() => setMode("correction")}
              >
                <Ionicons
                  name="build-outline"
                  size={16}
                  color={
                    mode === "correction"
                      ? LedgerColors.crimson
                      : LedgerColors.inkSecondary
                  }
                />
                <Text
                  style={[
                    styles.tabText,
                    mode === "correction" && styles.tabTextActive,
                  ]}
                >
                  Stock Correction
                </Text>
              </TouchableOpacity>
            </View>

            {/* Current Stock Banner */}
            <View style={styles.stockBanner}>
              <Text style={styles.bannerLabel}>Current Stock on Hand:</Text>
              <Text style={styles.bannerQty}>
                {product.stock_qty} {product.unit}
              </Text>
            </View>

            {/* Quantity Input */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>
                {mode === "purchase"
                  ? "Quantity Received (+)"
                  : "Correction Quantity"}
              </Text>

              <View style={styles.qtyInputRow}>
                {mode === "correction" && (
                  <TouchableOpacity
                    style={[
                      styles.signToggleBtn,
                      { backgroundColor: isNegative ? "#FEE2E2" : "#DCFCE7" },
                    ]}
                    onPress={() => setIsNegative((prev) => !prev)}
                  >
                    <Text
                      style={[
                        styles.signToggleText,
                        {
                          color: isNegative
                            ? LedgerColors.crimson
                            : LedgerColors.ledgerGreen,
                        },
                      ]}
                    >
                      {isNegative ? "- Deduct" : "+ Add"}
                    </Text>
                  </TouchableOpacity>
                )}

                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  value={qty}
                  onChangeText={setQty}
                  placeholder="e.g. 20"
                  keyboardType="number-pad"
                  autoFocus
                />
              </View>
            </View>

            {/* Purchase Entry: Update Cost Price */}
            {mode === "purchase" && (
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>
                  Purchase Cost Price (₹ per {product.unit})
                </Text>
                <TextInput
                  style={styles.input}
                  value={newCostPrice}
                  onChangeText={setNewCostPrice}
                  placeholder="Current: ₹..."
                  keyboardType="numeric"
                />
              </View>
            )}

            {/* Note / Reason */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>
                {mode === "purchase"
                  ? "Invoice / Supplier Note"
                  : "Reason for Correction *"}
              </Text>

              {mode === "correction" && (
                <View style={styles.reasonsChipRow}>
                  {CORRECTION_REASONS.map((r) => (
                    <TouchableOpacity
                      key={r}
                      style={[
                        styles.reasonChip,
                        note === r && styles.reasonChipActive,
                      ]}
                      onPress={() => setNote(r)}
                    >
                      <Text
                        style={[
                          styles.reasonChipText,
                          note === r && styles.reasonChipTextActive,
                        ]}
                      >
                        {r}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              <TextInput
                style={[styles.input, { height: 44 }]}
                value={note}
                onChangeText={setNote}
                placeholder={
                  mode === "purchase"
                    ? "e.g. Bill #889 from Navneet Stationers"
                    : "Specify reason for inventory audit..."
                }
                placeholderTextColor={LedgerColors.inkMuted}
              />
            </View>
          </View>

          {/* Action Footer */}
          <View style={styles.sheetFooter}>
            <Button
              title={
                mode === "purchase" ? "Record Purchase" : "Apply Correction"
              }
              onPress={handleSave}
              variant={mode === "purchase" ? "success" : "primary"}
              size="lg"
              loading={loading}
              icon="checkmark-circle-outline"
              fullWidth
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(28, 25, 23, 0.5)",
    justifyContent: "flex-end",
  },
  sheetContainer: {
    backgroundColor: LedgerColors.parchment,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderWidth: 1,
    borderColor: LedgerColors.ruleBorder,
  },
  sheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: LedgerColors.ruleLine,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: LedgerColors.inkText,
  },
  sheetSubtitle: {
    fontSize: 12,
    color: LedgerColors.inkSecondary,
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
  },
  sheetBody: {
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  tabSwitcher: {
    flexDirection: "row",
    backgroundColor: LedgerColors.parchmentDark,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: LedgerColors.ruleBorder,
    padding: 3,
    marginBottom: 14,
  },
  tabBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    borderRadius: 6,
    gap: 6,
  },
  tabBtnActive: {
    backgroundColor: LedgerColors.surface,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  tabText: {
    fontSize: 12,
    fontWeight: "600",
    color: LedgerColors.inkSecondary,
  },
  tabTextActive: {
    color: LedgerColors.crimson,
    fontWeight: "700",
  },
  stockBanner: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: LedgerColors.surface,
    borderWidth: 1,
    borderColor: LedgerColors.ruleBorder,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 14,
  },
  bannerLabel: {
    fontSize: 13,
    color: LedgerColors.inkSecondary,
    fontWeight: "500",
  },
  bannerQty: {
    fontSize: 15,
    fontWeight: "bold",
    color: LedgerColors.inkText,
  },
  fieldGroup: {
    marginBottom: 14,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: LedgerColors.inkText,
    marginBottom: 6,
  },
  qtyInputRow: {
    flexDirection: "row",
    gap: 8,
  },
  signToggleBtn: {
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: LedgerColors.ruleBorder,
    alignItems: "center",
    justifyContent: "center",
    height: 42,
  },
  signToggleText: {
    fontSize: 12,
    fontWeight: "bold",
  },
  input: {
    backgroundColor: LedgerColors.surface,
    borderWidth: 1,
    borderColor: LedgerColors.ruleBorder,
    borderRadius: 6,
    paddingHorizontal: 12,
    height: 42,
    fontSize: 14,
    color: LedgerColors.inkText,
  },
  reasonsChipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 8,
  },
  reasonChip: {
    backgroundColor: LedgerColors.surface,
    borderWidth: 1,
    borderColor: LedgerColors.ruleBorder,
    borderRadius: 14,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  reasonChipActive: {
    backgroundColor: LedgerColors.crimsonLight,
    borderColor: LedgerColors.crimson,
  },
  reasonChipText: {
    fontSize: 11,
    color: LedgerColors.inkText,
  },
  reasonChipTextActive: {
    color: LedgerColors.crimson,
    fontWeight: "bold",
  },
  sheetFooter: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: Platform.OS === "ios" ? 28 : 14,
    borderTopWidth: 1,
    borderTopColor: LedgerColors.ruleLine,
    backgroundColor: LedgerColors.parchmentLight,
  },
});

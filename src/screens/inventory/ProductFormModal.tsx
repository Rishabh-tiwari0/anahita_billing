import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Product } from "../../database/types";
import { LedgerColors } from "../../theme/colors";
import { Button } from "../../components/common/Button";
import {
  productRepository,
  CreateProductInput,
  UpdateProductInput,
} from "../../repositories/productRepository";
import { BarcodeScannerModal } from "../billing/BarcodeScannerModal";

interface ProductFormModalProps {
  visible: boolean;
  productToEdit?: Product | null;
  onClose: () => void;
  onSaved: () => void;
}

const COMMON_CATEGORIES = [
  "Notebooks",
  "Pens",
  "Stationery",
  "Art Supplies",
  "Office Supplies",
  "Books",
  "Paper",
  "General",
];

const GST_RATES = [0, 5, 12, 18, 28];
const UNITS = ["pcs", "box", "pack", "set", "ream", "dozen"];

export const ProductFormModal: React.FC<ProductFormModalProps> = ({
  visible,
  productToEdit,
  onClose,
  onSaved,
}) => {
  const [name, setName] = useState("");
  const [barcode, setBarcode] = useState("");
  const [category, setCategory] = useState("Notebooks");
  const [customCategory, setCustomCategory] = useState("");
  const [costPrice, setCostPrice] = useState("");
  const [sellingPrice, setSellingPrice] = useState("");
  const [gstRate, setGstRate] = useState(0);
  const [stockQty, setStockQty] = useState("");
  const [unit, setUnit] = useState("pcs");
  const [loading, setLoading] = useState(false);
  const [scannerVisible, setScannerVisible] = useState(false);

  useEffect(() => {
    if (visible) {
      if (productToEdit) {
        setName(productToEdit.name);
        setBarcode(productToEdit.barcode || "");
        if (COMMON_CATEGORIES.includes(productToEdit.category)) {
          setCategory(productToEdit.category);
          setCustomCategory("");
        } else {
          setCategory("Other");
          setCustomCategory(productToEdit.category);
        }
        setCostPrice(String(productToEdit.cost_price));
        setSellingPrice(String(productToEdit.selling_price));
        setGstRate(productToEdit.gst_rate);
        setStockQty(String(productToEdit.stock_qty));
        setUnit(productToEdit.unit || "pcs");
      } else {
        setName("");
        setBarcode("");
        setCategory("Notebooks");
        setCustomCategory("");
        setCostPrice("");
        setSellingPrice("");
        setGstRate(0);
        setStockQty("10");
        setUnit("pcs");
      }
    }
  }, [visible, productToEdit]);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert("Required Field", "Please enter a product name.");
      return;
    }

    const costNum = parseFloat(costPrice) || 0;
    const sellNum = parseFloat(sellingPrice) || 0;

    if (sellNum <= 0) {
      Alert.alert("Invalid Price", "Please enter a valid selling price.");
      return;
    }

    const selectedCategory =
      category === "Other" ? customCategory.trim() || "General" : category;

    try {
      setLoading(true);
      if (productToEdit) {
        const updateInput: UpdateProductInput = {
          name: name.trim(),
          barcode: barcode.trim() || null,
          category: selectedCategory,
          cost_price: costNum,
          selling_price: sellNum,
          gst_rate: gstRate,
          unit: unit.trim(),
        };
        await productRepository.updateProduct(productToEdit.id, updateInput);
      } else {
        const createInput: CreateProductInput = {
          name: name.trim(),
          barcode: barcode.trim() || null,
          category: selectedCategory,
          cost_price: costNum,
          selling_price: sellNum,
          gst_rate: gstRate,
          stock_qty: parseInt(stockQty, 10) || 0,
          unit: unit.trim(),
        };
        await productRepository.createProduct(createInput);
      }
      onSaved();
      onClose();
    } catch (err: any) {
      Alert.alert(
        "Save Error",
        err?.message || "Failed to save product details.",
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
              <Text style={styles.sheetTitle}>
                {productToEdit ? "Edit Product" : "Add New Product"}
              </Text>
              <Text style={styles.sheetSubtitle}>
                {productToEdit
                  ? "Update details and tax rates"
                  : "Register stationery item or textbook"}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color={LedgerColors.inkText} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.sheetBody}
            showsVerticalScrollIndicator={false}
          >
            {/* Product Name */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Product Name *</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="e.g. Classmate Notebook (172 pgs)"
                placeholderTextColor={LedgerColors.inkMuted}
              />
            </View>

            {/* Barcode & Scan */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Barcode / SKU (Optional)</Text>
              <View style={styles.barcodeRow}>
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  value={barcode}
                  onChangeText={setBarcode}
                  placeholder="e.g. 8901058850012"
                  placeholderTextColor={LedgerColors.inkMuted}
                  keyboardType="numeric"
                />
                <TouchableOpacity
                  style={styles.scanBtn}
                  onPress={() => setScannerVisible(true)}
                >
                  <Ionicons
                    name="camera-outline"
                    size={20}
                    color={LedgerColors.crimson}
                  />
                  <Text style={styles.scanBtnText}>Scan</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Category Chips */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Category</Text>
              <View style={styles.chipRow}>
                {COMMON_CATEGORIES.map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[styles.chip, category === cat && styles.chipActive]}
                    onPress={() => setCategory(cat)}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        category === cat && styles.chipTextActive,
                      ]}
                    >
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Pricing: Cost & Selling */}
            <View style={styles.twoColumnRow}>
              <View style={[styles.fieldGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.label}>Cost Price (₹) *</Text>
                <TextInput
                  style={styles.input}
                  value={costPrice}
                  onChangeText={setCostPrice}
                  placeholder="0.00"
                  placeholderTextColor={LedgerColors.inkMuted}
                  keyboardType="numeric"
                />
              </View>
              <View style={[styles.fieldGroup, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.label}>Selling Price (₹) *</Text>
                <TextInput
                  style={styles.input}
                  value={sellingPrice}
                  onChangeText={setSellingPrice}
                  placeholder="0.00"
                  placeholderTextColor={LedgerColors.inkMuted}
                  keyboardType="numeric"
                />
              </View>
            </View>

            {/* GST Rate Chips */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>GST Rate</Text>
              <View style={styles.chipRow}>
                {GST_RATES.map((rate) => (
                  <TouchableOpacity
                    key={rate}
                    style={[styles.chip, gstRate === rate && styles.chipActive]}
                    onPress={() => setGstRate(rate)}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        gstRate === rate && styles.chipTextActive,
                      ]}
                    >
                      {rate}% {rate === 0 ? "(Exempt)" : ""}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Stock Quantity (Only editable on create, otherwise via Stock Adjustment) & Unit */}
            <View style={styles.twoColumnRow}>
              {!productToEdit && (
                <View style={[styles.fieldGroup, { flex: 1, marginRight: 8 }]}>
                  <Text style={styles.label}>Initial Stock Qty</Text>
                  <TextInput
                    style={styles.input}
                    value={stockQty}
                    onChangeText={setStockQty}
                    placeholder="0"
                    placeholderTextColor={LedgerColors.inkMuted}
                    keyboardType="numeric"
                  />
                </View>
              )}

              <View
                style={[
                  styles.fieldGroup,
                  { flex: 1, marginLeft: productToEdit ? 0 : 8 },
                ]}
              >
                <Text style={styles.label}>Unit of Measurement</Text>
                <View style={styles.chipRow}>
                  {UNITS.map((u) => (
                    <TouchableOpacity
                      key={u}
                      style={[
                        styles.chipSmall,
                        unit === u && styles.chipActive,
                      ]}
                      onPress={() => setUnit(u)}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          unit === u && styles.chipTextActive,
                        ]}
                      >
                        {u}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
          </ScrollView>

          {/* Action Footer */}
          <View style={styles.sheetFooter}>
            <Button
              title={productToEdit ? "Save Changes" : "Create Product"}
              onPress={handleSave}
              variant="primary"
              size="lg"
              loading={loading}
              icon="checkmark-outline"
              fullWidth
            />
          </View>
        </View>

        {/* Inner Barcode Scanner */}
        <BarcodeScannerModal
          visible={scannerVisible}
          onClose={() => setScannerVisible(false)}
          onScanned={(scanned) => {
            setBarcode(scanned);
            setScannerVisible(false);
          }}
        />
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
    maxHeight: "90%",
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
  fieldGroup: {
    marginBottom: 14,
  },
  label: {
    fontSize: 12,
    fontWeight: "600",
    color: LedgerColors.inkText,
    marginBottom: 6,
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
  barcodeRow: {
    flexDirection: "row",
    gap: 8,
  },
  scanBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: LedgerColors.crimsonLight,
    borderWidth: 1,
    borderColor: LedgerColors.crimsonBorder,
    borderRadius: 6,
    paddingHorizontal: 12,
    height: 42,
  },
  scanBtnText: {
    fontSize: 12,
    fontWeight: "600",
    color: LedgerColors.crimson,
    marginLeft: 4,
  },
  twoColumnRow: {
    flexDirection: "row",
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  chip: {
    backgroundColor: LedgerColors.surface,
    borderWidth: 1,
    borderColor: LedgerColors.ruleBorder,
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  chipSmall: {
    backgroundColor: LedgerColors.surface,
    borderWidth: 1,
    borderColor: LedgerColors.ruleBorder,
    borderRadius: 14,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  chipActive: {
    backgroundColor: LedgerColors.crimsonLight,
    borderColor: LedgerColors.crimson,
    borderWidth: 1.5,
  },
  chipText: {
    fontSize: 12,
    color: LedgerColors.inkText,
    fontWeight: "500",
  },
  chipTextActive: {
    color: LedgerColors.crimson,
    fontWeight: "700",
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

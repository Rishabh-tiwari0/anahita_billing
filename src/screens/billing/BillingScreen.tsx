import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { Header } from "../../components/common/Header";
import { SearchBar } from "../../components/common/SearchBar";
import { Button } from "../../components/common/Button";
import { LedgerColors } from "../../theme/colors";
import { commonStyles } from "../../theme/styles";
import { CartItem, Product, ShopSettings } from "../../database/types";
import { productRepository } from "../../repositories/productRepository";
import {
  salesRepository,
  SaleDetail,
} from "../../repositories/salesRepository";
import { settingsRepository } from "../../repositories/settingsRepository";
import { feedbackService } from "../../services/feedbackService";
import { BarcodeScannerModal } from "./BarcodeScannerModal";
import { CheckoutModal } from "./CheckoutModal";
import { ReceiptModal } from "./ReceiptModal";

export const BillingScreen: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [discount, setDiscount] = useState<string>("0");
  const [settings, setSettings] = useState<ShopSettings>({
    shop_name: "Anahita Pustak Bhandar",
    tagline: "",
    address: "",
    phone: "",
    gstin: "",
    receipt_footer: "",
    low_stock_threshold: 5,
    paper_width: "58mm",
  });

  // Modals
  const [scannerVisible, setScannerVisible] = useState(false);
  const [checkoutVisible, setCheckoutVisible] = useState(false);
  const [receiptVisible, setReceiptVisible] = useState(false);
  const [activeReceiptSale, setActiveReceiptSale] = useState<SaleDetail | null>(
    null,
  );

  // Price Override Modal
  const [overrideModalVisible, setOverrideModalVisible] = useState(false);
  const [overrideIndex, setOverrideIndex] = useState<number | null>(null);
  const [overridePriceText, setOverridePriceText] = useState("");

  const loadSettings = async () => {
    try {
      const s = await settingsRepository.getSettings();
      setSettings(s);
    } catch {
      // ignore
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadSettings();
    }, []),
  );

  // Search products as user types
  useEffect(() => {
    let cancelled = false;
    const search = async () => {
      if (searchQuery.trim().length === 0) {
        setSearchResults([]);
        return;
      }
      try {
        const results = await productRepository.getAllProducts({
          search: searchQuery.trim(),
        });
        if (!cancelled) {
          setSearchResults(results.slice(0, 8)); // Top 8 matches
        }
      } catch (err) {
        console.error("Search error:", err);
      }
    };
    search();
    return () => {
      cancelled = true;
    };
  }, [searchQuery]);

  const addToCart = (product: Product, overridePrice?: number) => {
    feedbackService.buttonTap();
    setCart((prevCart) => {
      const existingIdx = prevCart.findIndex(
        (item) => item.product.id === product.id,
      );
      const unitPrice =
        overridePrice !== undefined ? overridePrice : product.selling_price;
      const gstRate = product.gst_rate || 0;

      if (existingIdx >= 0) {
        const updated = [...prevCart];
        const existing = updated[existingIdx];
        const newQty = existing.qty + 1;
        const lineSubtotal = newQty * existing.selling_price;
        const lineGst = lineSubtotal * (existing.gst_rate / 100);
        const lineTotal = lineSubtotal + lineGst;

        updated[existingIdx] = {
          ...existing,
          qty: newQty,
          line_subtotal: lineSubtotal,
          line_gst: lineGst,
          line_total: lineTotal,
        };
        return updated;
      } else {
        const lineSubtotal = 1 * unitPrice;
        const lineGst = lineSubtotal * (gstRate / 100);
        const lineTotal = lineSubtotal + lineGst;

        return [
          ...prevCart,
          {
            product,
            qty: 1,
            selling_price: unitPrice,
            gst_rate: gstRate,
            line_subtotal: lineSubtotal,
            line_gst: lineGst,
            line_total: lineTotal,
          },
        ];
      }
    });
    setSearchQuery("");
    setSearchResults([]);
  };

  const updateQty = (index: number, newQty: number) => {
    if (newQty <= 0) {
      removeFromCart(index);
      return;
    }
    feedbackService.buttonTap();
    setCart((prev) => {
      const updated = [...prev];
      const item = updated[index];
      const lineSubtotal = newQty * item.selling_price;
      const lineGst = lineSubtotal * (item.gst_rate / 100);
      const lineTotal = lineSubtotal + lineGst;

      updated[index] = {
        ...item,
        qty: newQty,
        line_subtotal: lineSubtotal,
        line_gst: lineGst,
        line_total: lineTotal,
      };
      return updated;
    });
  };

  const removeFromCart = (index: number) => {
    feedbackService.buttonTap();
    setCart((prev) => prev.filter((_, i) => i !== index));
  };

  const openPriceOverride = (index: number) => {
    setOverrideIndex(index);
    setOverridePriceText(String(cart[index].selling_price));
    setOverrideModalVisible(true);
  };

  const savePriceOverride = () => {
    if (overrideIndex === null) return;
    const newPrice = parseFloat(overridePriceText);
    if (isNaN(newPrice) || newPrice < 0) {
      Alert.alert("Invalid Price", "Please enter a valid selling price.");
      return;
    }

    setCart((prev) => {
      const updated = [...prev];
      const item = updated[overrideIndex];
      const lineSubtotal = item.qty * newPrice;
      const lineGst = lineSubtotal * (item.gst_rate / 100);
      const lineTotal = lineSubtotal + lineGst;

      updated[overrideIndex] = {
        ...item,
        selling_price: newPrice,
        line_subtotal: lineSubtotal,
        line_gst: lineGst,
        line_total: lineTotal,
      };
      return updated;
    });

    setOverrideModalVisible(false);
    setOverrideIndex(null);
  };

  const handleBarcodeScanned = async (barcode: string) => {
    try {
      const found = await productRepository.getProductByBarcode(barcode);
      if (found) {
        addToCart(found);
        setScannerVisible(false);
      } else {
        Alert.alert(
          "Product Not Found",
          `No product registered with barcode: ${barcode}.\nWould you like to add it now?`,
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "OK",
              onPress: () => {
                setScannerVisible(false);
              },
            },
          ],
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleReprintLast = async () => {
    try {
      const last = await salesRepository.getLastSale();
      if (!last) {
        Alert.alert("No Bills Yet", "There are no previous sales to reprint.");
        return;
      }
      setActiveReceiptSale(last);
      setReceiptVisible(true);
    } catch (err: any) {
      Alert.alert("Error", err?.message || "Failed to fetch last sale.");
    }
  };

  // Calculations
  const subtotal = cart.reduce((sum, item) => sum + item.line_subtotal, 0);
  const gstTotal = cart.reduce((sum, item) => sum + item.line_gst, 0);
  const discountNum = Math.max(0, parseFloat(discount) || 0);
  const grandTotal = Math.max(
    0,
    Math.round((subtotal + gstTotal - discountNum) * 100) / 100,
  );

  const handleCompleteSale = async (paymentData: {
    customerName?: string;
    paymentMode: any;
    splitDetails?: any;
  }) => {
    const saleItems = cart.map((it) => ({
      product_id: it.product.id,
      product_name_snapshot: it.product.name,
      qty: it.qty,
      cost_price_at_sale: it.product.cost_price,
      selling_price_at_sale: it.selling_price,
      gst_rate_at_sale: it.gst_rate,
      line_total: it.line_total,
    }));

    const newSale = await salesRepository.createSale({
      customer_name: paymentData.customerName,
      payment_mode: paymentData.paymentMode,
      payment_split_details: paymentData.splitDetails,
      discount: discountNum,
      items: saleItems,
    });

    feedbackService.confirmSale();
    setCart([]);
    setDiscount("0");
    setActiveReceiptSale(newSale);
    setReceiptVisible(true);
  };

  return (
    <View style={commonStyles.container}>
      <Header
        title={settings.shop_name}
        subtitle="Billing Counter • Fast POS"
        rightAction={{
          icon: "receipt-outline",
          label: "Reprint",
          onPress: handleReprintLast,
        }}
      />

      {/* Product Search & Barcode Scan Bar */}
      <View style={styles.searchSection}>
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Type product name or scan barcode..."
          onScanPress={() => setScannerVisible(true)}
          onClear={() => setSearchResults([])}
        />

        {/* Live Search Dropdown */}
        {searchResults.length > 0 && (
          <View style={styles.dropdownList}>
            {searchResults.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.dropdownItem}
                onPress={() => addToCart(item)}
                activeOpacity={0.7}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.dropdownName}>{item.name}</Text>
                  <Text style={styles.dropdownMeta}>
                    {item.category} • Stock: {item.stock_qty} {item.unit}
                    {item.barcode ? ` • [${item.barcode}]` : ""}
                  </Text>
                </View>
                <View style={styles.dropdownPriceBox}>
                  <Text style={styles.dropdownPrice}>
                    ₹{item.selling_price.toFixed(2)}
                  </Text>
                  <Text style={styles.dropdownAddText}>+ Add</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* Cart List */}
      <View style={styles.cartContainer}>
        <View style={styles.cartHeaderRow}>
          <Text style={styles.cartTitle}>
            Current Cart ({cart.reduce((s, i) => s + i.qty, 0)} items)
          </Text>
          {cart.length > 0 && (
            <TouchableOpacity
              onPress={() => {
                Alert.alert(
                  "Clear Cart",
                  "Are you sure you want to remove all items?",
                  [
                    { text: "Cancel", style: "cancel" },
                    {
                      text: "Clear",
                      style: "destructive",
                      onPress: () => setCart([]),
                    },
                  ],
                );
              }}
            >
              <Text style={styles.clearCartText}>Clear All</Text>
            </TouchableOpacity>
          )}
        </View>

        {cart.length === 0 ? (
          <View style={styles.emptyCartBox}>
            <Ionicons
              name="cart-outline"
              size={54}
              color={LedgerColors.ruleDark}
            />
            <Text style={styles.emptyCartTitle}>Counter Ready for Billing</Text>
            <Text style={styles.emptyCartSubtitle}>
              Scan a barcode or type a product name above to add items to this
              bill.
            </Text>
            <Button
              title="Open Barcode Scanner"
              onPress={() => setScannerVisible(true)}
              variant="outline"
              icon="barcode-outline"
              size="sm"
              style={{ marginTop: 14 }}
            />
          </View>
        ) : (
          <FlatList
            data={cart}
            keyExtractor={(_, index) => String(index)}
            renderItem={({ item, index }) => (
              <View style={styles.cartItemCard}>
                <View style={styles.cartItemTop}>
                  <View style={{ flex: 1, marginRight: 8 }}>
                    <Text style={styles.cartItemName}>{item.product.name}</Text>
                    <Text style={styles.cartItemSub}>
                      {item.product.category}
                      {item.gst_rate > 0
                        ? ` • GST ${item.gst_rate}%`
                        : " • Tax Exempt"}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => removeFromCart(index)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons
                      name="trash-outline"
                      size={18}
                      color={LedgerColors.crimson}
                    />
                  </TouchableOpacity>
                </View>

                <View style={styles.cartItemBottom}>
                  {/* Stepper */}
                  <View style={styles.stepperContainer}>
                    <TouchableOpacity
                      style={styles.stepperBtn}
                      onPress={() => updateQty(index, item.qty - 1)}
                    >
                      <Ionicons
                        name="remove"
                        size={16}
                        color={LedgerColors.inkText}
                      />
                    </TouchableOpacity>
                    <Text style={styles.stepperQty}>{item.qty}</Text>
                    <TouchableOpacity
                      style={styles.stepperBtn}
                      onPress={() => updateQty(index, item.qty + 1)}
                    >
                      <Ionicons
                        name="add"
                        size={16}
                        color={LedgerColors.inkText}
                      />
                    </TouchableOpacity>
                  </View>

                  {/* Editable Rate */}
                  <TouchableOpacity
                    style={styles.priceTagBtn}
                    onPress={() => openPriceOverride(index)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.rateLabel}>Rate: </Text>
                    <Text style={styles.rateValue}>
                      ₹{item.selling_price.toFixed(2)}
                    </Text>
                    <Ionicons
                      name="pencil-sharp"
                      size={12}
                      color={LedgerColors.inkSecondary}
                      style={{ marginLeft: 3 }}
                    />
                  </TouchableOpacity>

                  {/* Line Total */}
                  <View style={styles.lineTotalContainer}>
                    <Text style={styles.lineTotalValue}>
                      ₹{item.line_total.toFixed(2)}
                    </Text>
                  </View>
                </View>
              </View>
            )}
            contentContainerStyle={{ paddingBottom: 16 }}
          />
        )}
      </View>

      {/* Ledger Totals & Pay Bar */}
      {cart.length > 0 && (
        <View style={styles.bottomBar}>
          <View style={styles.totalsSection}>
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>
                Subtotal: ₹{subtotal.toFixed(2)}
              </Text>
              <Text style={styles.totalsLabel}>
                GST: ₹{gstTotal.toFixed(2)}
              </Text>
              <View style={styles.discountInputBox}>
                <Text style={styles.discountLabel}>Disc (₹): </Text>
                <TextInput
                  style={styles.discountInput}
                  value={discount}
                  onChangeText={setDiscount}
                  keyboardType="numeric"
                  placeholder="0"
                />
              </View>
            </View>

            <View style={styles.grandTotalRow}>
              <View>
                <Text style={styles.grandTotalLabel}>TOTAL PAYABLE</Text>
                <Text style={styles.grandTotalAmount}>
                  ₹{grandTotal.toFixed(2)}
                </Text>
              </View>

              <Button
                title={`Pay ₹${grandTotal.toFixed(2)}`}
                onPress={() => setCheckoutVisible(true)}
                variant="primary"
                size="lg"
                icon="cash-outline"
                style={{ minWidth: 150 }}
              />
            </View>
          </View>
        </View>
      )}

      {/* Barcode Scanner Modal */}
      <BarcodeScannerModal
        visible={scannerVisible}
        onClose={() => setScannerVisible(false)}
        onScanned={handleBarcodeScanned}
      />

      {/* Checkout / Payment Modal */}
      <CheckoutModal
        visible={checkoutVisible}
        onClose={() => setCheckoutVisible(false)}
        subtotal={subtotal}
        gstTotal={gstTotal}
        discount={discountNum}
        grandTotal={grandTotal}
        onConfirmSale={handleCompleteSale}
      />

      {/* Thermal Receipt Preview Modal */}
      <ReceiptModal
        visible={receiptVisible}
        sale={activeReceiptSale}
        settings={settings}
        onClose={() => setReceiptVisible(false)}
        onNewSale={() => {
          setCart([]);
          setDiscount("0");
        }}
      />

      {/* Price Override Modal */}
      <Modal visible={overrideModalVisible} transparent animationType="fade">
        <KeyboardAvoidingView
          style={styles.dialogOverlay}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={styles.dialogCard}>
            <Text style={styles.dialogTitle}>Override Item Rate</Text>
            <Text style={styles.dialogDesc}>
              Enter custom selling price for this customer/negotiation:
            </Text>
            <View style={styles.dialogInputRow}>
              <Text style={styles.dialogPrefix}>₹</Text>
              <TextInput
                style={styles.dialogInput}
                value={overridePriceText}
                onChangeText={setOverridePriceText}
                keyboardType="numeric"
                autoFocus
              />
            </View>
            <View style={styles.dialogActions}>
              <Button
                title="Cancel"
                onPress={() => setOverrideModalVisible(false)}
                variant="outline"
                style={{ flex: 1 }}
              />
              <Button
                title="Apply Rate"
                onPress={savePriceOverride}
                variant="primary"
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  searchSection: {
    position: "relative",
    zIndex: 10,
  },
  dropdownList: {
    position: "absolute",
    top: 56,
    left: 12,
    right: 12,
    backgroundColor: LedgerColors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: LedgerColors.ruleBorder,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 6,
    maxHeight: 280,
    zIndex: 20,
  },
  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: LedgerColors.ruleLine,
  },
  dropdownName: {
    fontSize: 14,
    fontWeight: "600",
    color: LedgerColors.inkText,
  },
  dropdownMeta: {
    fontSize: 11,
    color: LedgerColors.inkSecondary,
    marginTop: 2,
  },
  dropdownPriceBox: {
    alignItems: "flex-end",
    marginLeft: 10,
  },
  dropdownPrice: {
    fontSize: 14,
    fontWeight: "bold",
    color: LedgerColors.crimson,
  },
  dropdownAddText: {
    fontSize: 11,
    fontWeight: "600",
    color: LedgerColors.ledgerGreen,
    marginTop: 2,
  },
  cartContainer: {
    flex: 1,
    paddingHorizontal: 12,
  },
  cartHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  cartTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: LedgerColors.inkText,
    letterSpacing: 0.2,
  },
  clearCartText: {
    fontSize: 12,
    fontWeight: "600",
    color: LedgerColors.crimson,
  },
  emptyCartBox: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 30,
  },
  emptyCartTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: LedgerColors.inkText,
    marginTop: 12,
  },
  emptyCartSubtitle: {
    fontSize: 13,
    color: LedgerColors.inkSecondary,
    textAlign: "center",
    marginTop: 6,
    lineHeight: 18,
  },
  cartItemCard: {
    backgroundColor: LedgerColors.surface,
    borderWidth: 1,
    borderColor: LedgerColors.ruleBorder,
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
  },
  cartItemTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  cartItemName: {
    fontSize: 14,
    fontWeight: "600",
    color: LedgerColors.inkText,
  },
  cartItemSub: {
    fontSize: 11,
    color: LedgerColors.inkMuted,
    marginTop: 2,
  },
  cartItemBottom: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: LedgerColors.ruleLine,
  },
  stepperContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: LedgerColors.parchmentLight,
    borderWidth: 1,
    borderColor: LedgerColors.ruleBorder,
    borderRadius: 6,
  },
  stepperBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  stepperQty: {
    fontSize: 14,
    fontWeight: "bold",
    color: LedgerColors.inkText,
    minWidth: 26,
    textAlign: "center",
  },
  priceTagBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: LedgerColors.parchmentLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: LedgerColors.ruleBorder,
  },
  rateLabel: {
    fontSize: 11,
    color: LedgerColors.inkMuted,
  },
  rateValue: {
    fontSize: 13,
    fontWeight: "600",
    color: LedgerColors.inkText,
  },
  lineTotalContainer: {
    alignItems: "flex-end",
  },
  lineTotalValue: {
    fontSize: 15,
    fontWeight: "bold",
    color: LedgerColors.inkText,
    fontVariant: ["tabular-nums"],
  },
  bottomBar: {
    backgroundColor: LedgerColors.parchmentLight,
    borderTopWidth: 1,
    borderTopColor: LedgerColors.ruleBorder,
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: Platform.OS === "ios" ? 24 : 10,
  },
  totalsSection: {},
  totalsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  totalsLabel: {
    fontSize: 12,
    color: LedgerColors.inkSecondary,
    fontWeight: "500",
  },
  discountInputBox: {
    flexDirection: "row",
    alignItems: "center",
  },
  discountLabel: {
    fontSize: 12,
    color: LedgerColors.crimson,
    fontWeight: "600",
  },
  discountInput: {
    backgroundColor: LedgerColors.surface,
    borderWidth: 1,
    borderColor: LedgerColors.ruleBorder,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    width: 50,
    fontSize: 12,
    color: LedgerColors.crimson,
    textAlign: "center",
    fontWeight: "600",
  },
  grandTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  grandTotalLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: LedgerColors.inkSecondary,
    letterSpacing: 0.5,
  },
  grandTotalAmount: {
    fontSize: 26,
    fontWeight: "bold",
    color: LedgerColors.crimson,
    fontVariant: ["tabular-nums"],
  },
  dialogOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  dialogCard: {
    width: "100%",
    maxWidth: 320,
    backgroundColor: LedgerColors.parchment,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: LedgerColors.ruleBorder,
    padding: 16,
  },
  dialogTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: LedgerColors.inkText,
  },
  dialogDesc: {
    fontSize: 12,
    color: LedgerColors.inkSecondary,
    marginTop: 4,
    marginBottom: 12,
  },
  dialogInputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: LedgerColors.surface,
    borderWidth: 1,
    borderColor: LedgerColors.ruleBorder,
    borderRadius: 6,
    paddingHorizontal: 10,
    height: 44,
    marginBottom: 16,
  },
  dialogPrefix: {
    fontSize: 18,
    fontWeight: "bold",
    color: LedgerColors.inkText,
    marginRight: 6,
  },
  dialogInput: {
    flex: 1,
    fontSize: 18,
    fontWeight: "bold",
    color: LedgerColors.inkText,
  },
  dialogActions: {
    flexDirection: "row",
    gap: 8,
  },
});

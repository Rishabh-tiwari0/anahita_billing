import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LedgerColors } from "../../theme/colors";
import { PaymentMode, PaymentSplitDetails } from "../../database/types";
import { Button } from "../../components/common/Button";

interface CheckoutModalProps {
  visible: boolean;
  onClose: () => void;
  subtotal: number;
  gstTotal: number;
  discount: number;
  grandTotal: number;
  onConfirmSale: (paymentData: {
    customerName?: string;
    paymentMode: PaymentMode;
    splitDetails?: PaymentSplitDetails;
  }) => Promise<void>;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  visible,
  onClose,
  subtotal,
  gstTotal,
  discount,
  grandTotal,
  onConfirmSale,
}) => {
  const [customerName, setCustomerName] = useState("");
  const [paymentMode, setPaymentMode] = useState<PaymentMode>("cash");

  // Cash denomination tender helper
  const [tenderAmount, setTenderAmount] = useState("");

  // Split details
  const [splitCash, setSplitCash] = useState("");
  const [splitUpi, setSplitUpi] = useState("");
  const [splitCard, setSplitCard] = useState("");

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      setTenderAmount(String(Math.ceil(grandTotal)));
      setSplitCash(String(Math.ceil(grandTotal)));
      setSplitUpi("");
      setSplitCard("");
      setCustomerName("");
      setPaymentMode("cash");
    }
  }, [visible, grandTotal]);

  const tenderNum = Number(tenderAmount) || 0;
  const changeDue = Math.max(0, tenderNum - grandTotal);

  // Split calculation
  const splitCashNum = Number(splitCash) || 0;
  const splitUpiNum = Number(splitUpi) || 0;
  const splitCardNum = Number(splitCard) || 0;
  const splitTotal = splitCashNum + splitUpiNum + splitCardNum;
  const splitRemaining = Math.round((grandTotal - splitTotal) * 100) / 100;

  const handleConfirm = async () => {
    if (paymentMode === "split") {
      if (Math.abs(splitRemaining) > 0.05) {
        Alert.alert(
          "Split Payment Incomplete",
          `The split amounts (₹${splitTotal.toFixed(
            2,
          )}) must equal the grand total of ₹${grandTotal.toFixed(2)}.\nDifference: ₹${Math.abs(
            splitRemaining,
          ).toFixed(2)}`,
        );
        return;
      }
    }

    try {
      setLoading(true);
      const splitDetails: PaymentSplitDetails | undefined =
        paymentMode === "split"
          ? {
              cash: splitCashNum > 0 ? splitCashNum : undefined,
              upi: splitUpiNum > 0 ? splitUpiNum : undefined,
              card: splitCardNum > 0 ? splitCardNum : undefined,
            }
          : undefined;

      await onConfirmSale({
        customerName: customerName.trim() || undefined,
        paymentMode,
        splitDetails,
      });
      onClose();
    } catch (err: any) {
      Alert.alert(
        "Sale Error",
        err?.message || "Failed to complete sale transaction",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleQuickCash = (amt: number) => {
    setTenderAmount(String(amt));
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
              <Text style={styles.sheetTitle}>Settlement & Payment</Text>
              <Text style={styles.sheetSubtitle}>
                Choose payment method to complete bill
              </Text>
            </View>
            <TouchableOpacity
              style={styles.closeIcon}
              onPress={onClose}
              disabled={loading}
            >
              <Ionicons
                name="close"
                size={24}
                color={LedgerColors.inkSecondary}
              />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.sheetBody}
            showsVerticalScrollIndicator={false}
          >
            {/* Grand Total Highlight */}
            <View style={styles.totalBox}>
              <Text style={styles.totalBoxLabel}>NET PAYABLE AMOUNT</Text>
              <Text style={styles.totalBoxAmount}>
                ₹{grandTotal.toFixed(2)}
              </Text>
              <Text style={styles.totalBoxSub}>
                Items: ₹{subtotal.toFixed(2)} | GST: ₹{gstTotal.toFixed(2)}
                {discount > 0 ? ` | Discount: -₹${discount.toFixed(2)}` : ""}
              </Text>
            </View>

            {/* Customer Details */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Customer Name (Optional)</Text>
              <TextInput
                style={styles.input}
                value={customerName}
                onChangeText={setCustomerName}
                placeholder="Walk-in Customer / Student Name"
                placeholderTextColor={LedgerColors.inkMuted}
              />
            </View>

            {/* Payment Mode Selector */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Payment Mode</Text>
              <View style={styles.modeGrid}>
                {(["cash", "upi", "card", "split"] as PaymentMode[]).map(
                  (mode) => {
                    const active = paymentMode === mode;
                    const icons: Record<
                      PaymentMode,
                      keyof typeof Ionicons.glyphMap
                    > = {
                      cash: "cash-outline",
                      upi: "phone-portrait-outline",
                      card: "card-outline",
                      split: "git-branch-outline",
                    };
                    const labels: Record<PaymentMode, string> = {
                      cash: "Cash",
                      upi: "UPI / QR",
                      card: "Card",
                      split: "Split",
                    };

                    return (
                      <TouchableOpacity
                        key={mode}
                        style={[
                          styles.modeButton,
                          active && styles.modeButtonActive,
                        ]}
                        onPress={() => setPaymentMode(mode)}
                        activeOpacity={0.8}
                      >
                        <Ionicons
                          name={icons[mode]}
                          size={20}
                          color={
                            active
                              ? LedgerColors.crimson
                              : LedgerColors.inkSecondary
                          }
                        />
                        <Text
                          style={[
                            styles.modeLabel,
                            active && styles.modeLabelActive,
                          ]}
                        >
                          {labels[mode]}
                        </Text>
                      </TouchableOpacity>
                    );
                  },
                )}
              </View>
            </View>

            {/* Mode Specific Helpers */}
            {paymentMode === "cash" && (
              <View style={styles.helperCard}>
                <Text style={styles.helperTitle}>Cash Tender & Change</Text>
                <View style={styles.tenderInputRow}>
                  <Text style={styles.currencyPrefix}>₹</Text>
                  <TextInput
                    style={styles.tenderInput}
                    value={tenderAmount}
                    onChangeText={setTenderAmount}
                    keyboardType="numeric"
                    placeholder="Enter cash received"
                    placeholderTextColor={LedgerColors.inkMuted}
                  />
                </View>

                {/* Quick denomination chips */}
                <View style={styles.quickCashChips}>
                  <TouchableOpacity
                    style={styles.chip}
                    onPress={() => handleQuickCash(Math.ceil(grandTotal))}
                  >
                    <Text style={styles.chipText}>
                      Exact ₹{Math.ceil(grandTotal)}
                    </Text>
                  </TouchableOpacity>
                  {[100, 200, 500, 1000, 2000].map((amt) => {
                    if (amt >= Math.floor(grandTotal)) {
                      return (
                        <TouchableOpacity
                          key={amt}
                          style={styles.chip}
                          onPress={() => handleQuickCash(amt)}
                        >
                          <Text style={styles.chipText}>₹{amt}</Text>
                        </TouchableOpacity>
                      );
                    }
                    return null;
                  })}
                </View>

                {/* Change return calculation */}
                <View style={styles.changeDueRow}>
                  <Text style={styles.changeDueLabel}>
                    Change Due to Customer:
                  </Text>
                  <Text
                    style={[
                      styles.changeDueAmount,
                      {
                        color:
                          changeDue > 0
                            ? LedgerColors.ledgerGreen
                            : LedgerColors.inkSecondary,
                      },
                    ]}
                  >
                    ₹{changeDue.toFixed(2)}
                  </Text>
                </View>
              </View>
            )}

            {paymentMode === "upi" && (
              <View style={styles.helperCard}>
                <View style={styles.iconInfoRow}>
                  <Ionicons
                    name="qr-code-outline"
                    size={24}
                    color={LedgerColors.ledgerBlue}
                  />
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={styles.upiTitle}>Scan Shop UPI QR Code</Text>
                    <Text style={styles.upiDesc}>
                      Customer pays ₹{grandTotal.toFixed(2)} on counter GPay /
                      PhonePe / Paytm.
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {paymentMode === "card" && (
              <View style={styles.helperCard}>
                <View style={styles.iconInfoRow}>
                  <Ionicons
                    name="card-outline"
                    size={24}
                    color={LedgerColors.ledgerPurple}
                  />
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={styles.cardTitle}>
                      Swipe / Dip Card on POS Machine
                    </Text>
                    <Text style={styles.upiDesc}>
                      Charge ₹{grandTotal.toFixed(2)} on card terminal.
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {paymentMode === "split" && (
              <View style={styles.helperCard}>
                <Text style={styles.helperTitle}>Split Payment Breakdown</Text>
                <View style={styles.splitRow}>
                  <Text style={styles.splitFieldLabel}>Cash (₹):</Text>
                  <TextInput
                    style={styles.splitInput}
                    value={splitCash}
                    onChangeText={setSplitCash}
                    keyboardType="numeric"
                    placeholder="0"
                  />
                </View>
                <View style={styles.splitRow}>
                  <Text style={styles.splitFieldLabel}>UPI (₹):</Text>
                  <TextInput
                    style={styles.splitInput}
                    value={splitUpi}
                    onChangeText={setSplitUpi}
                    keyboardType="numeric"
                    placeholder="0"
                  />
                </View>
                <View style={styles.splitRow}>
                  <Text style={styles.splitFieldLabel}>Card (₹):</Text>
                  <TextInput
                    style={styles.splitInput}
                    value={splitCard}
                    onChangeText={setSplitCard}
                    keyboardType="numeric"
                    placeholder="0"
                  />
                </View>

                <View style={styles.splitStatusRow}>
                  <Text style={styles.splitStatusText}>
                    Entered: ₹{splitTotal.toFixed(2)} / ₹{grandTotal.toFixed(2)}
                  </Text>
                  <Text
                    style={[
                      styles.splitRemainingText,
                      {
                        color:
                          Math.abs(splitRemaining) <= 0.05
                            ? LedgerColors.ledgerGreen
                            : LedgerColors.crimson,
                      },
                    ]}
                  >
                    {Math.abs(splitRemaining) <= 0.05
                      ? "✓ Balanced"
                      : splitRemaining > 0
                        ? `₹${splitRemaining.toFixed(2)} left`
                        : `₹${Math.abs(splitRemaining).toFixed(2)} excess`}
                  </Text>
                </View>
              </View>
            )}
          </ScrollView>

          {/* Bottom Action Footer */}
          <View style={styles.sheetFooter}>
            <Button
              title={`Confirm & Generate Bill (₹${grandTotal.toFixed(2)})`}
              onPress={handleConfirm}
              variant="primary"
              size="lg"
              fullWidth
              loading={loading}
              icon="checkmark-circle-outline"
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
    backgroundColor: "rgba(28, 25, 23, 0.55)",
    justifyContent: "flex-end",
  },
  sheetContainer: {
    backgroundColor: LedgerColors.parchment,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
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
  closeIcon: {
    padding: 6,
  },
  sheetBody: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  totalBox: {
    backgroundColor: LedgerColors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: LedgerColors.ruleBorder,
    padding: 14,
    alignItems: "center",
    marginBottom: 16,
  },
  totalBoxLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: LedgerColors.inkSecondary,
    letterSpacing: 0.5,
  },
  totalBoxAmount: {
    fontSize: 32,
    fontWeight: "bold",
    color: LedgerColors.crimson,
    marginVertical: 4,
    fontVariant: ["tabular-nums"],
  },
  totalBoxSub: {
    fontSize: 12,
    color: LedgerColors.inkMuted,
  },
  section: {
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 13,
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
  modeGrid: {
    flexDirection: "row",
    gap: 8,
  },
  modeButton: {
    flex: 1,
    backgroundColor: LedgerColors.surface,
    borderWidth: 1,
    borderColor: LedgerColors.ruleBorder,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  modeButtonActive: {
    backgroundColor: LedgerColors.crimsonLight,
    borderColor: LedgerColors.crimson,
    borderWidth: 1.5,
  },
  modeLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: LedgerColors.inkSecondary,
    marginTop: 4,
  },
  modeLabelActive: {
    color: LedgerColors.crimson,
    fontWeight: "700",
  },
  helperCard: {
    backgroundColor: LedgerColors.surface,
    borderWidth: 1,
    borderColor: LedgerColors.ruleBorder,
    borderRadius: 8,
    padding: 14,
    marginBottom: 16,
  },
  helperTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: LedgerColors.inkText,
    marginBottom: 10,
  },
  tenderInputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: LedgerColors.parchmentLight,
    borderWidth: 1,
    borderColor: LedgerColors.ruleBorder,
    borderRadius: 6,
    paddingHorizontal: 10,
    height: 46,
  },
  currencyPrefix: {
    fontSize: 20,
    fontWeight: "bold",
    color: LedgerColors.inkText,
    marginRight: 6,
  },
  tenderInput: {
    flex: 1,
    fontSize: 20,
    fontWeight: "bold",
    color: LedgerColors.inkText,
    fontVariant: ["tabular-nums"],
  },
  quickCashChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 10,
  },
  chip: {
    backgroundColor: LedgerColors.parchment,
    borderWidth: 1,
    borderColor: LedgerColors.ruleBorder,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  chipText: {
    fontSize: 12,
    fontWeight: "600",
    color: LedgerColors.inkText,
  },
  changeDueRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 14,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: LedgerColors.ruleLine,
  },
  changeDueLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: LedgerColors.inkText,
  },
  changeDueAmount: {
    fontSize: 18,
    fontWeight: "bold",
    fontVariant: ["tabular-nums"],
  },
  iconInfoRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  upiTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: LedgerColors.inkText,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: LedgerColors.inkText,
  },
  upiDesc: {
    fontSize: 12,
    color: LedgerColors.inkSecondary,
    marginTop: 2,
  },
  splitRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  splitFieldLabel: {
    width: 80,
    fontSize: 13,
    fontWeight: "600",
    color: LedgerColors.inkText,
  },
  splitInput: {
    flex: 1,
    backgroundColor: LedgerColors.parchmentLight,
    borderWidth: 1,
    borderColor: LedgerColors.ruleBorder,
    borderRadius: 6,
    height: 38,
    paddingHorizontal: 10,
    fontSize: 14,
    fontVariant: ["tabular-nums"],
  },
  splitStatusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: LedgerColors.ruleLine,
  },
  splitStatusText: {
    fontSize: 12,
    color: LedgerColors.inkSecondary,
  },
  splitRemainingText: {
    fontSize: 12,
    fontWeight: "700",
  },
  sheetFooter: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: Platform.OS === "ios" ? 30 : 16,
    borderTopWidth: 1,
    borderTopColor: LedgerColors.ruleLine,
    backgroundColor: LedgerColors.parchmentLight,
  },
});

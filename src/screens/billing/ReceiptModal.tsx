import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SaleDetail } from "../../repositories/salesRepository";
import { ShopSettings } from "../../database/types";
import { LedgerColors } from "../../theme/colors";
import { ThermalReceiptView } from "../../components/receipt/ThermalReceiptView";
import { printerService } from "../../services/printerService";
import { Button } from "../../components/common/Button";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface ReceiptModalProps {
  visible: boolean;
  sale: SaleDetail | null;
  settings: ShopSettings;
  onClose: () => void;
  onNewSale?: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  visible,
  sale,
  settings,
  onClose,
  onNewSale,
}) => {
  const [printing, setPrinting] = useState(false);
  const [sharing, setSharing] = useState(false);

  if (!sale) return null;

  const handlePrint = async () => {
    try {
      setPrinting(true);
      await printerService.printReceipt(sale, settings);
    } catch (err: any) {
      Alert.alert("Print Error", err?.message || "Failed to print receipt.");
    } finally {
      setPrinting(false);
    }
  };

  const handleShare = async () => {
    try {
      setSharing(true);
      await printerService.shareReceiptPdf(sale, settings);
    } catch (err: any) {
      Alert.alert(
        "Share Error",
        err?.message || "Failed to share receipt PDF.",
      );
    } finally {
      setSharing(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.headerTitle}>Bill Receipt</Text>
              <Text style={styles.headerSubtitle}>{sale.bill_number}</Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Ionicons name="close" size={24} color={LedgerColors.inkText} />
            </TouchableOpacity>
          </View>

          {/* Thermal Receipt Scroll View */}
          <ScrollView
            style={styles.scrollArea}
            showsVerticalScrollIndicator={false}
          >
            <ThermalReceiptView sale={sale} settings={settings} />
          </ScrollView>

          {/* Action Footer */}
          <View style={styles.footerRow}>
            <View style={styles.buttonRow}>
              <Button
                title="Print Receipt"
                onPress={handlePrint}
                variant="primary"
                icon="print-outline"
                loading={printing}
                style={{ flex: 1 }}
              />
              <Button
                title="Share PDF"
                onPress={handleShare}
                variant="outline"
                icon="share-social-outline"
                loading={sharing}
                style={{ flex: 1 }}
              />
            </View>

            {onNewSale ? (
              <Button
                title="Next Customer / New Sale"
                onPress={() => {
                  onClose();
                  onNewSale();
                }}
                variant="success"
                icon="add-circle-outline"
                size="md"
                style={{ marginTop: 8 }}
                fullWidth
              />
            ) : null}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(28, 25, 23, 0.65)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 30,
  },
  modalCard: {
    width: "100%",
    maxWidth: 420,
    maxHeight: "94%",
    backgroundColor: LedgerColors.parchment,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: LedgerColors.ruleBorder,
    overflow: "hidden",
    shadowColor: "#1A1817",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: LedgerColors.ruleLine,
    backgroundColor: LedgerColors.parchmentLight,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: LedgerColors.inkText,
  },
  headerSubtitle: {
    fontSize: 12,
    color: LedgerColors.crimson,
    fontWeight: "600",
    marginTop: 1,
  },
  closeBtn: {
    padding: 6,
  },
  scrollArea: {
    flexGrow: 1,
    backgroundColor: LedgerColors.parchmentDark,
  },
  footerRow: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: Platform.OS === "ios" ? 24 : 14,
    borderTopWidth: 1,
    borderTopColor: LedgerColors.ruleLine,
    backgroundColor: LedgerColors.parchmentLight,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 8,
  },
});

import React, { useEffect, useState } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Product, StockMovement } from "../../database/types";
import { LedgerColors } from "../../theme/colors";
import { productRepository } from "../../repositories/productRepository";

interface StockHistoryModalProps {
  visible: boolean;
  product: Product | null;
  onClose: () => void;
}

export const StockHistoryModal: React.FC<StockHistoryModalProps> = ({
  visible,
  product,
  onClose,
}) => {
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible && product) {
      loadHistory();
    }
  }, [visible, product]);

  const loadHistory = async () => {
    if (!product) return;
    try {
      setLoading(true);
      const data = await productRepository.getProductMovements(product.id);
      setMovements(data);
    } catch (err) {
      console.error("Failed to load movements:", err);
    } finally {
      setLoading(false);
    }
  };

  if (!product) return null;

  const renderBadge = (type: string) => {
    switch (type) {
      case "purchase":
        return (
          <View
            style={[
              styles.badge,
              { backgroundColor: LedgerColors.ledgerGreenLight },
            ]}
          >
            <Ionicons
              name="arrow-down"
              size={12}
              color={LedgerColors.ledgerGreen}
            />
            <Text
              style={[styles.badgeText, { color: LedgerColors.ledgerGreen }]}
            >
              Purchase
            </Text>
          </View>
        );
      case "sale":
        return (
          <View
            style={[
              styles.badge,
              { backgroundColor: LedgerColors.crimsonLight },
            ]}
          >
            <Ionicons name="arrow-up" size={12} color={LedgerColors.crimson} />
            <Text style={[styles.badgeText, { color: LedgerColors.crimson }]}>
              Sale
            </Text>
          </View>
        );
      case "correction":
        return (
          <View
            style={[
              styles.badge,
              { backgroundColor: LedgerColors.ledgerAmberLight },
            ]}
          >
            <Ionicons
              name="build-outline"
              size={12}
              color={LedgerColors.ledgerAmber}
            />
            <Text
              style={[styles.badgeText, { color: LedgerColors.ledgerAmber }]}
            >
              Audit
            </Text>
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.sheetContainer}>
          {/* Header */}
          <View style={styles.sheetHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.sheetTitle}>Stock Ledger History</Text>
              <Text style={styles.sheetSubtitle} numberOfLines={1}>
                {product.name} (Current: {product.stock_qty} {product.unit})
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color={LedgerColors.inkText} />
            </TouchableOpacity>
          </View>

          {/* Body */}
          {loading ? (
            <View style={styles.centerBox}>
              <ActivityIndicator size="large" color={LedgerColors.crimson} />
            </View>
          ) : movements.length === 0 ? (
            <View style={styles.centerBox}>
              <Text style={styles.emptyText}>
                No stock movements recorded yet.
              </Text>
            </View>
          ) : (
            <FlatList
              data={movements}
              keyExtractor={(item) => String(item.id)}
              contentContainerStyle={{ padding: 14 }}
              renderItem={({ item }) => {
                const isPositive = item.qty_change > 0;
                return (
                  <View style={styles.movementCard}>
                    <View style={styles.cardHeader}>
                      {renderBadge(item.type)}
                      <Text style={styles.dateText}>
                        {item.created_at
                          ? item.created_at.substring(0, 16)
                          : ""}
                      </Text>
                    </View>

                    <View style={styles.cardContent}>
                      <Text style={styles.noteText}>
                        {item.note || "No notes specified"}
                      </Text>
                      <Text
                        style={[
                          styles.qtyChangeText,
                          {
                            color: isPositive
                              ? LedgerColors.ledgerGreen
                              : LedgerColors.crimson,
                          },
                        ]}
                      >
                        {isPositive ? `+${item.qty_change}` : item.qty_change}{" "}
                        {product.unit}
                      </Text>
                    </View>
                  </View>
                );
              }}
            />
          )}
        </View>
      </View>
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
    height: "75%",
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
  centerBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    fontSize: 14,
    color: LedgerColors.inkSecondary,
  },
  movementCard: {
    backgroundColor: LedgerColors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: LedgerColors.ruleBorder,
    padding: 12,
    marginBottom: 8,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    gap: 4,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "bold",
    textTransform: "uppercase",
  },
  dateText: {
    fontSize: 11,
    color: LedgerColors.inkMuted,
  },
  cardContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  noteText: {
    flex: 1,
    fontSize: 13,
    color: LedgerColors.inkText,
    marginRight: 10,
  },
  qtyChangeText: {
    fontSize: 16,
    fontWeight: "bold",
    fontVariant: ["tabular-nums"],
  },
});

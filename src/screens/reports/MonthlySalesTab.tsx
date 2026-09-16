import React from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  DimensionValue,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { MonthlySalesSummary } from "../../repositories/reportsRepository";
import { LedgerColors } from "../../theme/colors";
import { Sale } from "../../database/types";

interface MonthlySalesTabProps {
  summary: MonthlySalesSummary;
  onSelectSale: (sale: Sale) => void;
}

export const MonthlySalesTab: React.FC<MonthlySalesTabProps> = ({
  summary,
  onSelectSale,
}) => {
  const {
    totalRevenue,
    totalBills,
    totalItemsSold,
    averageBillValue,
    paymentBreakdown,
    topSellingProducts,
    sales,
  } = summary;

  const totalPayments =
    paymentBreakdown.cash +
    paymentBreakdown.upi +
    paymentBreakdown.card +
    paymentBreakdown.split;

  const getPercent = (amount: number): number => {
    if (totalPayments <= 0) return 0;
    return Math.round((amount / totalPayments) * 100);
  };

  return (
    <View style={styles.container}>
      {/* 4 Metric Counter Cards */}
      <View style={styles.metricsGrid}>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>TOTAL REVENUE</Text>
          <Text style={styles.metricValue}>₹{totalRevenue.toFixed(0)}</Text>
          <Text style={styles.metricSub}>{totalBills} invoices</Text>
        </View>

        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>ITEMS SOLD</Text>
          <Text style={styles.metricValue}>{totalItemsSold}</Text>
          <Text style={styles.metricSub}>units</Text>
        </View>

        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>AVG BILL</Text>
          <Text style={styles.metricValue}>₹{averageBillValue.toFixed(0)}</Text>
          <Text style={styles.metricSub}>per sale</Text>
        </View>

        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>TOTAL BILLS</Text>
          <Text style={styles.metricValue}>{totalBills}</Text>
          <Text style={styles.metricSub}>customers</Text>
        </View>
      </View>

      {/* Payment Breakdown Card */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Payment Mode Breakdown</Text>
        <View style={styles.paymentList}>
          {/* Cash */}
          <View style={styles.paymentRow}>
            <View style={styles.paymentLeft}>
              <Ionicons
                name="cash-outline"
                size={16}
                color={LedgerColors.ledgerGreen}
              />
              <Text style={styles.paymentName}>Cash</Text>
            </View>
            <View style={styles.barContainer}>
              <View
                style={[
                  styles.barFill,
                  {
                    width:
                      `${getPercent(paymentBreakdown.cash)}%` as DimensionValue,
                    backgroundColor: LedgerColors.ledgerGreen,
                  },
                ]}
              />
            </View>
            <Text style={styles.paymentAmt}>
              ₹{paymentBreakdown.cash.toFixed(0)}
            </Text>
            <Text style={styles.paymentPct}>
              ({getPercent(paymentBreakdown.cash)}%)
            </Text>
          </View>

          {/* UPI */}
          <View style={styles.paymentRow}>
            <View style={styles.paymentLeft}>
              <Ionicons
                name="qr-code-outline"
                size={16}
                color={LedgerColors.ledgerBlue}
              />
              <Text style={styles.paymentName}>UPI / QR</Text>
            </View>
            <View style={styles.barContainer}>
              <View
                style={[
                  styles.barFill,
                  {
                    width:
                      `${getPercent(paymentBreakdown.upi)}%` as DimensionValue,
                    backgroundColor: LedgerColors.ledgerBlue,
                  },
                ]}
              />
            </View>
            <Text style={styles.paymentAmt}>
              ₹{paymentBreakdown.upi.toFixed(0)}
            </Text>
            <Text style={styles.paymentPct}>
              ({getPercent(paymentBreakdown.upi)}%)
            </Text>
          </View>

          {/* Card */}
          <View style={styles.paymentRow}>
            <View style={styles.paymentLeft}>
              <Ionicons
                name="card-outline"
                size={16}
                color={LedgerColors.ledgerPurple}
              />
              <Text style={styles.paymentName}>Card</Text>
            </View>
            <View style={styles.barContainer}>
              <View
                style={[
                  styles.barFill,
                  {
                    width:
                      `${getPercent(paymentBreakdown.card)}%` as DimensionValue,
                    backgroundColor: LedgerColors.ledgerPurple,
                  },
                ]}
              />
            </View>
            <Text style={styles.paymentAmt}>
              ₹{paymentBreakdown.card.toFixed(0)}
            </Text>
            <Text style={styles.paymentPct}>
              ({getPercent(paymentBreakdown.card)}%)
            </Text>
          </View>

          {/* Split */}
          <View style={styles.paymentRow}>
            <View style={styles.paymentLeft}>
              <Ionicons
                name="git-branch-outline"
                size={16}
                color={LedgerColors.crimson}
              />
              <Text style={styles.paymentName}>Split</Text>
            </View>
            <View style={styles.barContainer}>
              <View
                style={[
                  styles.barFill,
                  {
                    width:
                      `${getPercent(paymentBreakdown.split)}%` as DimensionValue,
                    backgroundColor: LedgerColors.crimson,
                  },
                ]}
              />
            </View>
            <Text style={styles.paymentAmt}>
              ₹{paymentBreakdown.split.toFixed(0)}
            </Text>
            <Text style={styles.paymentPct}>
              ({getPercent(paymentBreakdown.split)}%)
            </Text>
          </View>
        </View>
      </View>

      {/* Top Selling Products */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Top Selling Stationery & Books</Text>
        {topSellingProducts.length === 0 ? (
          <Text style={styles.emptyNote}>No sales recorded in this month.</Text>
        ) : (
          topSellingProducts.map((p, idx) => (
            <View key={p.productId || idx} style={styles.topProductRow}>
              <Text style={styles.rankNum}>#{idx + 1}</Text>
              <View style={{ flex: 1, marginHorizontal: 8 }}>
                <Text style={styles.topProductName} numberOfLines={1}>
                  {p.productName}
                </Text>
                <Text style={styles.topProductSub}>
                  {p.totalQty} units sold
                </Text>
              </View>
              <Text style={styles.topProductRevenue}>
                ₹{p.totalRevenue.toFixed(2)}
              </Text>
            </View>
          ))
        )}
      </View>

      {/* Sales Invoices List */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Sales Bills ({sales.length})</Text>
        {sales.length === 0 ? (
          <Text style={styles.emptyNote}>No bills generated this month.</Text>
        ) : (
          sales.map((s) => (
            <TouchableOpacity
              key={s.id}
              style={styles.saleItemRow}
              onPress={() => onSelectSale(s)}
              activeOpacity={0.7}
            >
              <View>
                <Text style={styles.saleBillNumber}>{s.bill_number}</Text>
                <Text style={styles.saleMeta}>
                  {s.sale_date ? s.sale_date.substring(0, 16) : ""} •{" "}
                  {s.customer_name || "Walk-in"}
                </Text>
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <Text style={styles.saleAmount}>
                  ₹{s.grand_total.toFixed(2)}
                </Text>
                <View style={styles.saleModePill}>
                  <Text style={styles.saleModeText}>
                    {s.payment_mode.toUpperCase()}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 24,
  },
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 10,
  },
  metricCard: {
    flex: 1,
    minWidth: "46%",
    backgroundColor: LedgerColors.surface,
    borderWidth: 1,
    borderColor: LedgerColors.ruleBorder,
    borderRadius: 8,
    padding: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: LedgerColors.inkSecondary,
    letterSpacing: 0.4,
  },
  metricValue: {
    fontSize: 22,
    fontWeight: "bold",
    color: LedgerColors.crimson,
    marginTop: 4,
    fontVariant: ["tabular-nums"],
  },
  metricSub: {
    fontSize: 11,
    color: LedgerColors.inkMuted,
    marginTop: 2,
  },
  sectionCard: {
    backgroundColor: LedgerColors.surface,
    borderWidth: 1,
    borderColor: LedgerColors.ruleBorder,
    borderRadius: 8,
    padding: 14,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: LedgerColors.inkText,
    marginBottom: 10,
    letterSpacing: 0.2,
  },
  paymentList: {
    gap: 8,
  },
  paymentRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  paymentLeft: {
    flexDirection: "row",
    alignItems: "center",
    width: 80,
    gap: 6,
  },
  paymentName: {
    fontSize: 12,
    fontWeight: "600",
    color: LedgerColors.inkText,
  },
  barContainer: {
    flex: 1,
    height: 8,
    backgroundColor: LedgerColors.parchmentDark,
    borderRadius: 4,
    overflow: "hidden",
    marginHorizontal: 8,
  },
  barFill: {
    height: "100%",
    borderRadius: 4,
  },
  paymentAmt: {
    fontSize: 12,
    fontWeight: "bold",
    color: LedgerColors.inkText,
    width: 60,
    textAlign: "right",
    fontVariant: ["tabular-nums"],
  },
  paymentPct: {
    fontSize: 11,
    color: LedgerColors.inkSecondary,
    width: 45,
    textAlign: "right",
  },
  emptyNote: {
    fontSize: 12,
    color: LedgerColors.inkMuted,
    fontStyle: "italic",
    paddingVertical: 6,
  },
  topProductRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: LedgerColors.ruleLine,
  },
  rankNum: {
    fontSize: 12,
    fontWeight: "bold",
    color: LedgerColors.crimson,
    width: 24,
  },
  topProductName: {
    fontSize: 13,
    fontWeight: "600",
    color: LedgerColors.inkText,
  },
  topProductSub: {
    fontSize: 11,
    color: LedgerColors.inkMuted,
    marginTop: 1,
  },
  topProductRevenue: {
    fontSize: 13,
    fontWeight: "bold",
    color: LedgerColors.inkText,
    fontVariant: ["tabular-nums"],
  },
  saleItemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: LedgerColors.ruleLine,
  },
  saleBillNumber: {
    fontSize: 14,
    fontWeight: "bold",
    color: LedgerColors.inkText,
  },
  saleMeta: {
    fontSize: 11,
    color: LedgerColors.inkMuted,
    marginTop: 2,
  },
  saleAmount: {
    fontSize: 14,
    fontWeight: "bold",
    color: LedgerColors.crimson,
    fontVariant: ["tabular-nums"],
  },
  saleModePill: {
    backgroundColor: LedgerColors.parchmentDark,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginTop: 2,
  },
  saleModeText: {
    fontSize: 9,
    fontWeight: "700",
    color: LedgerColors.inkSecondary,
  },
});

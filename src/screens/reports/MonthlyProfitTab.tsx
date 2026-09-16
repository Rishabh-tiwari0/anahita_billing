import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { MonthlyProfitSummary } from "../../repositories/reportsRepository";
import { LedgerColors } from "../../theme/colors";

interface MonthlyProfitTabProps {
  summary: MonthlyProfitSummary;
}

export const MonthlyProfitTab: React.FC<MonthlyProfitTabProps> = ({
  summary,
}) => {
  const {
    totalRevenue,
    totalCost,
    totalProfit,
    profitMarginPercent,
    categoryProfits,
    topProfitableProducts,
  } = summary;

  return (
    <View style={styles.container}>
      {/* Profit High-Level KPI Cards */}
      <View style={styles.metricsGrid}>
        <View
          style={[
            styles.metricCard,
            {
              backgroundColor: LedgerColors.ledgerGreenLight,
              borderColor: LedgerColors.ledgerGreenBorder,
            },
          ]}
        >
          <Text
            style={[styles.metricLabel, { color: LedgerColors.ledgerGreen }]}
          >
            TOTAL GROSS PROFIT
          </Text>
          <Text
            style={[styles.metricValue, { color: LedgerColors.ledgerGreen }]}
          >
            ₹{totalProfit.toFixed(2)}
          </Text>
          <Text style={[styles.metricSub, { color: LedgerColors.ledgerGreen }]}>
            Net Earnings
          </Text>
        </View>

        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>PROFIT MARGIN</Text>
          <Text style={styles.metricValue}>
            {profitMarginPercent.toFixed(1)}%
          </Text>
          <Text style={styles.metricSub}>Gross Margin</Text>
        </View>

        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>REVENUE (MRP)</Text>
          <Text style={styles.metricValue}>₹{totalRevenue.toFixed(0)}</Text>
          <Text style={styles.metricSub}>Sales Value</Text>
        </View>

        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>TOTAL COST (COGS)</Text>
          <Text style={styles.metricValue}>₹{totalCost.toFixed(0)}</Text>
          <Text style={styles.metricSub}>Cost of Goods</Text>
        </View>
      </View>

      {/* Category Wise Profit Table */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Category Profitability Ledger</Text>
        <Text style={styles.sectionSub}>
          Derived from historical snapshot: (selling_price - cost_price) × qty
        </Text>

        {categoryProfits.length === 0 ? (
          <Text style={styles.emptyNote}>
            No sales data available for this period.
          </Text>
        ) : (
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.th, { flex: 1.4 }]}>Category</Text>
              <Text style={[styles.th, styles.thRight, { flex: 0.8 }]}>
                Rev (₹)
              </Text>
              <Text style={[styles.th, styles.thRight, { flex: 0.9 }]}>
                Profit (₹)
              </Text>
              <Text style={[styles.th, styles.thRight, { flex: 0.8 }]}>
                Margin
              </Text>
            </View>

            {categoryProfits.map((cp, idx) => (
              <View key={idx} style={styles.tableRow}>
                <View style={{ flex: 1.4 }}>
                  <Text style={styles.catName}>{cp.category}</Text>
                  <Text style={styles.catSold}>{cp.itemsSold} sold</Text>
                </View>
                <Text style={[styles.td, styles.thRight, { flex: 0.8 }]}>
                  {cp.revenue.toFixed(0)}
                </Text>
                <Text
                  style={[
                    styles.td,
                    styles.thRight,
                    styles.profitText,
                    { flex: 0.9 },
                  ]}
                >
                  ₹{cp.profit.toFixed(0)}
                </Text>
                <Text
                  style={[
                    styles.td,
                    styles.thRight,
                    {
                      flex: 0.8,
                      fontWeight: "bold",
                      color:
                        cp.marginPercent >= 25
                          ? LedgerColors.ledgerGreen
                          : LedgerColors.inkSecondary,
                    },
                  ]}
                >
                  {cp.marginPercent.toFixed(1)}%
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Top Margin / Most Profitable Items */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Top Profitable Items</Text>
        {topProfitableProducts.length === 0 ? (
          <Text style={styles.emptyNote}>No sales recorded in this month.</Text>
        ) : (
          topProfitableProducts.map((item, idx) => (
            <View key={item.productId || idx} style={styles.productProfitRow}>
              <Text style={styles.rankNum}>#{idx + 1}</Text>
              <View style={{ flex: 1, marginHorizontal: 8 }}>
                <Text style={styles.productName} numberOfLines={1}>
                  {item.productName}
                </Text>
                <Text style={styles.productSub}>
                  {item.totalQty} sold • {item.profitMarginPercent.toFixed(1)}%
                  margin
                </Text>
              </View>
              <Text style={styles.productProfitAmount}>
                +₹{item.totalProfit.toFixed(2)}
              </Text>
            </View>
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
    color: LedgerColors.inkText,
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
    letterSpacing: 0.2,
  },
  sectionSub: {
    fontSize: 11,
    color: LedgerColors.inkMuted,
    marginTop: 2,
    marginBottom: 10,
  },
  emptyNote: {
    fontSize: 12,
    color: LedgerColors.inkMuted,
    fontStyle: "italic",
    paddingVertical: 6,
  },
  table: {
    borderWidth: 1,
    borderColor: LedgerColors.ruleLine,
    borderRadius: 6,
    overflow: "hidden",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: LedgerColors.parchmentDark,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: LedgerColors.ruleBorder,
  },
  th: {
    fontSize: 11,
    fontWeight: "bold",
    color: LedgerColors.inkText,
  },
  thRight: {
    textAlign: "right",
  },
  tableRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: LedgerColors.ruleLine,
  },
  catName: {
    fontSize: 12,
    fontWeight: "600",
    color: LedgerColors.inkText,
  },
  catSold: {
    fontSize: 10,
    color: LedgerColors.inkMuted,
  },
  td: {
    fontSize: 12,
    color: LedgerColors.inkText,
    fontVariant: ["tabular-nums"],
  },
  profitText: {
    fontWeight: "bold",
    color: LedgerColors.ledgerGreen,
  },
  productProfitRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: LedgerColors.ruleLine,
  },
  rankNum: {
    fontSize: 12,
    fontWeight: "bold",
    color: LedgerColors.ledgerGreen,
    width: 24,
  },
  productName: {
    fontSize: 13,
    fontWeight: "600",
    color: LedgerColors.inkText,
  },
  productSub: {
    fontSize: 11,
    color: LedgerColors.inkMuted,
    marginTop: 1,
  },
  productProfitAmount: {
    fontSize: 13,
    fontWeight: "bold",
    color: LedgerColors.ledgerGreen,
    fontVariant: ["tabular-nums"],
  },
});

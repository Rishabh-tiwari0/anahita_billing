import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { SaleDetail } from "../../repositories/salesRepository";
import { ShopSettings } from "../../database/types";
import { LedgerColors } from "../../theme/colors";

interface ThermalReceiptViewProps {
  sale: SaleDetail;
  settings: ShopSettings;
}

export const ThermalReceiptView: React.FC<ThermalReceiptViewProps> = ({
  sale,
  settings,
}) => {
  let splitObj: { cash?: number; upi?: number; card?: number } | null = null;
  if (sale.payment_mode === "split" && sale.payment_split_details) {
    try {
      splitObj = JSON.parse(sale.payment_split_details);
    } catch {
      splitObj = null;
    }
  }

  return (
    <View style={styles.paperWrapper}>
      {/* Top jagged tear simulation */}
      <View style={styles.jaggedEdgeTop}>
        {Array.from({ length: 24 }).map((_, i) => (
          <View key={i} style={styles.toothTop} />
        ))}
      </View>

      <View style={styles.paperContent}>
        {/* Shop Header */}
        <View style={styles.centerSection}>
          <Text style={styles.shopTitle}>{settings.shop_name}</Text>
          {settings.tagline ? (
            <Text style={styles.shopSub}>{settings.tagline}</Text>
          ) : null}
          {settings.address ? (
            <Text style={styles.shopSub}>{settings.address}</Text>
          ) : null}
          {settings.phone ? (
            <Text style={styles.shopSub}>Ph: {settings.phone}</Text>
          ) : null}
          {settings.gstin ? (
            <Text style={styles.shopSub}>
              GSTIN: <Text style={styles.boldText}>{settings.gstin}</Text>
            </Text>
          ) : null}
        </View>

        <View style={styles.doubleRule} />

        {/* Bill Meta */}
        <View style={styles.rowBetween}>
          <Text style={styles.monoText}>
            Bill No: <Text style={styles.boldText}>{sale.bill_number}</Text>
          </Text>
          <Text style={styles.monoText}>
            {sale.sale_date ? sale.sale_date.substring(0, 16) : ""}
          </Text>
        </View>
        <View style={styles.rowBetween}>
          <Text style={styles.monoText}>
            Cust: {sale.customer_name || "Walk-in"}
          </Text>
          <Text style={[styles.monoText, styles.boldText]}>
            {sale.payment_mode.toUpperCase()}
          </Text>
        </View>

        <View style={styles.dashedRule} />

        {/* Table Headers */}
        <View style={styles.tableHeader}>
          <Text style={[styles.monoText, styles.boldText, { flex: 1 }]}>
            ITEM
          </Text>
          <Text
            style={[
              styles.monoText,
              styles.boldText,
              styles.rightText,
              { width: 45 },
            ]}
          >
            QTY
          </Text>
          <Text
            style={[
              styles.monoText,
              styles.boldText,
              styles.rightText,
              { width: 55 },
            ]}
          >
            RATE
          </Text>
          <Text
            style={[
              styles.monoText,
              styles.boldText,
              styles.rightText,
              { width: 65 },
            ]}
          >
            AMOUNT
          </Text>
        </View>
        <View style={styles.dashedRule} />

        {/* Table Rows */}
        {sale.items.map((item, idx) => (
          <View key={idx} style={styles.itemRow}>
            <View style={styles.itemMain}>
              <Text style={[styles.monoText, styles.boldText, { flex: 1 }]}>
                {item.product_name_snapshot}
              </Text>
              <Text style={[styles.monoText, styles.rightText, { width: 45 }]}>
                {item.qty}
              </Text>
              <Text style={[styles.monoText, styles.rightText, { width: 55 }]}>
                {item.selling_price_at_sale.toFixed(2)}
              </Text>
              <Text
                style={[
                  styles.monoText,
                  styles.boldText,
                  styles.rightText,
                  { width: 65 },
                ]}
              >
                {item.line_total.toFixed(2)}
              </Text>
            </View>
            {item.gst_rate_at_sale > 0 ? (
              <Text style={styles.subtext}>(GST {item.gst_rate_at_sale}%)</Text>
            ) : null}
          </View>
        ))}

        <View style={styles.dashedRule} />

        {/* Totals */}
        <View style={styles.rowBetween}>
          <Text style={styles.monoText}>Subtotal:</Text>
          <Text style={styles.monoText}>₹{sale.subtotal.toFixed(2)}</Text>
        </View>
        <View style={styles.rowBetween}>
          <Text style={styles.monoText}>GST Total:</Text>
          <Text style={styles.monoText}>₹{sale.gst_total.toFixed(2)}</Text>
        </View>
        {sale.discount > 0 ? (
          <View style={styles.rowBetween}>
            <Text style={[styles.monoText, { color: LedgerColors.crimson }]}>
              Discount:
            </Text>
            <Text style={[styles.monoText, { color: LedgerColors.crimson }]}>
              -₹{sale.discount.toFixed(2)}
            </Text>
          </View>
        ) : null}

        <View style={styles.doubleRule} />

        <View style={styles.rowBetween}>
          <Text style={styles.grandTotalLabel}>GRAND TOTAL:</Text>
          <Text style={styles.grandTotalValue}>
            ₹{sale.grand_total.toFixed(2)}
          </Text>
        </View>

        {splitObj ? (
          <View style={styles.splitBox}>
            <Text
              style={[styles.monoText, styles.boldText, { marginBottom: 2 }]}
            >
              Payment Split:
            </Text>
            {splitObj.cash ? (
              <Text style={styles.monoText}>
                • Cash: ₹{splitObj.cash.toFixed(2)}
              </Text>
            ) : null}
            {splitObj.upi ? (
              <Text style={styles.monoText}>
                • UPI: ₹{splitObj.upi.toFixed(2)}
              </Text>
            ) : null}
            {splitObj.card ? (
              <Text style={styles.monoText}>
                • Card: ₹{splitObj.card.toFixed(2)}
              </Text>
            ) : null}
          </View>
        ) : null}

        <View style={styles.dashedRule} />

        {/* Footer */}
        <View style={styles.centerSection}>
          <Text style={styles.footerText}>
            {settings.receipt_footer || "Thank you for shopping with us!"}
          </Text>
          <Text style={styles.barcodePlaceholder}>
            ||| | ||||| || ||||| | ||| |||| |
          </Text>
          <Text style={styles.barcodeText}>* {sale.bill_number} *</Text>
        </View>
      </View>

      {/* Bottom jagged tear simulation */}
      <View style={styles.jaggedEdgeBottom}>
        {Array.from({ length: 24 }).map((_, i) => (
          <View key={i} style={styles.toothBottom} />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  paperWrapper: {
    marginHorizontal: 16,
    marginVertical: 10,
    backgroundColor: "#FFFFFF",
    shadowColor: "#2B231A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  paperContent: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  centerSection: {
    alignItems: "center",
    marginVertical: 4,
  },
  shopTitle: {
    fontFamily: "Courier",
    fontSize: 16,
    fontWeight: "bold",
    color: "#111827",
    textAlign: "center",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  shopSub: {
    fontFamily: "Courier",
    fontSize: 11,
    color: "#4B5563",
    textAlign: "center",
    marginTop: 1,
  },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 2,
  },
  monoText: {
    fontFamily: "Courier",
    fontSize: 12,
    color: "#1F2937",
  },
  boldText: {
    fontWeight: "bold",
  },
  rightText: {
    textAlign: "right",
  },
  tableHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 2,
  },
  itemRow: {
    marginVertical: 3,
  },
  itemMain: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  subtext: {
    fontFamily: "Courier",
    fontSize: 10,
    color: "#6B7280",
    marginLeft: 2,
  },
  dashedRule: {
    borderTopWidth: 1,
    borderTopColor: "#9CA3AF",
    borderStyle: "dashed",
    marginVertical: 6,
  },
  doubleRule: {
    borderTopWidth: 2,
    borderTopColor: "#111827",
    marginVertical: 6,
  },
  grandTotalLabel: {
    fontFamily: "Courier",
    fontSize: 14,
    fontWeight: "bold",
    color: "#111827",
  },
  grandTotalValue: {
    fontFamily: "Courier",
    fontSize: 16,
    fontWeight: "bold",
    color: "#111827",
  },
  splitBox: {
    backgroundColor: "#F3F4F6",
    padding: 6,
    borderRadius: 4,
    marginVertical: 6,
  },
  footerText: {
    fontFamily: "Courier",
    fontSize: 11,
    color: "#4B5563",
    textAlign: "center",
    lineHeight: 15,
  },
  barcodePlaceholder: {
    fontFamily: "Courier",
    fontSize: 14,
    letterSpacing: 2,
    color: "#111827",
    marginTop: 8,
    fontWeight: "bold",
  },
  barcodeText: {
    fontFamily: "Courier",
    fontSize: 11,
    color: "#374151",
    marginTop: 2,
  },
  jaggedEdgeTop: {
    flexDirection: "row",
    height: 6,
    overflow: "hidden",
  },
  toothTop: {
    width: 14,
    height: 6,
    backgroundColor: LedgerColors.parchment,
    transform: [{ rotate: "45deg" }, { translateY: -4 }],
  },
  jaggedEdgeBottom: {
    flexDirection: "row",
    height: 6,
    overflow: "hidden",
  },
  toothBottom: {
    width: 14,
    height: 6,
    backgroundColor: LedgerColors.parchment,
    transform: [{ rotate: "45deg" }, { translateY: 4 }],
  },
});

import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { Header } from "../../components/common/Header";
import { LedgerColors } from "../../theme/colors";
import { commonStyles } from "../../theme/styles";
import {
  reportsRepository,
  MonthlySalesSummary,
  MonthlyProfitSummary,
} from "../../repositories/reportsRepository";
import { settingsRepository } from "../../repositories/settingsRepository";
import {
  salesRepository,
  SaleDetail,
} from "../../repositories/salesRepository";
import { ShopSettings, Sale } from "../../database/types";
import { MonthlySalesTab } from "./MonthlySalesTab";
import { MonthlyProfitTab } from "./MonthlyProfitTab";
import { ReceiptModal } from "../billing/ReceiptModal";

export const ReportsScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"sales" | "profit">("sales");

  // Month navigation: format "YYYY-MM"
  const [selectedDate, setSelectedDate] = useState(() => new Date());

  const [loading, setLoading] = useState(false);
  const [salesSummary, setSalesSummary] = useState<MonthlySalesSummary | null>(
    null,
  );
  const [profitSummary, setProfitSummary] =
    useState<MonthlyProfitSummary | null>(null);
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

  const [selectedSaleDetail, setSelectedSaleDetail] =
    useState<SaleDetail | null>(null);
  const [receiptVisible, setReceiptVisible] = useState(false);

  const getYearMonthString = (date: Date): string => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    return `${y}-${m}`;
  };

  const getMonthDisplay = (date: Date): string => {
    return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  };

  const changeMonth = (delta: number) => {
    setSelectedDate((prev) => {
      const next = new Date(prev);
      next.setMonth(next.getMonth() + delta);
      return next;
    });
  };

  const loadData = async () => {
    const ym = getYearMonthString(selectedDate);
    try {
      setLoading(true);
      const [salesData, profitData, shopSettings] = await Promise.all([
        reportsRepository.getMonthlySalesSummary(ym),
        reportsRepository.getMonthlyProfitSummary(ym),
        settingsRepository.getSettings(),
      ]);
      setSalesSummary(salesData);
      setProfitSummary(profitData);
      setSettings(shopSettings);
    } catch (err) {
      console.error("Failed to load reports:", err);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [selectedDate]),
  );

  const handleSelectSale = async (sale: Sale) => {
    try {
      const detail = await salesRepository.getSaleById(sale.id);
      if (detail) {
        setSelectedSaleDetail(detail);
        setReceiptVisible(true);
      }
    } catch (err) {
      console.error("Failed to load sale detail:", err);
    }
  };

  return (
    <View style={commonStyles.container}>
      <Header
        title="Reports & Accounts"
        subtitle="Monthly Financial Statement"
      />

      {/* Month Selector Bar */}
      <View style={styles.monthSelectorBar}>
        <TouchableOpacity
          style={styles.monthArrowBtn}
          onPress={() => changeMonth(-1)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons
            name="chevron-back"
            size={20}
            color={LedgerColors.inkText}
          />
        </TouchableOpacity>

        <View style={styles.monthTitleBox}>
          <Ionicons
            name="calendar-outline"
            size={16}
            color={LedgerColors.crimson}
          />
          <Text style={styles.monthTitleText}>
            {getMonthDisplay(selectedDate)}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.monthArrowBtn}
          onPress={() => changeMonth(1)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons
            name="chevron-forward"
            size={20}
            color={LedgerColors.inkText}
          />
        </TouchableOpacity>
      </View>

      {/* Segment Switcher: Sales vs Profit */}
      <View style={styles.segmentContainer}>
        <TouchableOpacity
          style={[
            styles.segmentBtn,
            activeTab === "sales" && styles.segmentBtnActive,
          ]}
          onPress={() => setActiveTab("sales")}
        >
          <Ionicons
            name="trending-up-outline"
            size={16}
            color={
              activeTab === "sales"
                ? LedgerColors.crimson
                : LedgerColors.inkSecondary
            }
          />
          <Text
            style={[
              styles.segmentText,
              activeTab === "sales" && styles.segmentTextActive,
            ]}
          >
            Monthly Sales
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.segmentBtn,
            activeTab === "profit" && styles.segmentBtnActive,
          ]}
          onPress={() => setActiveTab("profit")}
        >
          <Ionicons
            name="cash-outline"
            size={16}
            color={
              activeTab === "profit"
                ? LedgerColors.crimson
                : LedgerColors.inkSecondary
            }
          />
          <Text
            style={[
              styles.segmentText,
              activeTab === "profit" && styles.segmentTextActive,
            ]}
          >
            Monthly Profit
          </Text>
        </TouchableOpacity>
      </View>

      {/* Report Content */}
      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={LedgerColors.crimson} />
        </View>
      ) : (
        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
          {activeTab === "sales" && salesSummary && (
            <MonthlySalesTab
              summary={salesSummary}
              onSelectSale={handleSelectSale}
            />
          )}
          {activeTab === "profit" && profitSummary && (
            <MonthlyProfitTab summary={profitSummary} />
          )}
        </ScrollView>
      )}

      {/* Receipt Modal for tapped invoice */}
      <ReceiptModal
        visible={receiptVisible}
        sale={selectedSaleDetail}
        settings={settings}
        onClose={() => setReceiptVisible(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  monthSelectorBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: LedgerColors.surface,
    borderBottomWidth: 1,
    borderBottomColor: LedgerColors.ruleBorder,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  monthArrowBtn: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: LedgerColors.parchmentLight,
    borderWidth: 1,
    borderColor: LedgerColors.ruleBorder,
  },
  monthTitleBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  monthTitleText: {
    fontSize: 16,
    fontWeight: "bold",
    color: LedgerColors.inkText,
  },
  segmentContainer: {
    flexDirection: "row",
    backgroundColor: LedgerColors.parchmentDark,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: LedgerColors.ruleBorder,
    marginHorizontal: 12,
    marginTop: 10,
    marginBottom: 4,
    padding: 3,
  },
  segmentBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    borderRadius: 6,
    gap: 6,
  },
  segmentBtnActive: {
    backgroundColor: LedgerColors.surface,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  segmentText: {
    fontSize: 13,
    fontWeight: "600",
    color: LedgerColors.inkSecondary,
  },
  segmentTextActive: {
    color: LedgerColors.crimson,
    fontWeight: "bold",
  },
  loadingBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});

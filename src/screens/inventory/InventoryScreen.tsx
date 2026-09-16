import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ScrollView,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { Header } from "../../components/common/Header";
import { SearchBar } from "../../components/common/SearchBar";
import { Button } from "../../components/common/Button";
import { LedgerColors } from "../../theme/colors";
import { commonStyles } from "../../theme/styles";
import { Product } from "../../database/types";
import { productRepository } from "../../repositories/productRepository";
import { settingsRepository } from "../../repositories/settingsRepository";
import { ProductFormModal } from "./ProductFormModal";
import { StockAdjustmentModal } from "./StockAdjustmentModal";
import { StockHistoryModal } from "./StockHistoryModal";
import { BarcodeScannerModal } from "../billing/BarcodeScannerModal";

export const InventoryScreen: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [lowStockFilter, setLowStockFilter] = useState(false);
  const [lowStockCount, setLowStockCount] = useState(0);
  const [threshold, setThreshold] = useState(5);

  // Modals
  const [formModalVisible, setFormModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [adjustmentModalVisible, setAdjustmentModalVisible] = useState(false);
  const [adjustingProduct, setAdjustingProduct] = useState<Product | null>(
    null,
  );
  const [adjustmentMode, setAdjustmentMode] = useState<
    "purchase" | "correction"
  >("purchase");

  const [historyModalVisible, setHistoryModalVisible] = useState(false);
  const [historyProduct, setHistoryProduct] = useState<Product | null>(null);

  const [scannerVisible, setScannerVisible] = useState(false);

  const loadData = async () => {
    try {
      const settings = await settingsRepository.getSettings();
      setThreshold(settings.low_stock_threshold || 5);

      const count = await productRepository.getLowStockCount(
        settings.low_stock_threshold || 5,
      );
      setLowStockCount(count);

      const cats = await productRepository.getAllCategories();
      setCategories(["All", ...cats]);

      const list = await productRepository.getAllProducts({
        search: searchQuery,
        category: selectedCategory,
        lowStockOnly: lowStockFilter,
        threshold: settings.low_stock_threshold || 5,
      });
      setProducts(list);
    } catch (err) {
      console.error("Failed to load inventory data:", err);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [searchQuery, selectedCategory, lowStockFilter]),
  );

  const handleOpenAdjustment = (
    product: Product,
    mode: "purchase" | "correction",
  ) => {
    setAdjustingProduct(product);
    setAdjustmentMode(mode);
    setAdjustmentModalVisible(true);
  };

  const handleOpenEdit = (product: Product) => {
    setEditingProduct(product);
    setFormModalVisible(true);
  };

  const handleOpenHistory = (product: Product) => {
    setHistoryProduct(product);
    setHistoryModalVisible(true);
  };

  const handleAddNew = () => {
    setEditingProduct(null);
    setFormModalVisible(true);
  };

  const renderStockBadge = (qty: number, unit: string) => {
    if (qty <= 0) {
      return (
        <View
          style={[
            styles.stockBadge,
            { backgroundColor: "#FEE2E2", borderColor: "#F87171" },
          ]}
        >
          <Ionicons
            name="alert-circle"
            size={12}
            color={LedgerColors.crimson}
          />
          <Text
            style={[styles.stockBadgeText, { color: LedgerColors.crimson }]}
          >
            Out of Stock (0 {unit})
          </Text>
        </View>
      );
    } else if (qty <= threshold) {
      return (
        <View
          style={[
            styles.stockBadge,
            {
              backgroundColor: LedgerColors.ledgerAmberLight,
              borderColor: LedgerColors.ledgerAmberBorder,
            },
          ]}
        >
          <Ionicons
            name="warning-outline"
            size={12}
            color={LedgerColors.ledgerAmber}
          />
          <Text
            style={[styles.stockBadgeText, { color: LedgerColors.ledgerAmber }]}
          >
            Low: {qty} {unit}
          </Text>
        </View>
      );
    } else {
      return (
        <View
          style={[
            styles.stockBadge,
            {
              backgroundColor: LedgerColors.ledgerGreenLight,
              borderColor: LedgerColors.ledgerGreenBorder,
            },
          ]}
        >
          <Ionicons
            name="checkmark-circle-outline"
            size={12}
            color={LedgerColors.ledgerGreen}
          />
          <Text
            style={[styles.stockBadgeText, { color: LedgerColors.ledgerGreen }]}
          >
            In Stock: {qty} {unit}
          </Text>
        </View>
      );
    }
  };

  return (
    <View style={commonStyles.container}>
      <Header
        title="Inventory & Stock"
        subtitle={`Total Products: ${products.length}`}
        rightAction={{
          icon: "add-circle",
          label: "Add",
          onPress: handleAddNew,
        }}
      />

      {/* Search Bar */}
      <SearchBar
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder="Filter by name, barcode, or category..."
        onScanPress={() => setScannerVisible(true)}
      />

      {/* Filter Chips Bar */}
      <View style={styles.filterSection}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipRow}
        >
          {/* Low Stock Alert Filter Chip */}
          <TouchableOpacity
            style={[
              styles.filterChip,
              lowStockFilter && styles.lowStockChipActive,
            ]}
            onPress={() => setLowStockFilter((prev) => !prev)}
          >
            <Ionicons
              name="warning-outline"
              size={14}
              color={
                lowStockFilter ? LedgerColors.crimson : LedgerColors.ledgerAmber
              }
            />
            <Text
              style={[
                styles.chipText,
                lowStockFilter
                  ? styles.lowStockTextActive
                  : { color: LedgerColors.ledgerAmber },
              ]}
            >
              Low Stock ({lowStockCount})
            </Text>
          </TouchableOpacity>

          {/* Categories */}
          {categories.map((cat) => {
            const active = selectedCategory === cat && !lowStockFilter;
            return (
              <TouchableOpacity
                key={cat}
                style={[styles.filterChip, active && styles.filterChipActive]}
                onPress={() => {
                  setSelectedCategory(cat);
                  setLowStockFilter(false);
                }}
              >
                <Text
                  style={[styles.chipText, active && styles.chipTextActive]}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Products List */}
      {products.length === 0 ? (
        <View style={styles.emptyBox}>
          <Ionicons
            name="file-tray-outline"
            size={48}
            color={LedgerColors.ruleDark}
          />
          <Text style={styles.emptyTitle}>No Products Found</Text>
          <Text style={styles.emptySubtitle}>
            No stationery or book matches your current search or category
            filter.
          </Text>
          <Button
            title="Create Product"
            onPress={handleAddNew}
            variant="primary"
            size="sm"
            icon="add-outline"
            style={{ marginTop: 14 }}
          />
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <View style={styles.productCard}>
              <View style={styles.cardTop}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.productName}>{item.name}</Text>
                  <View style={styles.metaRow}>
                    <Text style={styles.categoryPill}>{item.category}</Text>
                    {item.barcode ? (
                      <Text style={styles.barcodeText}>[{item.barcode}]</Text>
                    ) : null}
                  </View>
                </View>
                {renderStockBadge(item.stock_qty, item.unit)}
              </View>

              <View style={styles.pricingRow}>
                <View style={styles.priceStat}>
                  <Text style={styles.priceLabel}>Cost Price</Text>
                  <Text style={styles.costValue}>
                    ₹{item.cost_price.toFixed(2)}
                  </Text>
                </View>
                <View style={styles.priceStat}>
                  <Text style={styles.priceLabel}>Selling Rate</Text>
                  <Text style={styles.sellValue}>
                    ₹{item.selling_price.toFixed(2)}
                  </Text>
                </View>
                <View style={styles.priceStat}>
                  <Text style={styles.priceLabel}>GST Rate</Text>
                  <Text style={styles.gstValue}>
                    {item.gst_rate > 0 ? `${item.gst_rate}%` : "0%"}
                  </Text>
                </View>
                <View style={styles.priceStat}>
                  <Text style={styles.priceLabel}>Est. Profit</Text>
                  <Text style={styles.profitValue}>
                    ₹{(item.selling_price - item.cost_price).toFixed(2)}
                  </Text>
                </View>
              </View>

              {/* Action Buttons */}
              <View style={styles.actionsRow}>
                <TouchableOpacity
                  style={[
                    styles.actionBtn,
                    { backgroundColor: LedgerColors.ledgerGreenLight },
                  ]}
                  onPress={() => handleOpenAdjustment(item, "purchase")}
                >
                  <Ionicons
                    name="add"
                    size={14}
                    color={LedgerColors.ledgerGreen}
                  />
                  <Text
                    style={[
                      styles.actionBtnText,
                      { color: LedgerColors.ledgerGreen },
                    ]}
                  >
                    + Stock
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.actionBtn,
                    { backgroundColor: LedgerColors.parchmentDark },
                  ]}
                  onPress={() => handleOpenAdjustment(item, "correction")}
                >
                  <Ionicons
                    name="build-outline"
                    size={13}
                    color={LedgerColors.inkSecondary}
                  />
                  <Text
                    style={[
                      styles.actionBtnText,
                      { color: LedgerColors.inkSecondary },
                    ]}
                  >
                    Audit
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.actionBtn,
                    { backgroundColor: LedgerColors.parchmentDark },
                  ]}
                  onPress={() => handleOpenHistory(item)}
                >
                  <Ionicons
                    name="time-outline"
                    size={13}
                    color={LedgerColors.inkSecondary}
                  />
                  <Text
                    style={[
                      styles.actionBtnText,
                      { color: LedgerColors.inkSecondary },
                    ]}
                  >
                    History
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.actionBtn,
                    { backgroundColor: LedgerColors.crimsonLight },
                  ]}
                  onPress={() => handleOpenEdit(item)}
                >
                  <Ionicons
                    name="create-outline"
                    size={13}
                    color={LedgerColors.crimson}
                  />
                  <Text
                    style={[
                      styles.actionBtnText,
                      { color: LedgerColors.crimson },
                    ]}
                  >
                    Edit
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}

      {/* Modals */}
      <ProductFormModal
        visible={formModalVisible}
        productToEdit={editingProduct}
        onClose={() => setFormModalVisible(false)}
        onSaved={loadData}
      />

      <StockAdjustmentModal
        visible={adjustmentModalVisible}
        product={adjustingProduct}
        initialMode={adjustmentMode}
        onClose={() => setAdjustmentModalVisible(false)}
        onSaved={loadData}
      />

      <StockHistoryModal
        visible={historyModalVisible}
        product={historyProduct}
        onClose={() => setHistoryModalVisible(false)}
      />

      <BarcodeScannerModal
        visible={scannerVisible}
        onClose={() => setScannerVisible(false)}
        onScanned={(code) => {
          setSearchQuery(code);
          setScannerVisible(false);
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  filterSection: {
    paddingBottom: 6,
  },
  chipRow: {
    paddingHorizontal: 12,
    gap: 8,
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: LedgerColors.surface,
    borderWidth: 1,
    borderColor: LedgerColors.ruleBorder,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 4,
  },
  filterChipActive: {
    backgroundColor: LedgerColors.crimson,
    borderColor: LedgerColors.crimsonHover,
  },
  lowStockChipActive: {
    backgroundColor: LedgerColors.crimsonLight,
    borderColor: LedgerColors.crimson,
    borderWidth: 1.5,
  },
  chipText: {
    fontSize: 12,
    fontWeight: "600",
    color: LedgerColors.inkText,
  },
  chipTextActive: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  lowStockTextActive: {
    color: LedgerColors.crimson,
    fontWeight: "bold",
  },
  listContent: {
    paddingHorizontal: 12,
    paddingTop: 6,
    paddingBottom: 24,
  },
  productCard: {
    backgroundColor: LedgerColors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: LedgerColors.ruleBorder,
    padding: 12,
    marginBottom: 10,
    shadowColor: "#241C13",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  productName: {
    fontSize: 15,
    fontWeight: "bold",
    color: LedgerColors.inkText,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 3,
  },
  categoryPill: {
    fontSize: 11,
    color: LedgerColors.inkSecondary,
    backgroundColor: LedgerColors.parchmentDark,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  barcodeText: {
    fontSize: 11,
    color: LedgerColors.inkMuted,
    fontFamily: "Courier",
  },
  stockBadge: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
  },
  stockBadgeText: {
    fontSize: 11,
    fontWeight: "700",
  },
  pricingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: LedgerColors.parchmentLight,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: LedgerColors.ruleLine,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginVertical: 6,
  },
  priceStat: {
    alignItems: "center",
  },
  priceLabel: {
    fontSize: 10,
    color: LedgerColors.inkMuted,
  },
  costValue: {
    fontSize: 12,
    color: LedgerColors.inkSecondary,
    fontWeight: "600",
    fontVariant: ["tabular-nums"],
  },
  sellValue: {
    fontSize: 13,
    color: LedgerColors.inkText,
    fontWeight: "bold",
    fontVariant: ["tabular-nums"],
  },
  gstValue: {
    fontSize: 12,
    color: LedgerColors.inkSecondary,
    fontWeight: "600",
  },
  profitValue: {
    fontSize: 12,
    color: LedgerColors.ledgerGreen,
    fontWeight: "bold",
    fontVariant: ["tabular-nums"],
  },
  actionsRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 6,
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
  },
  actionBtnText: {
    fontSize: 11,
    fontWeight: "600",
  },
  emptyBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: LedgerColors.inkText,
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 13,
    color: LedgerColors.inkSecondary,
    textAlign: "center",
    marginTop: 6,
  },
});

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Header } from "../../components/common/Header";
import { Button } from "../../components/common/Button";
import { LedgerColors } from "../../theme/colors";
import { commonStyles } from "../../theme/styles";
import { ShopSettings } from "../../database/types";
import { settingsRepository } from "../../repositories/settingsRepository";
import {
  resetDatabase,
  seedSampleData,
  getDatabasePath,
  clearAllProducts,
} from "../../database";
import { printerService } from "../../services/printerService";
import { productRepository } from "../../repositories/productRepository";
import { salesRepository } from "../../repositories/salesRepository";

export const SettingsScreen: React.FC = () => {
  const [shopName, setShopName] = useState("");
  const [tagline, setTagline] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [gstin, setGstin] = useState("");
  const [receiptFooter, setReceiptFooter] = useState("");
  const [lowStockThreshold, setLowStockThreshold] = useState("5");
  const [paperWidth, setPaperWidth] = useState<"58mm" | "80mm">("58mm");

  const [saving, setSaving] = useState(false);
  const [testingPrint, setTestingPrint] = useState(false);
  const [stats, setStats] = useState({ productsCount: 0, salesCount: 0 });
  const [dbPath, setDbPath] = useState("");

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const s = await settingsRepository.getSettings();
      setShopName(s.shop_name);
      setTagline(s.tagline);
      setAddress(s.address);
      setPhone(s.phone);
      setGstin(s.gstin);
      setReceiptFooter(s.receipt_footer);
      setLowStockThreshold(String(s.low_stock_threshold));
      setPaperWidth(s.paper_width);

      const [prods, sales, path] = await Promise.all([
        productRepository.getAllProducts(),
        salesRepository.getRecentSales(1000),
        getDatabasePath(),
      ]);
      setStats({ productsCount: prods.length, salesCount: sales.length });
      setDbPath(path);
    } catch (err) {
      console.error("Failed to load settings:", err);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const updated: Partial<ShopSettings> = {
        shop_name: shopName.trim() || "Anahita Pustak Bhandar",
        tagline: tagline.trim(),
        address: address.trim(),
        phone: phone.trim(),
        gstin: gstin.trim(),
        receipt_footer: receiptFooter.trim(),
        low_stock_threshold: parseInt(lowStockThreshold, 10) || 5,
        paper_width: paperWidth,
      };
      await settingsRepository.updateSettings(updated);
      Alert.alert(
        "Settings Saved",
        "Shop and printer settings updated successfully.",
      );
    } catch (err: any) {
      Alert.alert("Error", err?.message || "Failed to update settings.");
    } finally {
      setSaving(false);
    }
  };

  const handleTestPrint = async () => {
    try {
      setTestingPrint(true);
      const currentSettings: ShopSettings = {
        shop_name: shopName.trim() || "Anahita Pustak Bhandar",
        tagline: tagline.trim(),
        address: address.trim(),
        phone: phone.trim(),
        gstin: gstin.trim(),
        receipt_footer: receiptFooter.trim(),
        low_stock_threshold: parseInt(lowStockThreshold, 10) || 5,
        paper_width: paperWidth,
      };
      await printerService.testPrint(currentSettings);
    } catch (err: any) {
      Alert.alert(
        "Print Error",
        err?.message || "Could not print test receipt.",
      );
    } finally {
      setTestingPrint(false);
    }
  };

  const handleSeedData = async () => {
    Alert.alert(
      "Seed Sample Products",
      "Add 25+ realistic books and stationery items (Classmate notebooks, Reynolds pens, Camlin supplies, etc.) to your catalog?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Add Sample Data",
          onPress: async () => {
            try {
              await seedSampleData();
              await loadSettings();
              Alert.alert(
                "Success",
                "Sample stationery items added to inventory.",
              );
            } catch (err: any) {
              Alert.alert(
                "Error",
                err?.message || "Failed to seed sample data.",
              );
            }
          },
        },
      ],
    );
  };

  const handleClearProducts = async () => {
    Alert.alert(
      "Clear Inventory",
      "Are you sure you want to clear all products and sales? Your product catalog will be completely empty so you can start adding your own shop inventory.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear Products",
          style: "destructive",
          onPress: async () => {
            try {
              await clearAllProducts();
              await loadSettings();
              Alert.alert(
                "Inventory Cleared",
                "All sample products and sales have been removed.",
              );
            } catch (err: any) {
              Alert.alert(
                "Error",
                err?.message || "Failed to clear inventory.",
              );
            }
          },
        },
      ],
    );
  };

  const handleResetData = async () => {
    Alert.alert(
      "Reset Entire Database",
      "This will erase all sales, stock movements, and products, restoring the database to a clean initial state. This action cannot be undone!",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset Database",
          style: "destructive",
          onPress: async () => {
            try {
              await resetDatabase();
              await loadSettings();
              Alert.alert(
                "Database Reset",
                "All tables have been cleared and reset.",
              );
            } catch (err: any) {
              Alert.alert("Error", err?.message || "Failed to reset database.");
            }
          },
        },
      ],
    );
  };

  return (
    <View style={commonStyles.container}>
      <Header
        title="Settings & Counter Setup"
        subtitle="Shop profile, printer & data tools"
      />

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Counter & App Info Banner */}
        <View style={styles.infoBanner}>
          <View style={styles.infoRow}>
            <Ionicons
              name="shield-checkmark"
              size={20}
              color={LedgerColors.ledgerGreen}
            />
            <Text style={styles.infoTitle}>100% Offline SQLite POS</Text>
          </View>
          <Text style={styles.infoDesc}>
            All sales, inventories, and price snapshots are stored locally on
            this counter device. Total products: {stats.productsCount} |
            Invoices: {stats.salesCount}.
          </Text>
          {dbPath ? (
            <Text
              style={[
                styles.infoDesc,
                {
                  marginTop: 6,
                  fontFamily: "Courier",
                  fontSize: 11,
                  color: LedgerColors.inkSecondary,
                },
              ]}
              selectable
            >
              DB File: {dbPath}
            </Text>
          ) : null}
        </View>

        {/* Shop Profile Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Shop Details (Receipt Header)</Text>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Shop Name</Text>
            <TextInput
              style={styles.input}
              value={shopName}
              onChangeText={setShopName}
              placeholder="e.g. Anahita Pustak Bhandar"
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Tagline / Subtitle</Text>
            <TextInput
              style={styles.input}
              value={tagline}
              onChangeText={setTagline}
              placeholder="e.g. Books, Stationery & Counter Supplies"
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Shop Address</Text>
            <TextInput
              style={styles.input}
              value={address}
              onChangeText={setAddress}
              placeholder="e.g. Station Road, Near Town Hall, Patna"
            />
          </View>

          <View style={styles.twoCol}>
            <View style={[styles.fieldGroup, { flex: 1, marginRight: 6 }]}>
              <Text style={styles.label}>Contact Phone</Text>
              <TextInput
                style={styles.input}
                value={phone}
                onChangeText={setPhone}
                placeholder="+91 98765 43210"
                keyboardType="phone-pad"
              />
            </View>

            <View style={[styles.fieldGroup, { flex: 1, marginLeft: 6 }]}>
              <Text style={styles.label}>GSTIN / Tax ID</Text>
              <TextInput
                style={styles.input}
                value={gstin}
                onChangeText={setGstin}
                placeholder="10ABCDE1234F1Z5"
                autoCapitalize="characters"
              />
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Receipt Footer Note</Text>
            <TextInput
              style={[styles.input, { height: 60, textAlignVertical: "top" }]}
              value={receiptFooter}
              onChangeText={setReceiptFooter}
              placeholder="Thank-you message or exchange policy..."
              multiline
            />
          </View>
        </View>

        {/* Thermal Printer Settings Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Bluetooth Thermal Printer Setup</Text>
          <Text style={styles.cardDesc}>
            Configure your standard ESC/POS 58mm or 80mm wireless counter
            printer.
          </Text>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Thermal Paper Width</Text>
            <View style={styles.paperWidthRow}>
              {(["58mm", "80mm"] as ("58mm" | "80mm")[]).map((width) => {
                const active = paperWidth === width;
                return (
                  <TouchableOpacity
                    key={width}
                    style={[styles.widthBtn, active && styles.widthBtnActive]}
                    onPress={() => setPaperWidth(width)}
                  >
                    <Ionicons
                      name="receipt-outline"
                      size={18}
                      color={
                        active
                          ? LedgerColors.crimson
                          : LedgerColors.inkSecondary
                      }
                    />
                    <Text
                      style={[
                        styles.widthBtnText,
                        active && styles.widthBtnTextActive,
                      ]}
                    >
                      {width} Paper{" "}
                      {width === "58mm"
                        ? "(Standard 2-inch)"
                        : "(3-inch Large)"}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <Button
            title="Test Print Thermal Receipt"
            onPress={handleTestPrint}
            variant="outline"
            icon="print-outline"
            loading={testingPrint}
            style={{ marginTop: 6 }}
          />
        </View>

        {/* Inventory Rules */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Inventory Rules</Text>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Global Low Stock Threshold</Text>
            <Text style={styles.fieldSub}>
              Products with stock at or below this number show an amber warning.
            </Text>
            <TextInput
              style={[styles.input, { width: 100 }]}
              value={lowStockThreshold}
              onChangeText={setLowStockThreshold}
              keyboardType="number-pad"
            />
          </View>
        </View>

        {/* Save Settings Button */}
        <Button
          title="Save Settings"
          onPress={handleSave}
          variant="primary"
          size="lg"
          loading={saving}
          icon="save-outline"
          fullWidth
          style={{ marginBottom: 16 }}
        />

        {/* Data Tools */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Database & Catalog Tools</Text>
          <Text style={styles.cardDesc}>
            Seed sample stationery items or perform a clean database reset.
          </Text>

          <View style={{ gap: 10, marginTop: 8 }}>
            <Button
              title="Seed Sample Stationery Catalog"
              onPress={handleSeedData}
              variant="outline"
              icon="library-outline"
            />
            <Button
              title="Clear All Products from Inventory"
              onPress={handleClearProducts}
              variant="danger"
              icon="trash-outline"
            />
            <Button
              title="Clear / Reset Entire Database"
              onPress={handleResetData}
              variant="danger"
              icon="trash-bin-outline"
            />
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    padding: 12,
    paddingBottom: 30,
  },
  infoBanner: {
    backgroundColor: LedgerColors.ledgerGreenLight,
    borderWidth: 1,
    borderColor: LedgerColors.ledgerGreenBorder,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: LedgerColors.ledgerGreen,
  },
  infoDesc: {
    fontSize: 12,
    color: LedgerColors.ledgerGreen,
    lineHeight: 16,
  },
  card: {
    backgroundColor: LedgerColors.surface,
    borderWidth: 1,
    borderColor: LedgerColors.ruleBorder,
    borderRadius: 8,
    padding: 14,
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: LedgerColors.inkText,
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: 12,
    color: LedgerColors.inkSecondary,
    marginBottom: 10,
    lineHeight: 16,
  },
  fieldGroup: {
    marginBottom: 12,
  },
  twoCol: {
    flexDirection: "row",
  },
  label: {
    fontSize: 12,
    fontWeight: "600",
    color: LedgerColors.inkText,
    marginBottom: 4,
  },
  fieldSub: {
    fontSize: 11,
    color: LedgerColors.inkMuted,
    marginBottom: 6,
  },
  input: {
    backgroundColor: LedgerColors.parchmentLight,
    borderWidth: 1,
    borderColor: LedgerColors.ruleBorder,
    borderRadius: 6,
    paddingHorizontal: 12,
    height: 42,
    fontSize: 14,
    color: LedgerColors.inkText,
  },
  paperWidthRow: {
    flexDirection: "row",
    gap: 8,
  },
  widthBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: LedgerColors.parchmentLight,
    borderWidth: 1,
    borderColor: LedgerColors.ruleBorder,
    borderRadius: 6,
    paddingVertical: 10,
    gap: 6,
  },
  widthBtnActive: {
    backgroundColor: LedgerColors.crimsonLight,
    borderColor: LedgerColors.crimson,
    borderWidth: 1.5,
  },
  widthBtnText: {
    fontSize: 12,
    fontWeight: "600",
    color: LedgerColors.inkSecondary,
  },
  widthBtnTextActive: {
    color: LedgerColors.crimson,
    fontWeight: "bold",
  },
});

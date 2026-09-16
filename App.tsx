import React, { useEffect, useState } from "react";
import { View, Text, ActivityIndicator, StyleSheet, Platform } from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { NavigationContainer } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import * as NavigationBar from "expo-navigation-bar";
import { initDatabase } from "./src/database";
import { RootNavigator } from "./src/navigation/RootNavigator";
import { LedgerColors } from "./src/theme/colors";

export default function App() {
  const [dbReady, setDbReady] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);

  useEffect(() => {
    async function prepare() {
      try {
        if (Platform.OS === "android") {
          try {
            await NavigationBar.setBackgroundColorAsync(LedgerColors.parchmentLight);
            await NavigationBar.setButtonStyleAsync("dark");
            await NavigationBar.setBehaviorAsync("overlay-swipe");
            await NavigationBar.setVisibilityAsync("hidden");
          } catch (navBarErr) {
            console.warn("Could not configure NavigationBar:", navBarErr);
          }
        }
        await initDatabase();
        setDbReady(true);
      } catch (err: any) {
        console.error("Database initialization error:", err);
        setInitError(err?.message || "Failed to initialize local database");
      }
    }
    prepare();
  }, []);

  if (!dbReady) {
    return (
      <View style={styles.splashContainer}>
        <View style={styles.splashCard}>
          <View style={styles.logoBadge}>
            <Ionicons name="book" size={32} color={LedgerColors.crimson} />
          </View>
          <Text style={styles.splashTitle}>ANAHITA PUSTAK BHANDAR</Text>
          <Text style={styles.splashSubtitle}>
            Point of Sale & Khata System
          </Text>
          {initError ? (
            <Text style={styles.errorText}>Error: {initError}</Text>
          ) : (
            <View style={styles.loadingRow}>
              <ActivityIndicator size="small" color={LedgerColors.crimson} />
              <Text style={styles.loadingText}>
                Opening local ledger database...
              </Text>
            </View>
          )}
        </View>
        <StatusBar style="dark" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <RootNavigator />
        <StatusBar style="dark" />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    backgroundColor: LedgerColors.parchment,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  splashCard: {
    alignItems: "center",
    backgroundColor: LedgerColors.surface,
    borderWidth: 1,
    borderColor: LedgerColors.ruleBorder,
    borderRadius: 12,
    padding: 24,
    width: "100%",
    maxWidth: 320,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  logoBadge: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: LedgerColors.crimsonLight,
    borderWidth: 1.5,
    borderColor: LedgerColors.crimsonBorder,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  splashTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: LedgerColors.inkText,
    letterSpacing: 0.5,
    textAlign: "center",
  },
  splashSubtitle: {
    fontSize: 12,
    color: LedgerColors.inkSecondary,
    marginTop: 2,
    marginBottom: 16,
    textAlign: "center",
  },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
  },
  loadingText: {
    fontSize: 12,
    color: LedgerColors.inkSecondary,
  },
  errorText: {
    fontSize: 12,
    color: LedgerColors.crimson,
    textAlign: "center",
    marginTop: 8,
  },
});

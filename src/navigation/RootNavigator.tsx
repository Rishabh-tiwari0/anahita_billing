import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { RootTabParamList } from "./types";
import { BillingScreen } from "../screens/billing/BillingScreen";
import { InventoryScreen } from "../screens/inventory/InventoryScreen";
import { ReportsScreen } from "../screens/reports/ReportsScreen";
import { SettingsScreen } from "../screens/settings/SettingsScreen";
import { LedgerColors } from "../theme/colors";

const Tab = createBottomTabNavigator<RootTabParamList>();

export const RootNavigator: React.FC = () => {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      initialRouteName="BillingTab"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: LedgerColors.crimson,
        tabBarInactiveTintColor: LedgerColors.inkMuted,
        tabBarStyle: {
          backgroundColor: LedgerColors.parchmentLight,
          borderTopWidth: 1,
          borderTopColor: LedgerColors.ruleBorder,
          height: 54 + Math.max(insets.bottom, 10),
          paddingBottom: Math.max(insets.bottom, 10),
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
        },
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = "cart-outline";

          if (route.name === "BillingTab") {
            iconName = focused ? "cart" : "cart-outline";
          } else if (route.name === "InventoryTab") {
            iconName = focused ? "cube" : "cube-outline";
          } else if (route.name === "ReportsTab") {
            iconName = focused ? "bar-chart" : "bar-chart-outline";
          } else if (route.name === "SettingsTab") {
            iconName = focused ? "settings" : "settings-outline";
          }

          return <Ionicons name={iconName} size={22} color={color} />;
        },
      })}
    >
      <Tab.Screen
        name="BillingTab"
        component={BillingScreen}
        options={{ tabBarLabel: "Billing POS" }}
      />
      <Tab.Screen
        name="InventoryTab"
        component={InventoryScreen}
        options={{ tabBarLabel: "Inventory" }}
      />
      <Tab.Screen
        name="ReportsTab"
        component={ReportsScreen}
        options={{ tabBarLabel: "Reports" }}
      />
      <Tab.Screen
        name="SettingsTab"
        component={SettingsScreen}
        options={{ tabBarLabel: "Settings" }}
      />
    </Tab.Navigator>
  );
};

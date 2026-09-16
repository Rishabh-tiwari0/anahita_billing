import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { Platform } from "react-native";
import { RootTabParamList } from "./types";
import { BillingScreen } from "../screens/billing/BillingScreen";
import { InventoryScreen } from "../screens/inventory/InventoryScreen";
import { ReportsScreen } from "../screens/reports/ReportsScreen";
import { SettingsScreen } from "../screens/settings/SettingsScreen";
import { LedgerColors } from "../theme/colors";

const Tab = createBottomTabNavigator<RootTabParamList>();

export const RootNavigator: React.FC = () => {
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
          height: Platform.OS === "ios" ? 84 : 64,
          paddingBottom: Platform.OS === "ios" ? 24 : 8,
          paddingTop: 8,
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

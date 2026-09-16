import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LedgerColors } from "../../theme/colors";

interface HeaderProps {
  title: string;
  subtitle?: string;
  rightAction?: {
    icon: keyof typeof Ionicons.glyphMap;
    label?: string;
    onPress: () => void;
  };
  leftAction?: {
    icon: keyof typeof Ionicons.glyphMap;
    onPress: () => void;
  };
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  rightAction,
  leftAction,
}) => {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[styles.headerWrapper, { paddingTop: Math.max(insets.top, 12) }]}
    >
      <View style={styles.contentRow}>
        {leftAction ? (
          <TouchableOpacity
            style={styles.iconButton}
            onPress={leftAction.onPress}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons
              name={leftAction.icon}
              size={22}
              color={LedgerColors.inkText}
            />
          </TouchableOpacity>
        ) : (
          <View style={styles.stampBadge}>
            <Ionicons
              name="book-outline"
              size={16}
              color={LedgerColors.crimson}
            />
          </View>
        )}

        <View style={styles.titleContainer}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          {subtitle ? (
            <Text style={styles.subtitle} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>

        {rightAction ? (
          <TouchableOpacity
            style={[
              styles.actionButton,
              rightAction.label ? styles.actionButtonWithLabel : null,
            ]}
            onPress={rightAction.onPress}
          >
            <Ionicons
              name={rightAction.icon}
              size={18}
              color={LedgerColors.crimson}
            />
            {rightAction.label ? (
              <Text style={styles.actionLabel}>{rightAction.label}</Text>
            ) : null}
          </TouchableOpacity>
        ) : (
          <View style={{ width: 28 }} />
        )}
      </View>
      <View style={styles.bottomBorder} />
    </View>
  );
};

const styles = StyleSheet.create({
  headerWrapper: {
    backgroundColor: LedgerColors.parchmentLight,
    borderBottomWidth: 1,
    borderBottomColor: LedgerColors.ruleBorder,
  },
  contentRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  stampBadge: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: LedgerColors.crimsonLight,
    borderWidth: 1,
    borderColor: LedgerColors.crimsonBorder,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  iconButton: {
    padding: 6,
    marginRight: 8,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: LedgerColors.inkText,
    letterSpacing: 0.3,
  },
  subtitle: {
    fontSize: 11,
    color: LedgerColors.inkSecondary,
    marginTop: 1,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: LedgerColors.crimsonLight,
    borderWidth: 1,
    borderColor: LedgerColors.crimsonBorder,
  },
  actionButtonWithLabel: {
    paddingHorizontal: 10,
  },
  actionLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: LedgerColors.crimson,
    marginLeft: 4,
  },
  bottomBorder: {
    height: 2,
    backgroundColor: LedgerColors.ruleLine,
  },
});

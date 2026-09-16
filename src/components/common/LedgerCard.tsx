import React from "react";
import { View, Text, StyleSheet, ViewStyle } from "react-native";
import { LedgerColors } from "../../theme/colors";

interface LedgerCardProps {
  title?: string;
  subtitle?: string;
  headerAction?: React.ReactNode;
  children: React.ReactNode;
  style?: ViewStyle;
}

export const LedgerCard: React.FC<LedgerCardProps> = ({
  title,
  subtitle,
  headerAction,
  children,
  style,
}) => {
  return (
    <View style={[styles.card, style]}>
      {title ? (
        <View style={styles.header}>
          <View style={styles.titleArea}>
            <Text style={styles.title}>{title}</Text>
            {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
          </View>
          {headerAction ? <View>{headerAction}</View> : null}
        </View>
      ) : null}
      {title ? <View style={styles.divider} /> : null}
      <View style={styles.body}>{children}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: LedgerColors.surface,
    borderWidth: 1,
    borderColor: LedgerColors.ruleBorder,
    borderRadius: 8,
    marginHorizontal: 12,
    marginVertical: 6,
    shadowColor: "#30261A",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 8,
  },
  titleArea: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: "700",
    color: LedgerColors.inkText,
    letterSpacing: 0.2,
  },
  subtitle: {
    fontSize: 11,
    color: LedgerColors.inkSecondary,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: LedgerColors.ruleLine,
  },
  body: {
    padding: 12,
  },
});

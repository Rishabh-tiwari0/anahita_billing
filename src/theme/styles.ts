import { StyleSheet, ViewStyle } from "react-native";
import { LedgerColors } from "./colors";

export const commonStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: LedgerColors.parchment,
  },
  ledgerCard: {
    backgroundColor: LedgerColors.surface,
    borderWidth: 1,
    borderColor: LedgerColors.ruleBorder,
    borderRadius: 8,
    padding: 14,
    marginHorizontal: 12,
    marginVertical: 6,
    shadowColor: "#382B1D",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  ruledDivider: {
    height: 1,
    backgroundColor: LedgerColors.ruleLine,
    marginVertical: 10,
  },
  dottedDivider: {
    borderWidth: 1,
    borderColor: LedgerColors.ruleBorder,
    borderStyle: "dashed",
    borderRadius: 1,
    marginVertical: 8,
  },
  rowBetween: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  tagBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  monoNum: {
    fontVariant: ["tabular-nums"],
    letterSpacing: 0.2,
  },
});

import React from "react";
import { View, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LedgerColors } from "../../theme/colors";

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  onScanPress?: () => void;
  onClear?: () => void;
  autoFocus?: boolean;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChangeText,
  placeholder = "Search by name, barcode, or category...",
  onScanPress,
  onClear,
  autoFocus = false,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.searchBox}>
        <Ionicons
          name="search"
          size={18}
          color={LedgerColors.inkMuted}
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={LedgerColors.inkMuted}
          autoCapitalize="none"
          autoCorrect={false}
          autoFocus={autoFocus}
          clearButtonMode="while-editing"
        />
        {value.length > 0 ? (
          <TouchableOpacity
            style={styles.clearBtn}
            onPress={() => {
              onChangeText("");
              if (onClear) onClear();
            }}
          >
            <Ionicons
              name="close-circle"
              size={18}
              color={LedgerColors.inkMuted}
            />
          </TouchableOpacity>
        ) : null}
      </View>

      {onScanPress ? (
        <TouchableOpacity
          style={styles.scanBtn}
          onPress={onScanPress}
          activeOpacity={0.8}
        >
          <Ionicons
            name="barcode-outline"
            size={20}
            color={LedgerColors.crimson}
          />
        </TouchableOpacity>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  searchBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: LedgerColors.surface,
    borderWidth: 1,
    borderColor: LedgerColors.ruleBorder,
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 42,
  },
  searchIcon: {
    marginRight: 6,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: LedgerColors.inkText,
    paddingVertical: 0,
  },
  clearBtn: {
    padding: 4,
  },
  scanBtn: {
    width: 42,
    height: 42,
    borderRadius: 8,
    backgroundColor: LedgerColors.crimsonLight,
    borderWidth: 1,
    borderColor: LedgerColors.crimsonBorder,
    alignItems: "center",
    justifyContent: "center",
  },
});

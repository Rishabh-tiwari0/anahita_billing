import React from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LedgerColors } from "../../theme/colors";
import { feedbackService } from "../../services/feedbackService";

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: "primary" | "success" | "outline" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  icon?: keyof typeof Ionicons.glyphMap;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = "primary",
  size = "md",
  icon,
  loading = false,
  disabled = false,
  fullWidth = false,
  style,
}) => {
  const handlePress = () => {
    if (!disabled && !loading) {
      feedbackService.buttonTap();
      onPress();
    }
  };

  const getContainerStyle = (): ViewStyle => {
    const base: ViewStyle = {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 6,
      borderWidth: 1,
    };

    if (fullWidth) {
      base.width = "100%";
    }

    // Size
    if (size === "sm") {
      base.paddingVertical = 6;
      base.paddingHorizontal = 10;
    } else if (size === "lg") {
      base.paddingVertical = 14;
      base.paddingHorizontal = 20;
    } else {
      base.paddingVertical = 10;
      base.paddingHorizontal = 16;
    }

    // Variant
    switch (variant) {
      case "primary":
        base.backgroundColor = disabled
          ? LedgerColors.ruleBorder
          : LedgerColors.crimson;
        base.borderColor = disabled
          ? LedgerColors.ruleBorder
          : LedgerColors.crimsonHover;
        break;
      case "success":
        base.backgroundColor = disabled
          ? LedgerColors.ruleBorder
          : LedgerColors.ledgerGreen;
        base.borderColor = disabled ? LedgerColors.ruleBorder : "#14532D";
        break;
      case "danger":
        base.backgroundColor = disabled ? LedgerColors.ruleBorder : "#DC2626";
        base.borderColor = disabled ? LedgerColors.ruleBorder : "#B91C1C";
        break;
      case "outline":
        base.backgroundColor = "transparent";
        base.borderColor = disabled
          ? LedgerColors.ruleLine
          : LedgerColors.ruleDark;
        break;
      case "ghost":
        base.backgroundColor = "transparent";
        base.borderColor = "transparent";
        break;
    }

    return base;
  };

  const getTextStyle = (): TextStyle => {
    const textStyle: TextStyle = {
      fontWeight: "600",
    };

    if (size === "sm") textStyle.fontSize = 12;
    else if (size === "lg") textStyle.fontSize = 16;
    else textStyle.fontSize = 14;

    switch (variant) {
      case "primary":
      case "success":
      case "danger":
        textStyle.color = disabled ? LedgerColors.inkSecondary : "#FFFFFF";
        break;
      case "outline":
        textStyle.color = disabled
          ? LedgerColors.inkMuted
          : LedgerColors.inkText;
        break;
      case "ghost":
        textStyle.color = disabled
          ? LedgerColors.inkMuted
          : LedgerColors.crimson;
        break;
    }

    return textStyle;
  };

  const iconColor = getTextStyle().color as string;
  const iconSize = size === "sm" ? 14 : size === "lg" ? 20 : 16;

  return (
    <TouchableOpacity
      style={[getContainerStyle(), style]}
      onPress={handlePress}
      activeOpacity={0.75}
      disabled={disabled || loading}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={iconColor}
          style={{ marginRight: 6 }}
        />
      ) : icon ? (
        <Ionicons
          name={icon}
          size={iconSize}
          color={iconColor}
          style={{ marginRight: 6 }}
        />
      ) : null}
      <Text style={getTextStyle()}>{title}</Text>
    </TouchableOpacity>
  );
};

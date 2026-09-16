import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

export const feedbackService = {
  async scanSuccess(): Promise<void> {
    if (Platform.OS !== "web") {
      try {
        await Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Success,
        );
      } catch {
        // ignore if not supported
      }
    }
  },

  async scanError(): Promise<void> {
    if (Platform.OS !== "web") {
      try {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } catch {
        // ignore
      }
    }
  },

  async buttonTap(): Promise<void> {
    if (Platform.OS !== "web") {
      try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch {
        // ignore
      }
    }
  },

  async confirmSale(): Promise<void> {
    if (Platform.OS !== "web") {
      try {
        await Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Success,
        );
      } catch {
        // ignore
      }
    }
  },
};

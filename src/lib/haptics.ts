// Cross-platform haptics. Real Taptic Engine feedback on iOS via expo-haptics
// (which ships a web/Android shim so it bundles everywhere); light Vibration
// fallback on web. Every call is guarded and swallows errors so it never throws.
import { Platform } from "react-native";
import * as Haptics from "expo-haptics";

const webVibrate = (p: number | number[]) => {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate(p);
};

export function tapLight() {
  if (Platform.OS === "ios" || Platform.OS === "android") {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  } else webVibrate(8);
}

export function tapSuccess() {
  if (Platform.OS === "ios" || Platform.OS === "android") {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  } else webVibrate([6, 20, 6]);
}

export function tapWarning() {
  if (Platform.OS === "ios" || Platform.OS === "android") {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
  } else webVibrate(24);
}

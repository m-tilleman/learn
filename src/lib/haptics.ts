// Lightweight haptics. Uses the web Vibration API where available; a safe no-op
// otherwise. (Native Taptic Engine support can be re-added later via `npx expo
// install expo-haptics` — kept out here to avoid web version-skew on GitHub Pages.)
import { Platform } from "react-native";

const vibrate = (p: number | number[]) => {
  if (Platform.OS === "web" && typeof navigator !== "undefined" && "vibrate" in navigator) {
    try { navigator.vibrate(p); } catch {}
  }
};

export const tapLight = () => vibrate(8);
export const tapSuccess = () => vibrate([6, 20, 6]);
export const tapWarning = () => vibrate(24);

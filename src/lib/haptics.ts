// Lightweight haptics. Uses the web Vibration API where available; a safe no-op
// otherwise. Respects the user's "Haptics" setting.
import { Platform } from "react-native";
import { getSettings } from "@/settings";

const vibrate = (p: number | number[]) => {
  if (!getSettings().haptics) return;
  if (Platform.OS === "web" && typeof navigator !== "undefined" && "vibrate" in navigator) {
    try { navigator.vibrate(p); } catch {}
  }
};

export const tapLight = () => vibrate(8);
export const tapSuccess = () => vibrate([6, 20, 6]);
export const tapWarning = () => vibrate(24);

// Vintage palette theme system with a light "vintage white" variant.
// Toggle persists to localStorage on web; falls back to in-memory on native.
import { create } from "zustand";

export type ThemeMode = "vinyl" | "white";

export interface Palette {
  bg: string;
  card: string;
  border: string;
  text: string;
  muted: string;
  tangerine: string;
  tangerineSoft: string;
  turquoise: string;
  turquoiseLt: string;
  cherry: string;
  onAccent: string; // text on tangerine
  gradientA: string; // hero gradient stops
  gradientB: string;
  gradientC: string;
  gradientBase1: string;
  gradientBase2: string;
  scrim: string;
}

export const PALETTES: Record<ThemeMode, Palette> = {
  vinyl: {
    bg: "#16180F",
    card: "#20241A",
    border: "rgba(237,231,214,0.12)",
    text: "#EDE7D6",
    muted: "rgba(237,231,214,0.5)",
    tangerine: "#E28D34",
    tangerineSoft: "#E9A55A",
    turquoise: "#3E7C88",
    turquoiseLt: "#7FB0B8",
    cherry: "#E24A34",
    onAccent: "#241403",
    gradientA: "#5aa0a8",
    gradientB: "#e24a34",
    gradientC: "#e28d34",
    gradientBase1: "#2c4a4e",
    gradientBase2: "#3a2820",
    scrim: "rgba(0,0,0,0.45)",
  },
  white: {
    bg: "#EDE7D6",
    card: "#FBF7EE",
    border: "rgba(30,26,18,0.14)",
    text: "#231E15",
    muted: "rgba(35,30,21,0.55)",
    tangerine: "#CF7A22",
    tangerineSoft: "#E0913A",
    turquoise: "#2F6A76",
    turquoiseLt: "#3E7C88",
    cherry: "#C63A26",
    onAccent: "#FFF6EA",
    gradientA: "#7BC0C8",
    gradientB: "#E86A54",
    gradientC: "#EDA24E",
    gradientBase1: "#BFD8D6",
    gradientBase2: "#E7C9B6",
    scrim: "rgba(255,255,255,0.15)",
  },
};

export const FONT = {
  display: "Space Grotesk, system-ui, sans-serif",
  mono: "Space Mono, ui-monospace, monospace",
};

function loadInitial(): ThemeMode {
  try {
    if (typeof localStorage !== "undefined") {
      const v = localStorage.getItem("recall.theme");
      if (v === "white" || v === "vinyl") return v;
    }
  } catch {}
  return "vinyl";
}

interface ThemeStore {
  mode: ThemeMode;
  colors: Palette;
  toggle: () => void;
  setMode: (m: ThemeMode) => void;
}

export const useTheme = create<ThemeStore>((set, get) => ({
  mode: loadInitial(),
  colors: PALETTES[loadInitial()],
  toggle: () => get().setMode(get().mode === "vinyl" ? "white" : "vinyl"),
  setMode: (m) => {
    try {
      if (typeof localStorage !== "undefined") localStorage.setItem("recall.theme", m);
    } catch {}
    set({ mode: m, colors: PALETTES[m] });
  },
}));

// Convenience hook.
export const useColors = () => useTheme((s) => s.colors);

// Persisted user settings. Toggles/choices are stored to localStorage on web
// (in-memory fallback on native). The study loop and haptics read from here.
import { create } from "zustand";

export interface Settings {
  // Scheduling
  targetRetention: number;        // %
  dailyNew: number;
  dailyReview: number | null;     // null = unlimited
  maxIntervalDays: number;
  newOrder: "Added" | "Random";
  // Session & study behavior
  sessionMinutes: number;
  guessFirst: boolean;
  confidence: boolean;
  intervalPreviews: boolean;
  interleave: boolean;
  // Notifications
  reminderTime: string;
  quietHours: boolean;
  optimalWindow: boolean;
  streakReminders: boolean;
  // Feel & accessibility
  haptics: boolean;
  reduceMotion: boolean;
  textSize: "Small" | "Medium" | "Large";
}

const DEFAULTS: Settings = {
  targetRetention: 90,
  dailyNew: 20,
  dailyReview: 200,
  maxIntervalDays: 365,
  newOrder: "Added",
  sessionMinutes: 7,
  guessFirst: true,
  confidence: true,
  intervalPreviews: true,
  interleave: true,
  reminderTime: "8:00 AM",
  quietHours: true,
  optimalWindow: true,
  streakReminders: true,
  haptics: true,
  reduceMotion: false,
  textSize: "Medium",
};

const KEY = "recall.settings";

function load(): Partial<Settings> {
  try {
    if (typeof localStorage !== "undefined") {
      const raw = localStorage.getItem(KEY);
      if (raw) return JSON.parse(raw);
    }
  } catch {}
  return {};
}

function persist(s: Settings) {
  try {
    if (typeof localStorage !== "undefined") localStorage.setItem(KEY, JSON.stringify(s));
  } catch {}
}

interface Store extends Settings {
  update: (patch: Partial<Settings>) => void;
}

export const useSettings = create<Store>((set, get) => ({
  ...DEFAULTS,
  ...load(),
  update: (patch) => {
    const { update, ...rest } = get();
    const next = { ...rest, ...patch } as Settings;
    persist(next);
    set(patch as any);
  },
}));

// Non-reactive read for modules that aren't React components (e.g. haptics).
export const getSettings = (): Settings => {
  const { update, ...rest } = useSettings.getState();
  return rest as Settings;
};

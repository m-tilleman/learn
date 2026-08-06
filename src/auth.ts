// Auth state (live mode only). Wraps Supabase auth in a small zustand store.
import { create } from "zustand";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

interface AuthState {
  userId: string | null;
  email: string | null;
  initialized: boolean;
  init: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<string | null>;   // returns error msg or null
  signUp: (email: string, password: string) => Promise<string | null>;
  signOut: () => Promise<void>;
}

export const useAuth = create<AuthState>((set) => ({
  userId: null,
  email: null,
  initialized: !isSupabaseConfigured, // demo mode is "initialized" immediately
  init: async () => {
    if (!supabase) { set({ initialized: true }); return; }
    const { data } = await supabase.auth.getSession();
    set({ userId: data.session?.user.id ?? null, email: data.session?.user.email ?? null, initialized: true });
    supabase.auth.onAuthStateChange((_e, session) => {
      set({ userId: session?.user.id ?? null, email: session?.user.email ?? null });
    });
  },
  signIn: async (email, password) => {
    if (!supabase) return "Backend not configured.";
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return error ? error.message : null;
  },
  signUp: async (email, password) => {
    if (!supabase) return "Backend not configured.";
    const { error } = await supabase.auth.signUp({ email, password });
    return error ? error.message : null;
  },
  signOut: async () => {
    if (supabase) await supabase.auth.signOut();
    set({ userId: null, email: null });
  },
}));

// True when we have a real backend AND a signed-in user.
export const useIsConnected = () => useAuth((s) => isSupabaseConfigured && !!s.userId);

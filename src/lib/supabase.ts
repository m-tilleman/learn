// Supabase client singleton. The app runs in two modes:
//  • "demo"  — no env vars set → sample data, no auth (current GitHub Pages build).
//  • "live"  — EXPO_PUBLIC_SUPABASE_URL + ANON_KEY set → real auth + persistence.
import { createClient, SupabaseClient } from "@supabase/supabase-js";

const url = process.env.EXPO_PUBLIC_SUPABASE_URL ?? "";
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const isSupabaseConfigured =
  /^https?:\/\//.test(url) && anonKey.length > 20 && !url.includes("YOUR-PROJECT");

// Only construct the client when configured; otherwise export null and stay in demo mode.
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url, anonKey, { auth: { persistSession: true, autoRefreshToken: true } })
  : null;

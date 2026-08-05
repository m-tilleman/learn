// supabase.ts — client singleton. Uses EXPO_PUBLIC_* env vars (safe for client bundle).
import { createClient } from "@supabase/supabase-js";

const url = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

if (!url || !anonKey) {
  console.warn("Supabase env vars missing — copy .env.example to .env and fill them in.");
}

export const supabase = createClient(url ?? "", anonKey ?? "", {
  auth: { persistSession: true, autoRefreshToken: true },
});

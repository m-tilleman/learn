// Supabase Edge Function: POST /functions/v1/sync
// Body: { op: "push" | "pull", last_pulled_at?, changes? }
// push: append review_logs, upsert non-derived rows, recompute card_states by replay.
// Deploy: supabase functions deploy sync
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { FSRS6 } from "./fsrs6.ts"; // copy src/lib/fsrs6.ts alongside for Deno import

Deno.serve(async (req) => {
  const authHeader = req.headers.get("Authorization") ?? "";
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } },
  );

  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) return json({ error: "unauthorized" }, 401);

  const body = await req.json();

  if (body.op === "pull") {
    const since = body.last_pulled_at ?? "1970-01-01";
    const tables = ["decks", "cards", "card_states", "concepts", "concept_edges"];
    const changes: Record<string, unknown[]> = {};
    for (const t of tables) {
      const { data } = await supabase.from(t).select("*").gt("updated_at", since);
      changes[t] = data ?? [];
    }
    return json({ changes, timestamp: new Date().toISOString() });
  }

  // op === "push"
  const changes = body.changes ?? {};
  if (changes.review_logs?.length) {
    await supabase.from("review_logs").upsert(changes.review_logs, { onConflict: "id" });
  }
  for (const t of ["decks", "cards", "concepts", "card_concepts"]) {
    if (changes[t]?.length) await supabase.from(t).upsert(changes[t]);
  }

  // Recompute authoritative card_states by replaying merged logs (deterministic).
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", userId).single();
  const scheduler = new FSRS6({
    weights: profile?.fsrs_params ?? undefined,
    requestRetention: profile?.target_retention ?? 0.9,
    enableFuzz: false, // deterministic replay
  });

  const touched = new Set<string>((changes.review_logs ?? []).map((l: any) => l.card_id));
  for (const cardId of touched) {
    const { data: logs } = await supabase
      .from("review_logs").select("*")
      .eq("card_id", cardId).order("reviewed_at", { ascending: true });
    let state: any = null;
    for (const log of logs ?? []) state = scheduler.review(state, log.grade, new Date(log.reviewed_at));
    if (state) {
      await supabase.from("card_states").upsert({
        card_id: cardId, user_id: userId,
        stability: state.stability, difficulty: state.difficulty,
        due: state.due.toISOString(), last_review: state.lastReview?.toISOString(),
        reps: state.reps, lapses: state.lapses, state: state.state,
        updated_at: new Date().toISOString(),
      });
    }
  }

  return json({ applied: true, server_timestamp: new Date().toISOString() });
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

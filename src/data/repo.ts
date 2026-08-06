// Data layer for live mode: reads the due queue and persists reviews to Supabase.
// Reviews are written to the append-only review_logs; card_states is the
// materialized scheduler state. Offline writes are queued in localStorage and
// flushed on the next successful call.
import { supabase } from "@/lib/supabase";
import { FSRS6, CardState, Grade } from "@/lib/fsrs6";
import { getSettings } from "@/settings";

export interface StudyItem {
  id: string;
  tag: string;
  q: string;
  a: string;
  state: CardState | null; // null => brand-new card
}

const uuid = () =>
  (typeof crypto !== "undefined" && "randomUUID" in crypto)
    ? crypto.randomUUID()
    : "id-" + Math.random().toString(36).slice(2) + Date.now();

function scheduler() {
  const s = getSettings();
  return new FSRS6({ requestRetention: s.targetRetention / 100, maximumInterval: s.maxIntervalDays, enableFuzz: true });
}

function rowToState(r: any): CardState | null {
  if (!r || r.state === "new" || r.last_review == null) return null;
  return {
    stability: r.stability, difficulty: r.difficulty,
    due: new Date(r.due), lastReview: r.last_review ? new Date(r.last_review) : null,
    reps: r.reps ?? 0, lapses: r.lapses ?? 0, state: r.state,
  };
}

const SAMPLE = [
  { type: "conceptual", layer: "L1", prompt: "Why does spacing reviews improve long-term retention more than massing them?", answer: "Each retrieval near the point of forgetting is effortful, which drives a larger increase in memory stability — the spacing effect." },
  { type: "cloze", layer: "L3", prompt: "In FSRS, ______ is the number of days for recall probability to decay from 100% to 90%.", answer: "Stability." },
  { type: "application", layer: "L2", prompt: "Syncing study state across offline devices — safest source of truth, and why?", answer: "An append-only review log: it merges by union with no conflicts, and scheduler state is recomputed by replaying it." },
];

// Give a brand-new account a few cards so there's something to study.
export async function seedIfEmpty(userId: string) {
  if (!supabase) return;
  const { count } = await supabase.from("cards").select("id", { count: "exact", head: true }).eq("user_id", userId);
  if ((count ?? 0) > 0) return;
  const now = new Date().toISOString();
  const rows = SAMPLE.map((c) => ({ id: uuid(), user_id: userId, type: c.type, layer: c.layer, prompt: c.prompt, answer: c.answer }));
  await supabase.from("cards").insert(rows);
  await supabase.from("card_states").insert(
    rows.map((r) => ({ card_id: r.id, user_id: userId, due: now, state: "new", stability: 0, difficulty: 0, reps: 0, lapses: 0, updated_at: now }))
  );
}

export async function getDueQueue(userId: string): Promise<StudyItem[]> {
  if (!supabase) return [];
  await flushPending(userId);
  await seedIfEmpty(userId);
  const nowIso = new Date().toISOString();
  const { data, error } = await supabase
    .from("card_states")
    .select("*, cards(type, layer, prompt, answer)")
    .eq("user_id", userId)
    .lte("due", nowIso)
    .order("due", { ascending: true })
    .limit(getSettings().dailyReview ?? 200);
  if (error || !data) return [];
  return data.map((r: any) => ({
    id: r.card_id,
    tag: `${String(r.cards?.type ?? "card").toUpperCase()} · ${r.cards?.layer ?? ""}`.trim(),
    q: r.cards?.prompt ?? "",
    a: r.cards?.answer ?? "",
    state: rowToState(r),
  }));
}

const PENDING = "recall.pendingReviews";
function queuePending(payload: any) {
  try {
    const list = JSON.parse(localStorage.getItem(PENDING) || "[]");
    list.push(payload);
    localStorage.setItem(PENDING, JSON.stringify(list));
  } catch {}
}

export async function flushPending(userId: string) {
  if (!supabase || typeof localStorage === "undefined") return;
  let list: any[] = [];
  try { list = JSON.parse(localStorage.getItem(PENDING) || "[]"); } catch { return; }
  if (!list.length) return;
  const remaining: any[] = [];
  for (const p of list) {
    const okLog = await supabase.from("review_logs").upsert(p.log, { onConflict: "id" });
    const okState = await supabase.from("card_states").upsert(p.state);
    if (okLog.error || okState.error) remaining.push(p);
  }
  try { localStorage.setItem(PENDING, JSON.stringify(remaining)); } catch {}
}

// Grade a card: compute next state, write review_log + card_state. Returns next state.
export async function submitReview(userId: string, item: StudyItem, grade: Grade, now = new Date()): Promise<CardState> {
  const next = scheduler().review(item.state, grade, now);
  const elapsed = item.state?.lastReview ? (now.getTime() - item.state.lastReview.getTime()) / 86_400_000 : 0;
  const log = {
    id: uuid(), user_id: userId, card_id: item.id, reviewed_at: now.toISOString(), grade,
    elapsed_days: elapsed, post_stability: next.stability, post_difficulty: next.difficulty, scheduler: "fsrs6",
  };
  const state = {
    card_id: item.id, user_id: userId, stability: next.stability, difficulty: next.difficulty,
    due: next.due.toISOString(), last_review: next.lastReview?.toISOString(), reps: next.reps,
    lapses: next.lapses, state: next.state, updated_at: now.toISOString(),
  };
  if (!supabase) return next;
  const okLog = await supabase.from("review_logs").insert(log);
  const okState = await supabase.from("card_states").upsert(state);
  if (okLog.error || okState.error) queuePending({ log, state }); // offline / transient → retry later
  return next;
}

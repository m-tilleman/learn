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

// Ingest pasted text: hand it to the Gemini edge function, which writes cards
// for this user. Returns the number of cards created. Real content only — no
// seeding; a brand-new account starts empty until the user adds material.
export async function ingestText(title: string, text: string): Promise<{ count: number; documentId: string }> {
  if (!supabase) throw new Error("Not connected");
  const { data, error } = await supabase.functions.invoke("generate-cards", { body: { title, text } });
  if (error) {
    // Surface the function's JSON error message when present.
    let msg = error.message || "Card generation failed";
    try { const ctx = await (error as any).context?.json?.(); if (ctx?.error) msg = ctx.error; } catch {}
    throw new Error(msg);
  }
  if ((data as any)?.error) throw new Error((data as any).error);
  return { count: (data as any)?.count ?? 0, documentId: (data as any)?.documentId ?? "" };
}

export interface DocRow { id: string; title: string; created_at: string; cardCount: number; }

// The user's added materials, newest first, with a live card count each.
export async function getDocuments(userId: string): Promise<DocRow[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("documents")
    .select("id, title, created_at, cards(count)")
    .eq("user_id", userId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return data.map((d: any) => ({
    id: d.id, title: d.title ?? "Untitled", created_at: d.created_at,
    cardCount: Array.isArray(d.cards) ? (d.cards[0]?.count ?? 0) : 0,
  }));
}

export async function getDueQueue(userId: string): Promise<StudyItem[]> {
  if (!supabase) return [];
  await flushPending(userId);
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

// ── Stats ────────────────────────────────────────────────────────────────────
// All figures are derived live from card_states (materialized scheduler state)
// and review_logs (append-only history). A card is "mature" once stability ≥ 21
// days — the point a memory is genuinely durable.

export interface Stats {
  dueNow: number;
  totalCards: number;
  reviewsAllTime: number;
  streak: number;
  longestStreak: number;
  retention: number | null;      // % of recent reviews recalled (grade ≥ 2)
  learning: number; young: number; mature: number;
  avgStability: number | null;   // days
  weekReviews: number[];         // last 7 days, oldest → today
  forecast: number[];            // cards due each of the next 7 days
  leeches: number;
  dueConcepts: { t: string; s: string; c: string }[];
}

const dayKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
const startOfToday = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; };

export async function getStats(userId: string): Promise<Stats> {
  const empty: Stats = {
    dueNow: 0, totalCards: 0, reviewsAllTime: 0, streak: 0, longestStreak: 0, retention: null,
    learning: 0, young: 0, mature: 0, avgStability: null,
    weekReviews: [0, 0, 0, 0, 0, 0, 0], forecast: [0, 0, 0, 0, 0, 0, 0], leeches: 0, dueConcepts: [],
  };
  if (!supabase) return empty;

  const since = new Date(Date.now() - 60 * 86_400_000).toISOString();
  const [statesRes, logsRes, countRes] = await Promise.all([
    supabase.from("card_states").select("due,state,stability,lapses,cards(prompt,type)").eq("user_id", userId),
    supabase.from("review_logs").select("reviewed_at,grade").eq("user_id", userId).gte("reviewed_at", since).order("reviewed_at", { ascending: true }),
    supabase.from("review_logs").select("id", { count: "exact", head: true }).eq("user_id", userId),
  ]);
  const states: any[] = statesRes.data ?? [];
  const logs: any[] = logsRes.data ?? [];
  const now = Date.now();

  const isReview = (s: any) => s.state === "review";
  const mature = states.filter((s) => isReview(s) && (s.stability ?? 0) >= 21).length;
  const young = states.filter((s) => isReview(s) && (s.stability ?? 0) < 21).length;
  const learning = states.length - mature - young;
  const stabs = states.filter((s) => isReview(s) && s.stability != null).map((s) => s.stability);
  const avgStability = stabs.length ? Math.round(stabs.reduce((a, b) => a + b, 0) / stabs.length) : null;

  // Due-now concepts for the home chips (short prompt labels).
  const dueConcepts = states
    .filter((s) => new Date(s.due).getTime() <= now)
    .slice(0, 5)
    .map((s, i) => {
      const p = String(s.cards?.prompt ?? "Card").replace(/_+/g, "…");
      const t = p.length > 26 ? p.slice(0, 24).trimEnd() + "…" : p;
      return { t, s: "due now", c: i < 2 ? "cherry" : i % 2 ? "turquoise" : "tangerine" };
    });

  // Forecast: cards coming due each of the next 7 days.
  const t0 = startOfToday().getTime();
  const forecast = [0, 0, 0, 0, 0, 0, 0];
  for (const s of states) {
    const d = new Date(s.due).getTime();
    const day = Math.floor((d - t0) / 86_400_000);
    if (day >= 0 && day < 7) forecast[day]++;
  }

  // Reviews per day for the last 7 days (oldest → today).
  const weekReviews = [0, 0, 0, 0, 0, 0, 0];
  for (const l of logs) {
    const d = new Date(l.reviewed_at).getTime();
    const day = Math.floor((d - t0) / 86_400_000); // 0 = today, -1 = yesterday …
    const idx = 6 + day; // today → 6
    if (idx >= 0 && idx < 7) weekReviews[idx]++;
  }

  // Retention over the last 30 days: share recalled (grade ≥ 2, i.e. not "Again").
  const recent = logs.filter((l) => new Date(l.reviewed_at).getTime() >= now - 30 * 86_400_000);
  const retention = recent.length ? Math.round((recent.filter((l) => l.grade >= 2).length / recent.length) * 100) : null;

  // Streak: consecutive days (ending today or yesterday) with at least one review.
  const daysSet = new Set(logs.map((l) => dayKey(new Date(l.reviewed_at))));
  let streak = 0;
  const probe = startOfToday();
  if (!daysSet.has(dayKey(probe))) probe.setDate(probe.getDate() - 1); // allow "yesterday" to keep streak alive
  while (daysSet.has(dayKey(probe))) { streak++; probe.setDate(probe.getDate() - 1); }
  // Longest streak across the window.
  let longestStreak = 0, run = 0;
  const sortedKeys = Array.from(daysSet).map((k) => k.split("-").map(Number)).map(([y, m, d]) => new Date(y, m, d).getTime()).sort((a, b) => a - b);
  for (let i = 0; i < sortedKeys.length; i++) {
    if (i > 0 && sortedKeys[i] - sortedKeys[i - 1] === 86_400_000) run++; else run = 1;
    longestStreak = Math.max(longestStreak, run);
  }

  return {
    dueNow: states.filter((s) => new Date(s.due).getTime() <= now).length,
    totalCards: states.length,
    reviewsAllTime: countRes.count ?? 0,
    streak, longestStreak, retention,
    learning, young, mature, avgStability,
    weekReviews, forecast,
    leeches: states.filter((s) => (s.lapses ?? 0) >= 4).length,
    dueConcepts,
  };
}

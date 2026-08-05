// queue.ts — builds the interleaved daily study queue.
// Ordering: most-overdue-relative-to-target first, interleaved across decks,
// new cards drip-fed under the daily cap. Session capped to a time budget.
import { CardState } from "./fsrs6";
import { Card } from "@/types";

export interface DueCard {
  card: Card;
  state: CardState | null; // null => brand new
}

export interface QueueOptions {
  now?: Date;
  dailyNewLimit?: number;
  sessionCardCap?: number;
  avgSecondsPerCard?: number;
  timeBudgetMinutes?: number;
}

export function buildQueue(pool: DueCard[], opts: QueueOptions = {}): DueCard[] {
  const now = opts.now ?? new Date();
  const dailyNewLimit = opts.dailyNewLimit ?? 20;
  const avg = opts.avgSecondsPerCard ?? 14;
  const budget = opts.timeBudgetMinutes ?? 7;
  const cap = opts.sessionCardCap ?? Math.max(5, Math.floor((budget * 60) / avg));

  const reviews = pool
    .filter((c) => c.state && c.state.due <= now)
    // most overdue relative to its own interval first
    .sort((a, b) => overdueRatio(b, now) - overdueRatio(a, now));

  const news = pool.filter((c) => !c.state).slice(0, dailyNewLimit);

  // Interleave: spread decks apart and drip new cards among reviews.
  const interleavedReviews = interleaveByDeck(reviews);
  const merged: DueCard[] = [];
  let ni = 0;
  interleavedReviews.forEach((r, i) => {
    merged.push(r);
    // roughly one new card every ~4 reviews
    if (i % 4 === 3 && ni < news.length) merged.push(news[ni++]);
  });
  while (ni < news.length) merged.push(news[ni++]);

  return merged.slice(0, cap);
}

function overdueRatio(c: DueCard, now: Date): number {
  if (!c.state || !c.state.lastReview) return 0;
  const interval = (c.state.due.getTime() - c.state.lastReview.getTime()) || 86_400_000;
  const overdue = now.getTime() - c.state.due.getTime();
  return overdue / interval;
}

function interleaveByDeck(cards: DueCard[]): DueCard[] {
  const buckets = new Map<string, DueCard[]>();
  for (const c of cards) {
    const k = c.card.deckId ?? "default";
    if (!buckets.has(k)) buckets.set(k, []);
    buckets.get(k)!.push(c);
  }
  const lists = [...buckets.values()];
  const out: DueCard[] = [];
  let added = true;
  while (added) {
    added = false;
    for (const l of lists) {
      const next = l.shift();
      if (next) {
        out.push(next);
        added = true;
      }
    }
  }
  return out;
}

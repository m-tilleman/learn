// session.ts — Zustand store driving the daily study loop.
// State (S/D/due) is materialized locally; every grade also appends a ReviewLog
// which is the source of truth and is synced to the server.
import { create } from "zustand";
import { CardState, Grade } from "@/lib/fsrs6";
import { makeScheduler, Scheduler } from "@/lib/scheduler";
import { Card, ReviewLog } from "@/types";

interface QueueItem {
  card: Card;
  state: CardState | null;
}

interface SessionStore {
  scheduler: Scheduler;
  queue: QueueItem[];
  index: number;
  revealed: boolean;
  reviewedCount: number;
  logs: ReviewLog[];
  startSession: (items: QueueItem[]) => void;
  reveal: () => void;
  grade: (g: Grade) => void;
  current: () => QueueItem | undefined;
  finished: () => boolean;
}

export const useSession = create<SessionStore>((set, get) => ({
  scheduler: makeScheduler("fsrs6", { requestRetention: 0.9 }),
  queue: [],
  index: 0,
  revealed: false,
  reviewedCount: 0,
  logs: [],

  startSession: (items) =>
    set({ queue: items, index: 0, revealed: false, reviewedCount: 0, logs: [] }),

  reveal: () => set({ revealed: true }),

  grade: (g) => {
    const { scheduler, queue, index, reviewedCount, logs } = get();
    const item = queue[index];
    if (!item) return;
    const now = new Date();
    const next = scheduler.review(item.state, g, now);

    const log: ReviewLog = {
      id: crypto.randomUUID(),
      cardId: item.card.id,
      reviewedAt: now.toISOString(),
      grade: g,
    };
    // NOTE: persist `next` to local card_states and enqueue `log` for /sync/push here.

    set({
      index: index + 1,
      revealed: false,
      reviewedCount: reviewedCount + 1,
      logs: [...logs, log],
    });
  },

  current: () => get().queue[get().index],
  finished: () => get().index >= get().queue.length,
}));

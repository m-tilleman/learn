// scheduler.ts — common interface so FSRS-6 and SM-2 are interchangeable.
import { FSRS6, CardState, Grade, SchedulerConfig } from "./fsrs6";

export interface Scheduler {
  review(prev: CardState | null, grade: Grade, now?: Date): CardState;
  previewIntervals?(prev: CardState | null, now?: Date): Record<Grade, number>;
}

/** Minimal SM-2 fallback (opt-in / comparison mode). */
export class SM2 implements Scheduler {
  constructor(private minEase = 1.3) {}
  review(prev: CardState | null, grade: Grade, now: Date = new Date()): CardState {
    const DAY = 86_400_000;
    // We reuse CardState fields: difficulty holds the ease factor (×100 not needed).
    const ease = prev?.difficulty ?? 2.5;
    const reps = (prev?.reps ?? 0) + 1;
    let interval: number;
    let newEase = ease;

    if (grade === 1) {
      interval = 1;
      newEase = Math.max(this.minEase, ease - 0.2);
    } else {
      const q = grade + 1; // map 2..4 -> 3..5 on SM-2's 0..5 scale
      newEase = Math.max(this.minEase, ease + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)));
      const prevIvl =
        prev?.lastReview && prev?.due
          ? Math.max(1, Math.round((prev.due.getTime() - prev.lastReview.getTime()) / DAY))
          : 0;
      interval = reps === 1 ? 1 : reps === 2 ? 6 : Math.round(prevIvl * newEase);
    }
    return {
      stability: interval,
      difficulty: newEase,
      due: new Date(now.getTime() + interval * DAY),
      lastReview: now,
      reps,
      lapses: (prev?.lapses ?? 0) + (grade === 1 ? 1 : 0),
      state: grade === 1 ? "relearning" : "review",
    };
  }
}

export function makeScheduler(
  kind: "fsrs6" | "sm2",
  cfg: SchedulerConfig = {},
): Scheduler {
  return kind === "sm2" ? new SM2() : new FSRS6(cfg);
}

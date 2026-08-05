// fsrs6.ts — dependency-free FSRS-6 scheduler.
// Formulas: open-spaced-repetition / awesome-fsrs wiki (FSRS-6). Verified against R(S,S)=0.90.

export type Grade = 1 | 2 | 3 | 4; // Again, Hard, Good, Easy
export type State = "new" | "learning" | "review" | "relearning";

export interface CardState {
  stability: number;
  difficulty: number;
  due: Date;
  lastReview: Date | null;
  reps: number;
  lapses: number;
  state: State;
}

export const DEFAULT_W = [
  0.212, 1.2931, 2.3065, 8.2956, 6.4133, 0.8334, 3.0194, 0.001,
  1.8722, 0.1666, 0.796, 1.4835, 0.0614, 0.2629, 1.6483, 0.6014,
  1.8729, 0.5425, 0.0912, 0.0658, 0.1542,
];

const clampD = (d: number) => Math.min(Math.max(d, 1), 10);
const DAY_MS = 86_400_000;
// ±5% interval fuzz to prevent review "clumping" on the same day.
const fuzz = (ivl: number) => ivl <= 2 ? ivl : Math.round(ivl * (0.95 + Math.random() * 0.1));

export interface SchedulerConfig {
  weights?: number[];
  requestRetention?: number; // 0.80–0.97
  maximumInterval?: number;  // days
  enableFuzz?: boolean;
}

export class FSRS6 {
  private w: number[];
  private requestRetention: number;
  private maximumInterval: number;
  private enableFuzz: boolean;

  constructor(cfg: SchedulerConfig = {}) {
    this.w = cfg.weights ?? DEFAULT_W;
    this.requestRetention = cfg.requestRetention ?? 0.9;
    this.maximumInterval = cfg.maximumInterval ?? 36500;
    this.enableFuzz = cfg.enableFuzz ?? true;
  }

  /** Probability of recall t days after last review, given stability S. */
  retrievability(elapsedDays: number, stability: number): number {
    const decay = -this.w[20];
    const factor = Math.pow(0.9, 1 / decay) - 1;
    return Math.pow(1 + factor * (elapsedDays / stability), decay);
  }

  /** Interval (days) that lands retrievability at requestRetention. */
  private nextInterval(stability: number): number {
    const decay = -this.w[20];
    const factor = Math.pow(0.9, 1 / decay) - 1;
    const ivl = (stability / factor) * (Math.pow(this.requestRetention, 1 / decay) - 1);
    const clamped = Math.min(Math.max(Math.round(ivl), 1), this.maximumInterval);
    return this.enableFuzz ? fuzz(clamped) : clamped;
  }

  private initDifficulty(g: Grade): number {
    return clampD(this.w[4] - Math.exp(this.w[5] * (g - 1)) + 1);
  }

  private nextDifficulty(d: number, g: Grade): number {
    const deltaD = -this.w[6] * (g - 3);
    const dPrime = d + (deltaD * (10 - d)) / 9; // linear damping
    return clampD(this.w[7] * this.initDifficulty(4) + (1 - this.w[7]) * dPrime);
  }

  private stabilityAfterRecall(d: number, s: number, r: number, g: Grade): number {
    const hard = g === 2 ? this.w[15] : 1;
    const easy = g === 4 ? this.w[16] : 1;
    const inc =
      Math.exp(this.w[8]) *
      (11 - d) *
      Math.pow(s, -this.w[9]) *
      (Math.exp(this.w[10] * (1 - r)) - 1) *
      hard *
      easy;
    return s * (1 + inc);
  }

  private stabilityAfterLapse(d: number, s: number, r: number): number {
    return (
      this.w[11] *
      Math.pow(d, -this.w[12]) *
      (Math.pow(s + 1, this.w[13]) - 1) *
      Math.exp(this.w[14] * (1 - r))
    );
  }

  /** Grade a card. Returns the next CardState. */
  review(prev: CardState | null, grade: Grade, now: Date = new Date()): CardState {
    if (!prev || prev.state === "new" || prev.lastReview === null) {
      const stability = this.w[grade - 1];
      const difficulty = this.initDifficulty(grade);
      const ivl = grade === 1 ? 0 : this.nextInterval(stability);
      return {
        stability,
        difficulty,
        due: new Date(now.getTime() + Math.max(ivl, 0) * DAY_MS),
        lastReview: now,
        reps: 1,
        lapses: grade === 1 ? 1 : 0,
        state: grade === 1 ? "learning" : "review",
      };
    }

    const elapsedDays = Math.max((now.getTime() - prev.lastReview.getTime()) / DAY_MS, 0);
    const r = this.retrievability(elapsedDays, prev.stability);
    const difficulty = this.nextDifficulty(prev.difficulty, grade);

    let stability: number;
    let state: State = "review";
    let lapses = prev.lapses;

    if (grade === 1) {
      stability = this.stabilityAfterLapse(prev.difficulty, prev.stability, r);
      state = "relearning";
      lapses += 1;
    } else {
      stability = this.stabilityAfterRecall(prev.difficulty, prev.stability, r, grade);
    }

    return {
      stability,
      difficulty,
      due: new Date(now.getTime() + this.nextInterval(stability) * DAY_MS),
      lastReview: now,
      reps: prev.reps + 1,
      lapses,
      state,
    };
  }

  /** Preview the interval (days) each grade would produce — for the "next due" hints under buttons. */
  previewIntervals(prev: CardState | null, now: Date = new Date()): Record<Grade, number> {
    const out = {} as Record<Grade, number>;
    for (const g of [1, 2, 3, 4] as Grade[]) {
      const next = this.review(prev, g, now);
      out[g] = Math.round((next.due.getTime() - now.getTime()) / DAY_MS);
    }
    return out;
  }
}

// Shared domain types.
export type CardType = "qa" | "cloze" | "conceptual" | "application" | "order" | "mcq";
export type Layer = "L1" | "L2" | "L3";

export interface Card {
  id: string;
  deckId?: string;
  documentId?: string;
  type: CardType;
  layer: Layer;
  prompt: string;
  answer: string;
  payload?: {
    clozeSpans?: string[];
    distractors?: string[];
    ordering?: string[];
  };
  sourceSpan?: { charStart: number; charEnd: number };
  suspended?: boolean;
}

export interface ReviewLog {
  id: string;
  cardId: string;
  reviewedAt: string; // ISO
  grade: 1 | 2 | 3 | 4;
  elapsedDays?: number;
  scheduledDays?: number;
  durationMs?: number;
}

export interface Deck {
  id: string;
  name: string;
}

export interface DocumentStatus {
  id: string;
  title: string;
  status: "queued" | "processing" | "ready" | "failed";
  stage?: string;
  progress?: number;
  cardCount?: number;
}

// Sample data so the app renders before Supabase is wired up.
import { Card, Deck, DocumentStatus } from "@/types";
import { DueCard } from "@/lib/queue";

export const decks: Deck[] = [
  { id: "d1", name: "Neuroscience of Memory" },
  { id: "d2", name: "Systems Design" },
];

export const sampleCards: Card[] = [
  {
    id: "c1", deckId: "d1", type: "conceptual", layer: "L1",
    prompt: "Why does spacing reviews improve long-term retention more than massing them?",
    answer: "Each retrieval near the point of forgetting is effortful, which drives a larger increase in memory stability (the spacing effect). Massed reviews are too easy to strengthen memory much.",
  },
  {
    id: "c2", deckId: "d1", type: "cloze", layer: "L3",
    prompt: "In FSRS, ______ is the number of days for recall probability to decay from 100% to 90%.",
    answer: "stability",
    payload: { clozeSpans: ["stability"] },
  },
  {
    id: "c3", deckId: "d2", type: "application", layer: "L2",
    prompt: "You must sync study state across 3 offline-capable devices. What is the safest source of truth and why?",
    answer: "An append-only review log. Because logs merge by union (no conflicts) and scheduler state can be deterministically recomputed by replaying the merged log.",
  },
];

export const dueQueue: DueCard[] = sampleCards.map((card, i) => ({
  card,
  state: i === 2 ? null : {
    stability: [4, 11][i] ?? 6,
    difficulty: [5.2, 3.1][i] ?? 4,
    due: new Date(Date.now() - (i + 1) * 3600_000),
    lastReview: new Date(Date.now() - (i + 3) * 86_400_000),
    reps: i + 2,
    lapses: 0,
    state: "review",
  },
}));

export const ingesting: DocumentStatus[] = [
  { id: "doc1", title: "Make It Stick (Ch. 2)", status: "processing", stage: "Generating cards", progress: 0.62, cardCount: 18 },
  { id: "doc2", title: "arXiv:2402.12345 — FSRS benchmark", status: "ready", cardCount: 41 },
  { id: "doc3", title: "blog.example.com/memory-models", status: "queued" },
];

export const analytics = {
  streak: 23,
  retention: 0.91,
  dueToday: 34,
  reviewsThisWeek: [42, 51, 38, 47, 60, 29, 34],
  matureCards: 612,
  youngCards: 188,
  leeches: 5,
  forecast30d: [34, 28, 41, 22, 30, 19, 25, 33, 27, 20],
};

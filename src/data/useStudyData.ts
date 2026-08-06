// Study data source. In demo mode returns the sample deck synchronously; in live
// mode loads the due queue from Supabase and persists each grade.
import { useEffect, useState } from "react";
import { Grade } from "@/lib/fsrs6";
import { useAuth, useIsConnected } from "@/auth";
import { getDueQueue, submitReview, StudyItem } from "@/data/repo";

const DEMO: StudyItem[] = [
  { id: "d1", tag: "CONCEPT · L1", q: "Why does spacing reviews improve long-term retention more than massing them?", a: "Each retrieval near the point of forgetting is effortful, which drives a larger increase in memory stability — the spacing effect. Massed reviews are too easy to strengthen memory much.", state: null },
  { id: "d2", tag: "CLOZE · L3", q: "In FSRS, ______ is the number of days for recall probability to decay from 100% to 90%.", a: "Stability.", state: null },
  { id: "d3", tag: "APPLICATION · L2", q: "Syncing study state across offline devices — safest source of truth, and why?", a: "An append-only review log: it merges by union with no conflicts, and scheduler state is recomputed by replaying it.", state: null },
];

function orderByConcept(items: StudyItem[], concept?: string): StudyItem[] {
  if (!concept) return items;
  const q = concept.toLowerCase();
  const key = q.includes("fsrs") || q.includes("stability") ? "fsrs"
    : q.includes("spac") ? "spac"
    : q.includes("sync") || q.includes("apply") ? "sync" : "";
  if (!key) return items;
  const i = items.findIndex((it) => (it.q + " " + it.tag).toLowerCase().includes(key === "sync" ? "sync" : key === "fsrs" ? "fsrs" : "spac"));
  return i <= 0 ? items : [items[i], ...items.filter((_, n) => n !== i)];
}

export function useStudyData(concept?: string) {
  const connected = useIsConnected();
  const userId = useAuth((s) => s.userId);
  const [items, setItems] = useState<StudyItem[] | null>(connected ? null : DEMO);
  const [loading, setLoading] = useState(connected);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!connected || !userId) { setItems(DEMO); setLoading(false); return; }
    let alive = true;
    setLoading(true); setError(false);
    getDueQueue(userId)
      .then((q) => { if (alive) { setItems(orderByConcept(q, concept)); setLoading(false); } })
      .catch(() => { if (alive) { setError(true); setLoading(false); } });
    return () => { alive = false; };
  }, [connected, userId]);

  const submit = async (item: StudyItem, grade: Grade) => {
    if (connected && userId) { try { await submitReview(userId, item, grade); } catch {} }
  };

  return { connected, loading, error, items: items ?? [], submit };
}

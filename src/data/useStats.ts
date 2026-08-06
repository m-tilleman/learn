// Live stats for home + Insights. In demo mode returns a rich sample so the
// public build still looks alive; in live mode reads real figures from Supabase.
import { useEffect, useState } from "react";
import { useAuth, useIsConnected } from "@/auth";
import { getStats, Stats } from "@/data/repo";

export const DEMO_STATS: Stats = {
  dueNow: 22, totalCards: 840, reviewsAllTime: 8412, streak: 23, longestStreak: 41, retention: 91,
  learning: 40, young: 188, mature: 612, avgStability: 34,
  weekReviews: [42, 51, 38, 47, 60, 29, 34],
  forecast: [34, 28, 41, 22, 30, 19, 25],
  leeches: 5,
  dueConcepts: [
    { t: "Spacing effect", s: "due now", c: "cherry" },
    { t: "FSRS scheduler", s: "due now", c: "cherry" },
    { t: "Testing effect", s: "2 left", c: "tangerine" },
    { t: "Dual coding", s: "1 left", c: "turquoise" },
    { t: "Interleaving", s: "3 left", c: "turquoise" },
  ],
};

export function useStats(): { stats: Stats; loading: boolean; connected: boolean } {
  const connected = useIsConnected();
  const userId = useAuth((s) => s.userId);
  const [stats, setStats] = useState<Stats>(DEMO_STATS);
  const [loading, setLoading] = useState(connected);

  useEffect(() => {
    if (!connected || !userId) { setStats(DEMO_STATS); setLoading(false); return; }
    let alive = true;
    setLoading(true);
    getStats(userId)
      .then((s) => { if (alive) { setStats(s); setLoading(false); } })
      .catch(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [connected, userId]);

  return { stats, loading, connected };
}

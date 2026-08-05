import { useEffect } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { theme } from "@/theme";
import { useSession } from "@/store/session";
import { FSRS6, Grade } from "@/lib/fsrs6";
import { dueQueue } from "@/mock/data";

const fsrs = new FSRS6({ requestRetention: 0.9 });
const GRADES: { g: Grade; label: string; color: string }[] = [
  { g: 1, label: "Again", color: theme.again },
  { g: 2, label: "Hard", color: theme.hard },
  { g: 3, label: "Good", color: theme.good },
  { g: 4, label: "Easy", color: theme.easy },
];

export default function Study() {
  const router = useRouter();
  const { startSession, current, revealed, reveal, grade, reviewedCount, finished } = useSession();

  useEffect(() => {
    startSession(dueQueue.map((d) => ({ card: d.card, state: d.state })));
  }, []);

  if (finished()) {
    return (
      <View style={s.center}>
        <Text style={s.done}>Session complete 🎉</Text>
        <Text style={s.muted}>{reviewedCount} cards · retention on track</Text>
        <Pressable style={s.primaryBtn} onPress={() => router.back()}>
          <Text style={s.primaryBtnText}>Done</Text>
        </Pressable>
      </View>
    );
  }

  const item = current();
  if (!item) return null;
  const previews = fsrs.previewIntervals(item.state);
  const fmt = (d: number) => (d < 1 ? "<1d" : d < 30 ? `${d}d` : `${Math.round(d / 30)}mo`);

  return (
    <View style={s.wrap}>
      <View style={s.progress}>
        <View style={[s.progressFill, { width: `${(reviewedCount / dueQueue.length) * 100}%` }]} />
      </View>

      <View style={s.cardArea}>
        <Text style={s.layerTag}>{item.card.layer} · {item.card.type}</Text>
        <Text style={s.prompt}>{item.card.prompt}</Text>
        {revealed && (
          <>
            <View style={s.divider} />
            <Text style={s.answer}>{item.card.answer}</Text>
          </>
        )}
      </View>

      {!revealed ? (
        <Pressable style={s.primaryBtn} onPress={reveal}>
          <Text style={s.primaryBtnText}>Show answer</Text>
        </Pressable>
      ) : (
        <View style={s.gradeRow}>
          {GRADES.map(({ g, label, color }) => (
            <Pressable key={g} style={[s.gradeBtn, { borderColor: color }]} onPress={() => grade(g)}>
              <Text style={[s.gradeLabel, { color }]}>{label}</Text>
              <Text style={s.gradeIvl}>{fmt(previews[g])}</Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: theme.bg, padding: 20, gap: 18 },
  center: { flex: 1, backgroundColor: theme.bg, alignItems: "center", justifyContent: "center", gap: 12 },
  done: { color: theme.text, fontSize: 24, fontWeight: "800" },
  muted: { color: theme.muted, fontSize: 14 },
  progress: { height: 6, backgroundColor: theme.surfaceAlt, borderRadius: 3, overflow: "hidden" },
  progressFill: { height: 6, backgroundColor: theme.primary },
  cardArea: { flex: 1, backgroundColor: theme.surface, borderRadius: theme.radius, borderWidth: 1, borderColor: theme.border, padding: 22, justifyContent: "center" },
  layerTag: { color: theme.primary, fontSize: 12, fontWeight: "700", marginBottom: 14, letterSpacing: 1 },
  prompt: { color: theme.text, fontSize: 22, fontWeight: "600", lineHeight: 30 },
  divider: { height: 1, backgroundColor: theme.border, marginVertical: 18 },
  answer: { color: theme.muted, fontSize: 17, lineHeight: 25 },
  primaryBtn: { backgroundColor: theme.primary, borderRadius: theme.radius, padding: 18, alignItems: "center" },
  primaryBtnText: { color: "#fff", fontSize: 17, fontWeight: "700" },
  gradeRow: { flexDirection: "row", gap: 8 },
  gradeBtn: { flex: 1, borderWidth: 1.5, borderRadius: theme.radius, paddingVertical: 14, alignItems: "center", backgroundColor: theme.surface },
  gradeLabel: { fontSize: 15, fontWeight: "700" },
  gradeIvl: { color: theme.muted, fontSize: 12, marginTop: 3 },
});

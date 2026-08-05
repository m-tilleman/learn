import { useMemo, useRef, useState } from "react";
import { View, Text, Pressable, StyleSheet, Animated, PanResponder, Dimensions } from "react-native";
import { useRouter } from "expo-router";
import { useColors, FONT } from "@/theme";
import { Label, EmptyState, Glyph, useCardShortcuts } from "@/ui";
import { FSRS6, Grade } from "@/lib/fsrs6";
import { tapLight, tapSuccess, tapWarning } from "@/lib/haptics";

const DECK = [
  { tag: "CONCEPT · L1", q: "Why does spacing reviews improve long-term retention more than massing them?", a: "Each retrieval near the point of forgetting is effortful, which drives a larger increase in memory stability — the spacing effect. Massed reviews are too easy to strengthen memory much.", miss: "the role of memory stability." },
  { tag: "CLOZE · L3", q: "In FSRS, ______ is the number of days for recall probability to decay from 100% to 90%.", a: "Stability.", miss: "nothing — spot on." },
  { tag: "APPLICATION · L2", q: "Syncing study state across offline devices — safest source of truth, and why?", a: "An append-only review log: it merges by union with no conflicts, and scheduler state is recomputed by replaying it.", miss: "why logs avoid conflicts." },
];

const GRADES: { g: Grade; label: string; key: keyof ReturnType<typeof gradeColors> }[] = [
  { g: 1, label: "Again", key: "cherry" },
  { g: 2, label: "Hard", key: "tangerine" },
  { g: 3, label: "Good", key: "turquoise" },
  { g: 4, label: "Easy", key: "turquoiseLt" },
];
function gradeColors(c: any) { return { cherry: c.cherry, tangerine: c.tangerine, turquoise: c.turquoise, turquoiseLt: c.turquoiseLt }; }

const fsrs = new FSRS6({ requestRetention: 0.9 });
const fmt = (d: number) => (d < 1 ? "<1d" : d < 30 ? `${d}d` : `${Math.round(d / 30)}mo`);
const { width } = Dimensions.get("window");

export default function Study() {
  const c = useColors();
  const router = useRouter();
  const base = 12, total = 34;
  const [idx, setIdx] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [prev, setPrev] = useState<number | null>(null);
  const flip = useRef(new Animated.Value(0)).current;
  const pan = useRef(new Animated.ValueXY()).current;

  const card = DECK[idx];
  const previews = useMemo(() => fsrs.previewIntervals(null), [idx]);

  const reveal = () => {
    if (revealed) return;
    tapLight();
    setRevealed(true);
    Animated.timing(flip, { toValue: 1, duration: 420, useNativeDriver: true }).start();
  };

  const grade = (g: Grade) => {
    if (!revealed) return;
    g <= 1 ? tapWarning() : tapSuccess();
    setPrev(idx);
    Animated.timing(pan, {
      toValue: { x: g === 4 ? width : g === 1 ? -width : 0, y: g === 3 ? -600 : g === 2 ? 600 : 0 },
      duration: 220, useNativeDriver: true,
    }).start(() => {
      pan.setValue({ x: 0, y: 0 });
      flip.setValue(0);
      setRevealed(false);
      setIdx((i) => i + 1);
    });
  };

  const undo = () => {
    if (prev === null) return;
    setIdx(prev); setPrev(null); flip.setValue(1); setRevealed(true);
  };

  useCardShortcuts({ onReveal: reveal, onGrade: (g) => (revealed ? grade(g) : reveal()) });

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gs) => Math.abs(gs.dx) > 8 || Math.abs(gs.dy) > 8,
      onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], { useNativeDriver: false }),
      onPanResponderRelease: (_, gs) => {
        const TH = 90;
        // reveal is required before swipe-to-grade
        if (Math.abs(gs.dx) < TH && Math.abs(gs.dy) < TH) {
          Animated.spring(pan, { toValue: { x: 0, y: 0 }, useNativeDriver: false }).start();
          return;
        }
        if (Math.abs(gs.dx) > Math.abs(gs.dy)) grade(gs.dx > 0 ? 4 : 1);
        else grade(gs.dy < 0 ? 3 : 2);
      },
    })
  ).current;

  if (idx >= DECK.length) {
    return (
      <View style={[st.screen, { backgroundColor: c.bg }]}>
        <EmptyState glyph="✓" title="Session complete"
          body="3 reviewed · retention on track at 91%. Next session in ~6 hours."
          cta="Back to home" onCta={() => router.replace("/")} />
      </View>
    );
  }

  const frontRotate = flip.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "180deg"] });
  const backRotate = flip.interpolate({ inputRange: [0, 1], outputRange: ["180deg", "360deg"] });
  const frontOpacity = flip.interpolate({ inputRange: [0, 0.5, 0.5, 1], outputRange: [1, 1, 0, 0] });
  const backOpacity = flip.interpolate({ inputRange: [0, 0.5, 0.5, 1], outputRange: [0, 0, 1, 1] });
  const gc = gradeColors(c);

  return (
    <View style={[st.screen, { backgroundColor: c.bg }]}>
      <View style={st.shd}>
        <Pressable accessibilityRole="button" accessibilityLabel="Close session" onPress={() => router.replace("/")}>
          <Glyph g="✕" size={18} color={c.muted} />
        </Pressable>
        <View style={[st.pbar, { backgroundColor: c.border }]}>
          <View style={{ height: "100%", width: `${((base + idx) / total) * 100}%`, backgroundColor: c.tangerine, borderRadius: 3 }} />
        </View>
        <Label>{base + idx + 1}/{total}</Label>
      </View>

      <View style={st.mid}>
        <Animated.View
          {...panResponder.panHandlers}
          style={[st.cardWrap, { transform: [{ translateX: pan.x }, { translateY: pan.y }] }]}
          accessibilityLabel={revealed ? `Answer: ${card.a}` : `Question: ${card.q}`}
        >
          <Animated.View style={[st.face, { opacity: frontOpacity, transform: [{ perspective: 1000 }, { rotateY: frontRotate }] }]}>
            <View style={[st.pill, { backgroundColor: "rgba(95,154,166,0.2)" }]}><Text style={[st.pillT, { color: c.turquoiseLt }]}>{card.tag}</Text></View>
            <Text style={[st.q, { color: c.text }]}>{card.q}</Text>
            <Label style={{ marginTop: 18 }}>TAP OR PRESS SPACE TO REVEAL</Label>
          </Animated.View>

          <Animated.View style={[st.face, st.back, { opacity: backOpacity, transform: [{ perspective: 1000 }, { rotateY: backRotate }] }]}>
            <View style={[st.pill, { backgroundColor: "rgba(95,154,166,0.2)" }]}><Text style={[st.pillT, { color: c.turquoiseLt }]}>{card.tag}</Text></View>
            <View style={[st.ansbox, { backgroundColor: c.card, borderColor: c.border }]}>
              <Text style={{ color: c.text, fontSize: 15, lineHeight: 22, fontFamily: FONT.display }}>{card.a}</Text>
            </View>
            <View style={[st.missed, { backgroundColor: "rgba(226,141,52,0.1)" }]}>
              <Text style={{ color: c.muted, fontSize: 11, fontFamily: FONT.mono }}>MISSING: {card.miss}</Text>
            </View>
            <Label style={{ marginTop: 12 }}>SWIPE ← AGAIN · → EASY · ↑ GOOD · ↓ HARD</Label>
          </Animated.View>
        </Animated.View>
      </View>

      <View style={st.foot}>
        {!revealed ? (
          <Pressable accessibilityRole="button" accessibilityLabel="Show answer" onPress={reveal} style={[st.primary, { backgroundColor: c.tangerine }]}>
            <Text style={{ color: c.onAccent, fontFamily: FONT.display, fontWeight: "600", fontSize: 14 }}>Show answer</Text>
          </Pressable>
        ) : (
          <>
            <View style={{ flexDirection: "row", gap: 8 }}>
              {GRADES.map(({ g, label, key }) => (
                <Pressable key={g} accessibilityRole="button" accessibilityLabel={`Grade ${label}, next review in ${fmt(previews[g])}`}
                  onPress={() => grade(g)} style={[st.grade, { backgroundColor: c.card, borderColor: (gc as any)[key] }]}>
                  <Text style={{ color: (gc as any)[key], fontFamily: FONT.display, fontWeight: "600", fontSize: 13 }}>{label}</Text>
                  <Text style={{ color: c.muted, fontFamily: FONT.mono, fontSize: 10, marginTop: 3 }}>{fmt(previews[g])}</Text>
                </Pressable>
              ))}
            </View>
            <View accessibilityLiveRegion="polite" style={{ flexDirection: "row", justifyContent: "center", marginTop: 10 }}>
              <Text style={{ color: c.turquoiseLt, fontFamily: FONT.mono, fontSize: 11 }}>▲ Stability rising  ·  </Text>
              <Pressable accessibilityRole="button" accessibilityLabel="Undo last grade" onPress={undo}>
                <Text style={{ color: c.muted, fontFamily: FONT.mono, fontSize: 11, textDecorationLine: "underline" }}>Undo</Text>
              </Pressable>
            </View>
          </>
        )}
      </View>
    </View>
  );
}

const st = StyleSheet.create({
  screen: { flex: 1, paddingHorizontal: 20, paddingTop: 18, paddingBottom: 16 },
  shd: { flexDirection: "row", alignItems: "center", gap: 12 },
  pbar: { flex: 1, height: 6, borderRadius: 3, overflow: "hidden" },
  mid: { flex: 1, marginVertical: 16 },
  cardWrap: { flex: 1 },
  face: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, justifyContent: "center", backfaceVisibility: "hidden" },
  back: {},
  pill: { alignSelf: "flex-start", borderRadius: 999, paddingVertical: 5, paddingHorizontal: 11, marginBottom: 16 },
  pillT: { fontFamily: FONT.mono, fontSize: 10, letterSpacing: 1.5 },
  q: { fontFamily: FONT.display, fontSize: 23, fontWeight: "600", lineHeight: 31 },
  ansbox: { marginTop: 4, borderWidth: 1, borderRadius: 14, padding: 15 },
  missed: { marginTop: 10, borderRadius: 10, paddingVertical: 9, paddingHorizontal: 12 },
  foot: {},
  primary: { borderRadius: 12, paddingVertical: 14, alignItems: "center" },
  grade: { flex: 1, borderWidth: 1.5, borderRadius: 12, paddingVertical: 9, alignItems: "center" },
});

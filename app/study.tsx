import { useMemo, useRef, useState } from "react";
import { View, Text, Pressable, TextInput, StyleSheet, Animated, PanResponder, Dimensions } from "react-native";
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

type Conf = "low" | "mid" | "high";
const CONF: { key: Conf; label: string }[] = [
  { key: "low", label: "Guessing" },
  { key: "mid", label: "Fairly sure" },
  { key: "high", label: "Certain" },
];
const GRADES: { g: Grade; label: string; key: "cherry" | "tangerine" | "turquoise" | "turquoiseLt" }[] = [
  { g: 1, label: "Again", key: "cherry" },
  { g: 2, label: "Hard", key: "tangerine" },
  { g: 3, label: "Good", key: "turquoise" },
  { g: 4, label: "Easy", key: "turquoiseLt" },
];

const fsrs = new FSRS6({ requestRetention: 0.9 });
const fmt = (d: number) => (d < 1 ? "<1d" : d < 30 ? `${d}d` : `${Math.round(d / 30)}mo`);
const { width } = Dimensions.get("window");

interface Snap { remaining: number[]; reviewed: number; conf: Conf | null; guess: string; }

export default function Study() {
  const c = useColors();
  const router = useRouter();
  const base = 12, total = 34;

  const [remaining, setRemaining] = useState<number[]>([0, 1, 2]);
  const [reviewed, setReviewed] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [conf, setConf] = useState<Conf | null>(null);
  const [guess, setGuess] = useState("");
  const [flash, setFlash] = useState<string | null>(null);
  const [snap, setSnap] = useState<Snap | null>(null);

  const ans = useRef(new Animated.Value(0)).current;
  const enter = useRef(new Animated.Value(1)).current;
  const pan = useRef(new Animated.ValueXY()).current;
  const flashTimer = useRef<any>(null);

  const current = remaining[0];
  const card = current != null ? DECK[current] : null;
  const previews = useMemo(() => fsrs.previewIntervals(null), [current]);

  const reveal = (conance: Conf) => {
    if (revealed || !card) return;
    tapLight();
    setConf(conance);
    setRevealed(true);
    Animated.timing(ans, { toValue: 1, duration: 300, useNativeDriver: true }).start();
  };

  const settleNext = () => {
    ans.setValue(0);
    setRevealed(false); setConf(null); setGuess("");
    enter.setValue(0.92);
    Animated.spring(enter, { toValue: 1, useNativeDriver: true, speed: 16, bounciness: 6 }).start();
  };

  const grade = (g: Grade) => {
    if (!revealed || current == null) return;
    setSnap({ remaining, reviewed, conf, guess });
    const hyper = conf === "high" && g <= 2; // high-confidence miss → hypercorrection
    hyper ? tapWarning() : g <= 1 ? tapWarning() : tapSuccess();

    const rest = remaining.slice(1);
    if (hyper) {
      rest.splice(Math.min(1, rest.length), 0, current); // re-queue soon, not immediately
      if (flashTimer.current) clearTimeout(flashTimer.current);
      setFlash("You were certain but missed it — bumped to the front.");
      flashTimer.current = setTimeout(() => setFlash(null), 2600);
    }
    Animated.timing(pan, {
      toValue: { x: g === 4 ? width : g === 1 ? -width : 0, y: g === 3 ? -560 : g === 2 ? 560 : 0 },
      duration: 200, useNativeDriver: true,
    }).start(() => {
      pan.setValue({ x: 0, y: 0 });
      setRemaining(rest);
      setReviewed((n) => n + 1);
      settleNext();
    });
  };

  const undo = () => {
    if (!snap) return;
    setRemaining(snap.remaining); setReviewed(snap.reviewed); setConf(snap.conf); setGuess(snap.guess);
    setSnap(null); setRevealed(true); ans.setValue(1); setFlash(null);
  };

  useCardShortcuts({ onReveal: () => (revealed ? undefined : reveal("mid")), onGrade: (g) => (revealed ? grade(g) : reveal("mid")) });

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gs) => Math.abs(gs.dx) > 8 || Math.abs(gs.dy) > 8,
      onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], { useNativeDriver: false }),
      onPanResponderRelease: (_, gs) => {
        const TH = 90;
        if (Math.abs(gs.dx) < TH && Math.abs(gs.dy) < TH) {
          Animated.spring(pan, { toValue: { x: 0, y: 0 }, useNativeDriver: false }).start();
          return;
        }
        if (Math.abs(gs.dx) > Math.abs(gs.dy)) grade(gs.dx > 0 ? 4 : 1);
        else grade(gs.dy < 0 ? 3 : 2);
      },
    })
  ).current;

  if (current == null || !card) {
    return (
      <View style={[st.screen, { backgroundColor: c.bg }]}>
        <EmptyState glyph="✓" title="Session complete"
          body={`${reviewed} reviewed · retention on track at 91%. Next session in ~6 hours.`}
          cta="Back to home" onCta={() => router.replace("/")} />
      </View>
    );
  }

  const ansTranslate = ans.interpolate({ inputRange: [0, 1], outputRange: [16, 0] });
  const gc: Record<string, string> = { cherry: c.cherry, tangerine: c.tangerine, turquoise: c.turquoise, turquoiseLt: c.turquoiseLt };

  return (
    <View style={[st.screen, { backgroundColor: c.bg }]}>
      <View style={st.shd}>
        <Pressable accessibilityRole="button" accessibilityLabel="Close session" onPress={() => router.replace("/")}>
          <Glyph g="✕" size={18} color={c.muted} />
        </Pressable>
        <View style={[st.pbar, { backgroundColor: c.border }]}>
          <View style={{ height: "100%", width: `${((base + reviewed) / total) * 100}%`, backgroundColor: c.tangerine, borderRadius: 3 }} />
        </View>
        <Label>{base + reviewed + 1}/{total}</Label>
      </View>

      {flash && (
        <View style={[st.flash, { backgroundColor: "rgba(226,74,52,0.14)", borderColor: "rgba(226,74,52,0.35)" }]} accessibilityLiveRegion="polite">
          <Text style={{ color: c.cherry, fontFamily: FONT.mono, fontSize: 11 }}>↺ {flash}</Text>
        </View>
      )}

      <Animated.View
        {...panResponder.panHandlers}
        style={[st.mid, { transform: [{ translateX: pan.x }, { translateY: pan.y }, { scale: enter }], opacity: enter }]}
      >
        <View style={[st.pill, { backgroundColor: "rgba(95,154,166,0.2)" }]}>
          <Text style={[st.pillT, { color: c.turquoiseLt }]}>{card.tag}</Text>
        </View>
        <Text style={[st.q, { color: c.text }]}>{card.q}</Text>

        {!revealed && (
          <TextInput
            value={guess}
            onChangeText={setGuess}
            accessibilityLabel="Type your best guess before revealing"
            placeholder="Take your best guess first…"
            placeholderTextColor={c.muted}
            multiline
            style={[st.guess, { backgroundColor: c.card, borderColor: c.border, color: c.text }]}
          />
        )}

        {revealed && (
          <Animated.View style={{ opacity: ans, transform: [{ translateY: ansTranslate }] }}>
            {guess.trim().length > 0 && (
              <View style={{ marginBottom: 12 }}>
                <Label>YOUR GUESS{conf ? ` · ${CONF.find((x) => x.key === conf)!.label.toUpperCase()}` : ""}</Label>
                <Text style={{ color: c.muted, fontSize: 14, lineHeight: 20, fontFamily: FONT.display, marginTop: 4 }}>{guess}</Text>
              </View>
            )}
            <View style={[st.rule, { backgroundColor: c.border }]} />
            <View style={[st.ansbox, { backgroundColor: c.card, borderColor: c.border }]}>
              <Text style={{ color: c.text, fontSize: 15, lineHeight: 22, fontFamily: FONT.display }}>{card.a}</Text>
            </View>
            <View style={[st.missed, { backgroundColor: "rgba(226,141,52,0.1)" }]}>
              <Text style={{ color: c.muted, fontSize: 11, fontFamily: FONT.mono }}>MISSING: {card.miss}</Text>
            </View>
          </Animated.View>
        )}
      </Animated.View>

      <View style={st.foot}>
        {!revealed ? (
          <>
            <Label style={{ textAlign: "center", marginBottom: 10 }}>REVEAL — HOW SURE ARE YOU?</Label>
            <View style={{ flexDirection: "row", gap: 8 }}>
              {CONF.map(({ key, label }) => (
                <Pressable key={key} accessibilityRole="button" accessibilityLabel={`Reveal, confidence ${label}`}
                  onPress={() => reveal(key)} style={[st.conf, { backgroundColor: c.card, borderColor: c.border }]}>
                  <Text style={{ color: c.text, fontFamily: FONT.display, fontWeight: "600", fontSize: 13 }}>{label}</Text>
                </Pressable>
              ))}
            </View>
          </>
        ) : (
          <>
            <View style={{ flexDirection: "row", gap: 8 }}>
              {GRADES.map(({ g, label, key }) => (
                <Pressable key={g} accessibilityRole="button" accessibilityLabel={`Grade ${label}, next review in ${fmt(previews[g])}`}
                  onPress={() => grade(g)} style={[st.grade, { backgroundColor: c.card, borderColor: gc[key] }]}>
                  <Text style={{ color: gc[key], fontFamily: FONT.display, fontWeight: "600", fontSize: 13 }}>{label}</Text>
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
  shd: { flexDirection: "row", alignItems: "center", gap: 12, flexShrink: 0 },
  pbar: { flex: 1, height: 6, borderRadius: 3, overflow: "hidden" },
  flash: { marginTop: 12, borderWidth: 1, borderRadius: 10, paddingVertical: 8, paddingHorizontal: 12, flexShrink: 0 },
  mid: { flex: 1, justifyContent: "center", minHeight: 0 },
  pill: { alignSelf: "flex-start", borderRadius: 999, paddingVertical: 5, paddingHorizontal: 11, marginBottom: 16 },
  pillT: { fontFamily: FONT.mono, fontSize: 10, letterSpacing: 1.5 },
  q: { fontFamily: FONT.display, fontSize: 23, fontWeight: "600", lineHeight: 31 },
  guess: { marginTop: 16, borderWidth: 1, borderRadius: 12, padding: 12, fontSize: 14, minHeight: 52, fontFamily: FONT.display, textAlignVertical: "top" },
  rule: { height: 1, marginTop: 4, marginBottom: 16 },
  ansbox: { borderWidth: 1, borderRadius: 14, padding: 15 },
  missed: { marginTop: 10, borderRadius: 10, paddingVertical: 9, paddingHorizontal: 12 },
  foot: { flexShrink: 0 },
  conf: { flex: 1, borderWidth: 1.5, borderRadius: 12, paddingVertical: 12, alignItems: "center" },
  grade: { flex: 1, borderWidth: 1.5, borderRadius: 12, paddingVertical: 9, alignItems: "center" },
});

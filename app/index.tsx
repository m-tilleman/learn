import { View, Text, Pressable, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import Svg, { Defs, LinearGradient as SvgGradient, Stop, Rect, Circle, Polyline, Text as SvgText } from "react-native-svg";
import { useColors, FONT } from "@/theme";
import { TabBar, Label } from "@/ui";
import { tapLight } from "@/lib/haptics";
import { useStats } from "@/data/useStats";

export default function Home() {
  const c = useColors();
  const router = useRouter();
  const { stats } = useStats();

  const dueNow = stats.dueNow;
  const doneToday = stats.weekReviews[6] ?? 0;
  const total = Math.max(1, doneToday + dueNow);
  const done = Math.min(doneToday, total);
  const mins = dueNow === 0 ? 0 : Math.max(1, Math.round(dueNow * 0.25));
  const DUE = stats.dueConcepts;
  const C = 2 * Math.PI * 40;

  const openConcept = (name: string) => {
    tapLight();
    router.push(`/study?concept=${encodeURIComponent(name)}` as any);
  };

  return (
    <View style={[st.screen, { backgroundColor: c.bg }]}>
      <View style={st.hd}>
        <Text style={[st.wordmark, { color: c.text }]}>RECALL</Text>
        <View style={[st.streak, { backgroundColor: "rgba(226,141,52,0.16)" }]}>
          <Text style={{ color: c.tangerineSoft, fontWeight: "600", fontFamily: FONT.display }}>▲ {stats.streak}</Text>
        </View>
      </View>

      <View style={st.hero}>
        <Svg style={StyleSheet.absoluteFill} width="100%" height="100%">
          <Defs>
            <SvgGradient id="hero" x1="0.9" y1="0" x2="0.1" y2="1">
              <Stop offset="0" stopColor={c.gradientA} />
              <Stop offset="0.5" stopColor={c.gradientC} />
              <Stop offset="1" stopColor={c.gradientB} />
            </SvgGradient>
          </Defs>
          <Rect x="0" y="0" width="100%" height="100%" fill="url(#hero)" />
        </Svg>
        <View style={st.heroText}>
          <Label style={{ color: "rgba(255,255,255,0.85)" }}>TODAY'S SESSION</Label>
          <Text style={st.hbig}>{dueNow === 0 ? "All caught up" : `${dueNow} card${dueNow === 1 ? "" : "s"} left`}</Text>
          <Label style={{ color: "rgba(255,255,255,0.85)" }}>{dueNow === 0 ? "NOTHING DUE · NICE WORK" : `≈ ${mins} MIN · MIXED REVIEW`}</Label>
        </View>
        <Svg width={78} height={78} viewBox="0 0 96 96" style={{ position: "absolute", top: 15, right: 15 }}>
          <Circle cx={48} cy={48} r={40} fill="none" stroke="rgba(20,15,8,0.35)" strokeWidth={7} />
          <Circle cx={48} cy={48} r={40} fill="none" stroke="#FBF6EB" strokeWidth={7} strokeLinecap="round"
            strokeDasharray={`${C}`} strokeDashoffset={C * (1 - done / total)} transform="rotate(-90 48 48)" />
          <SvgText x={48} y={46} textAnchor="middle" fontSize={19} fontWeight="600" fill="#FBF6EB" fontFamily="Space Grotesk">{String(done)}</SvgText>
          <SvgText x={48} y={61} textAnchor="middle" fontSize={9} fill="rgba(251,246,235,0.8)" fontFamily="Space Mono">of {total}</SvgText>
        </Svg>
      </View>

      <View style={st.statrow}>
        <View style={[st.stat, { backgroundColor: c.card, borderColor: c.border }]}>
          <Label>RETENTION</Label>
          <Text style={[st.statbig, { color: c.text }]}>{stats.retention == null ? "—" : `${stats.retention}%`}</Text>
          <Svg width="100%" height={18} viewBox="0 0 100 18" preserveAspectRatio="none">
            <Polyline points="0,13 17,11 33,12 50,8 67,9 83,5 100,4" fill="none" stroke={c.turquoiseLt} strokeWidth={2.5} />
          </Svg>
        </View>
        <View style={[st.stat, { backgroundColor: c.card, borderColor: c.border }]}>
          <Label>MATURE</Label>
          <Text style={[st.statbig, { color: c.text }]}>{stats.mature}</Text>
          <Label style={{ marginTop: 6, color: c.turquoiseLt }}>OF {stats.totalCards} CARDS</Label>
        </View>
      </View>

      <Label style={{ marginTop: 22, marginBottom: 8 }}>DUE TODAY</Label>
      <View style={st.chips}>
        {DUE.length === 0 ? (
          <Pressable accessibilityRole="button" accessibilityLabel="Add material"
            onPress={() => { tapLight(); router.push("/ingest" as any); }}
            style={[st.chip, { backgroundColor: c.card, borderColor: c.border }]}>
            <View style={[st.dot, { backgroundColor: c.turquoise }]} />
            <Text style={{ color: c.text, fontSize: 12, fontFamily: FONT.display }}>
              {stats.totalCards === 0 ? "Add material to start →" : "Nothing due — add material →"}
            </Text>
          </Pressable>
        ) : DUE.map((d, i) => (
          <Pressable key={i} accessibilityRole="button" accessibilityLabel={`Study ${d.t}`}
            onPress={() => openConcept(d.t)} style={[st.chip, { backgroundColor: c.card, borderColor: c.border }]}>
            <View style={[st.dot, { backgroundColor: (c as any)[d.c] }]} />
            <Text style={{ color: c.text, fontSize: 12, fontFamily: FONT.display }}>{d.t} · {d.s}</Text>
          </Pressable>
        ))}
      </View>

      <View style={{ flex: 1 }} />
      <TabBar />
    </View>
  );
}

const st = StyleSheet.create({
  screen: { flex: 1, paddingHorizontal: 20, paddingTop: 14, paddingBottom: 8 },
  hd: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  wordmark: { fontFamily: FONT.mono, fontSize: 15, letterSpacing: 4, fontWeight: "700" },
  streak: { flexDirection: "row", alignItems: "center", paddingVertical: 5, paddingHorizontal: 12, borderRadius: 999 },
  hero: { marginTop: 16, height: 146, borderRadius: 18, overflow: "hidden", padding: 16, justifyContent: "flex-end" },
  heroText: { maxWidth: 190 },
  hbig: { fontFamily: FONT.display, fontSize: 23, fontWeight: "600", color: "#FFFBF2", marginVertical: 2 },
  statrow: { flexDirection: "row", gap: 12, marginTop: 16 },
  stat: { flex: 1, borderWidth: 1, borderRadius: 14, padding: 12 },
  statbig: { fontFamily: FONT.display, fontSize: 25, fontWeight: "600", marginTop: 3 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { flexDirection: "row", alignItems: "center", gap: 7, borderWidth: 1, borderRadius: 999, paddingVertical: 8, paddingHorizontal: 12 },
  dot: { width: 6, height: 6, borderRadius: 3 },
});

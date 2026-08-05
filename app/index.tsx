import { useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Circle, Polyline, Text as SvgText } from "react-native-svg";
import { Ionicons } from "@expo/vector-icons";
import { useColors, FONT } from "@/theme";
import { TabBar, Label } from "@/ui";
import { tapLight } from "@/lib/haptics";

const DUE = [
  { t: "Spacing effect", c: "cherry", s: "due now" },
  { t: "FSRS scheduler", c: "cherry", s: "due now" },
  { t: "Testing effect", c: "tangerine", s: "2 left" },
  { t: "Dual coding", c: "turquoise", s: "1 left" },
  { t: "Interleaving", c: "turquoise", s: "3 left" },
] as const;

export default function Home() {
  const c = useColors();
  const router = useRouter();
  const [onb, setOnb] = useState(true);
  const done = 12, total = 34;
  const C = 2 * Math.PI * 40;

  return (
    <View style={[st.screen, { backgroundColor: c.bg }]}>
      <View style={st.statusbar}>
        <Label>9:41</Label>
        <View style={{ flexDirection: "row", gap: 5 }}>
          <Ionicons name="cellular" size={13} color={c.muted} />
          <Ionicons name="wifi" size={13} color={c.muted} />
          <Ionicons name="battery-half" size={13} color={c.muted} />
        </View>
      </View>

      <View style={st.hd}>
        <Text style={[st.wordmark, { color: c.text }]}>RECALL</Text>
        <View style={[st.streak, { backgroundColor: "rgba(226,141,52,0.16)" }]}>
          <Ionicons name="flame" size={13} color={c.tangerineSoft} />
          <Text style={{ color: c.tangerineSoft, fontWeight: "600", fontFamily: FONT.display }}>23</Text>
        </View>
      </View>

      {onb && (
        <Pressable
          onPress={() => setOnb(false)}
          accessibilityRole="button"
          accessibilityLabel="Dismiss onboarding tip"
          style={[st.onb, { backgroundColor: "rgba(226,74,52,0.13)", borderColor: "rgba(226,74,52,0.3)" }]}
        >
          <Text style={{ color: c.text, fontSize: 12, fontFamily: FONT.display }}>✨  New here? Take the 30-second tour</Text>
          <Ionicons name="close" size={14} color={c.muted} />
        </Pressable>
      )}

      <LinearGradient
        colors={[c.gradientA, c.gradientC, c.gradientB]}
        locations={[0, 0.5, 1]}
        start={{ x: 0.9, y: 0 }}
        end={{ x: 0.1, y: 1 }}
        style={st.hero}
      >
        <View style={st.heroText}>
          <Label style={{ color: "rgba(255,255,255,0.85)" }}>TODAY'S SESSION</Label>
          <Text style={st.hbig}>22 cards left</Text>
          <Label style={{ color: "rgba(255,255,255,0.85)" }}>≈ 6 MIN · MIXED REVIEW</Label>
        </View>
        <Svg width={78} height={78} viewBox="0 0 96 96" style={{ position: "absolute", top: 15, right: 15 }}>
          <Circle cx={48} cy={48} r={40} fill="none" stroke="rgba(20,15,8,0.35)" strokeWidth={7} />
          <Circle cx={48} cy={48} r={40} fill="none" stroke="#FBF6EB" strokeWidth={7} strokeLinecap="round"
            strokeDasharray={`${C}`} strokeDashoffset={C * (1 - done / total)} transform="rotate(-90 48 48)" />
          <SvgText x={48} y={46} textAnchor="middle" fontSize={19} fontWeight="600" fill="#FBF6EB" fontFamily="Space Grotesk">{String(done)}</SvgText>
          <SvgText x={48} y={61} textAnchor="middle" fontSize={9} fill="rgba(251,246,235,0.8)" fontFamily="Space Mono">of {total}</SvgText>
        </Svg>
      </LinearGradient>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Continue today's study session"
        onPress={() => { tapLight(); router.push("/study"); }}
        style={[st.primary, { backgroundColor: c.tangerine }]}
      >
        <Text style={{ color: c.onAccent, fontFamily: FONT.display, fontWeight: "600", fontSize: 14 }}>Continue session</Text>
        <Ionicons name="arrow-forward" size={16} color={c.onAccent} />
      </Pressable>

      <View style={st.statrow}>
        <View style={[st.stat, { backgroundColor: c.card, borderColor: c.border }]}>
          <Label>RETENTION</Label>
          <Text style={[st.statbig, { color: c.text }]}>91%</Text>
          <Svg width="100%" height={18} viewBox="0 0 100 18" preserveAspectRatio="none">
            <Polyline points="0,13 17,11 33,12 50,8 67,9 83,5 100,4" fill="none" stroke={c.turquoiseLt} strokeWidth={2.5} />
          </Svg>
        </View>
        <View style={[st.stat, { backgroundColor: c.card, borderColor: c.border }]}>
          <Label>MATURE</Label>
          <Text style={[st.statbig, { color: c.text }]}>612</Text>
          <Label style={{ marginTop: 6, color: c.turquoiseLt }}>+18 THIS WEEK</Label>
        </View>
      </View>

      <Label style={{ marginTop: 15, marginBottom: 8 }}>DUE TODAY</Label>
      <View style={st.chips}>
        {DUE.map((d, i) => (
          <View key={i} style={[st.chip, { backgroundColor: c.card, borderColor: c.border }]}>
            <View style={[st.dot, { backgroundColor: (c as any)[d.c] }]} />
            <Text style={{ color: c.text, fontSize: 12, fontFamily: FONT.display }}>{d.t} · {d.s}</Text>
          </View>
        ))}
      </View>

      <View style={{ flex: 1 }} />
      <TabBar />
    </View>
  );
}

const st = StyleSheet.create({
  screen: { flex: 1, paddingHorizontal: 20, paddingTop: 14, paddingBottom: 8 },
  statusbar: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  hd: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  wordmark: { fontFamily: FONT.mono, fontSize: 15, letterSpacing: 4, fontWeight: "700" },
  streak: { flexDirection: "row", alignItems: "center", gap: 5, paddingVertical: 5, paddingHorizontal: 12, borderRadius: 999 },
  onb: { marginTop: 13, borderWidth: 1, borderRadius: 12, padding: 11, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  hero: { marginTop: 13, height: 146, borderRadius: 18, overflow: "hidden", padding: 16, justifyContent: "flex-end" },
  heroText: { maxWidth: 190 },
  hbig: { fontFamily: FONT.display, fontSize: 23, fontWeight: "600", color: "#FFFBF2", marginVertical: 2 },
  primary: { marginTop: 12, borderRadius: 12, paddingVertical: 12, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 },
  statrow: { flexDirection: "row", gap: 12, marginTop: 13 },
  stat: { flex: 1, borderWidth: 1, borderRadius: 14, padding: 12 },
  statbig: { fontFamily: FONT.display, fontSize: 25, fontWeight: "600", marginTop: 3 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { flexDirection: "row", alignItems: "center", gap: 7, borderWidth: 1, borderRadius: 999, paddingVertical: 6, paddingHorizontal: 12 },
  dot: { width: 6, height: 6, borderRadius: 3 },
});

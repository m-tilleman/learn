import { View, Text, Pressable, StyleSheet, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import Svg, { Polyline } from "react-native-svg";
import { useColors, FONT } from "@/theme";
import { TabBar, Label, Glyph } from "@/ui";

const WEEK = [42, 51, 38, 47, 60, 29, 34];
const FORECAST = [34, 28, 41, 22, 30, 19, 25];
const DAYS = ["M", "T", "W", "T", "F", "S", "S"];
const FDAYS = ["1", "2", "3", "4", "5", "6", "7"];

// Card maturity buckets.
const LEARNING = 40, YOUNG = 188, MATURE = 612;
const TOTAL = LEARNING + YOUNG + MATURE;

const sum = (a: number[]) => a.reduce((x, y) => x + y, 0);

export default function Stats() {
  const c = useColors();
  const router = useRouter();
  const wkMax = Math.max(...WEEK);
  const fcMax = Math.max(...FORECAST);
  const wkTotal = sum(WEEK);
  const wkAvg = Math.round(wkTotal / WEEK.length);
  const fcTotal = sum(FORECAST);

  const Caption = ({ children }: { children: React.ReactNode }) => (
    <Text style={[s.caption, { color: c.muted }]}>{children}</Text>
  );

  return (
    <View style={[s.screen, { backgroundColor: c.bg }]}>
      <Text style={[s.title, { color: c.text }]}>Insights</Text>
      <Text style={[s.subtitle, { color: c.muted }]}>How well your memory is holding — and what to do about it.</Text>

      <ScrollView style={{ flex: 1, marginTop: 12 }} contentContainerStyle={{ paddingBottom: 12 }} showsVerticalScrollIndicator={false}>

        {/* TRUE RETENTION */}
        <View style={[s.card, { backgroundColor: c.card, borderColor: c.border }]}>
          <Label>TRUE RETENTION</Label>
          <View style={{ flexDirection: "row", alignItems: "baseline", gap: 8, marginTop: 2 }}>
            <Text style={{ fontFamily: FONT.display, fontSize: 34, fontWeight: "600", color: c.text }}>91%</Text>
            <Label style={{ color: c.turquoiseLt }}>TARGET 90%</Label>
          </View>
          <Svg width="100%" height={30} viewBox="0 0 100 30" preserveAspectRatio="none" style={{ marginTop: 8 }}>
            <Polyline points="0,22 14,20 28,21 43,14 57,15 71,9 85,8 100,6" fill="none" stroke={c.turquoiseLt} strokeWidth={2.5} />
          </Svg>
          <Caption>Share of due cards you recalled correctly. You're 1 point above your 90% target — memories are sticking. Raise the target to review less often, or keep it as a safety margin.</Caption>
        </View>

        {/* CONSISTENCY / THIS WEEK */}
        <Label style={s.section}>REVIEWS · THIS WEEK</Label>
        <View style={[s.card, { backgroundColor: c.card, borderColor: c.border }]}>
          <View style={{ flexDirection: "row", alignItems: "baseline", gap: 8 }}>
            <Text style={{ fontFamily: FONT.display, fontSize: 26, fontWeight: "600", color: c.text }}>{wkTotal}</Text>
            <Label>REVIEWS · ~{wkAvg}/DAY</Label>
          </View>
          <View style={[s.chartInner, { marginTop: 12 }]}>
            {WEEK.map((v, i) => (
              <View key={i} style={{ flex: 1, alignItems: "center" }}>
                <View style={{ width: "72%", height: 10 + (v / wkMax) * 74, backgroundColor: c.tangerine, borderTopLeftRadius: 4, borderTopRightRadius: 4 }} />
              </View>
            ))}
          </View>
          <View style={s.axis}>{DAYS.map((d, i) => <Text key={i} style={[s.axisT, { color: c.muted }]}>{d}</Text>)}</View>
          <Caption>How many cards you reviewed each day. Consistency matters more than volume — a little every day keeps your intervals honest and prevents pile-ups.</Caption>
        </View>

        {/* CARD MATURITY */}
        <Label style={s.section}>CARD MATURITY</Label>
        <View style={[s.card, { backgroundColor: c.card, borderColor: c.border }]}>
          <View style={s.matBar}>
            <View style={{ flex: LEARNING, backgroundColor: c.muted }} />
            <View style={{ flex: YOUNG, backgroundColor: c.tangerineSoft }} />
            <View style={{ flex: MATURE, backgroundColor: c.turquoise }} />
          </View>
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 12 }}>
            <Legend c={c} color={c.muted} n={LEARNING} label="LEARNING" />
            <Legend c={c} color={c.tangerineSoft} n={YOUNG} label="YOUNG" />
            <Legend c={c} color={c.turquoise} n={MATURE} label="MATURE" />
          </View>
          <Caption>A card turns "mature" once its interval passes ~21 days — the point where the memory is genuinely durable. {Math.round((MATURE / TOTAL) * 100)}% of your {TOTAL} cards are mature; growing that share is the real goal.</Caption>
        </View>

        {/* MEMORY STRENGTH */}
        <Label style={s.section}>MEMORY STRENGTH</Label>
        <View style={[s.card, { backgroundColor: c.card, borderColor: c.border }]}>
          <View style={{ flexDirection: "row", alignItems: "baseline", gap: 8 }}>
            <Text style={{ fontFamily: FONT.display, fontSize: 26, fontWeight: "600", color: c.text }}>~34 days</Text>
            <Label style={{ color: c.turquoiseLt }}>AVG. STABILITY</Label>
          </View>
          <Caption>On average, how long a card stays above 90% recall before it's due again. Higher means stronger, longer-lasting memory — it climbs every time you recall successfully.</Caption>
        </View>

        {/* FORECAST */}
        <Label style={s.section}>WORKLOAD · NEXT 7 DAYS</Label>
        <View style={[s.card, { backgroundColor: c.card, borderColor: c.border }]}>
          <View style={{ flexDirection: "row", alignItems: "baseline", gap: 8 }}>
            <Text style={{ fontFamily: FONT.display, fontSize: 26, fontWeight: "600", color: c.text }}>{fcTotal}</Text>
            <Label>DUE · PEAK {fcMax}</Label>
          </View>
          <View style={[s.chartInner, { marginTop: 12 }]}>
            {FORECAST.map((v, i) => (
              <View key={i} style={{ flex: 1, alignItems: "center" }}>
                <View style={{ width: "72%", height: 10 + (v / fcMax) * 74, backgroundColor: c.turquoise, borderTopLeftRadius: 4, borderTopRightRadius: 4 }} />
              </View>
            ))}
          </View>
          <View style={s.axis}>{FDAYS.map((d, i) => <Text key={i} style={[s.axisT, { color: c.muted }]}>+{d}</Text>)}</View>
          <Caption>Cards coming due each of the next 7 days, so you can plan ahead. If one day spikes, studying a little early flattens it so no single day overwhelms you.</Caption>
        </View>

        {/* LEECHES — actionable */}
        <Label style={s.section}>NEEDS ATTENTION</Label>
        <Pressable accessibilityRole="button" accessibilityLabel="Review your 5 leeches"
          onPress={() => router.push("/study?concept=leech" as any)}
          style={[s.card, { backgroundColor: c.card, borderColor: "rgba(226,74,52,0.35)" }]}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <View style={{ flexDirection: "row", alignItems: "baseline", gap: 8 }}>
              <Text style={{ fontFamily: FONT.display, fontSize: 26, fontWeight: "600", color: c.cherry }}>5</Text>
              <Label style={{ color: c.cherry }}>LEECHES</Label>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <Text style={{ fontFamily: FONT.mono, fontSize: 11, color: c.text }}>REVIEW</Text>
              <Glyph g="→" size={14} color={c.text} />
            </View>
          </View>
          <Caption>Cards you keep forgetting (4+ lapses). They quietly eat your study time — the fix is usually to reformulate them into smaller, clearer, one-fact cards.</Caption>
        </Pressable>

      </ScrollView>

      <TabBar />
    </View>
  );
}

function Legend({ c, color, n, label }: { c: any; color: string; n: number; label: string }) {
  return (
    <View style={{ flex: 1 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
        <View style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: color }} />
        <Text style={{ fontFamily: FONT.display, fontSize: 18, fontWeight: "600", color: c.text }}>{n}</Text>
      </View>
      <Label style={{ marginTop: 3 }}>{label}</Label>
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  title: { fontFamily: FONT.display, fontSize: 23, fontWeight: "600", letterSpacing: -0.4 },
  subtitle: { fontFamily: FONT.display, fontSize: 13, marginTop: 4, lineHeight: 18 },
  section: { marginTop: 18, marginBottom: 8 },
  card: { borderWidth: 1, borderRadius: 16, padding: 16 },
  caption: { fontFamily: FONT.display, fontSize: 12.5, lineHeight: 18, marginTop: 12 },
  chartInner: { flexDirection: "row", alignItems: "flex-end", height: 88, gap: 7 },
  axis: { flexDirection: "row", marginTop: 6 },
  axisT: { flex: 1, textAlign: "center", fontFamily: FONT.mono, fontSize: 9 },
  matBar: { flexDirection: "row", height: 16, borderRadius: 8, overflow: "hidden" },
});

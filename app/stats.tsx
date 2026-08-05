import { View, Text, StyleSheet, ScrollView } from "react-native";
import Svg, { Polyline } from "react-native-svg";
import { useColors, FONT } from "@/theme";
import { TabBar, Label } from "@/ui";

const WEEK = [42, 51, 38, 47, 60, 29, 34];
const FORECAST = [34, 28, 41, 22, 30, 19, 25];
const DAYS = ["M", "T", "W", "T", "F", "S", "S"];

export default function Stats() {
  const c = useColors();
  const wkMax = Math.max(...WEEK);
  const fcMax = 45;
  return (
    <View style={[st.screen, { backgroundColor: c.bg }]}>
      <View style={st.statusbar}>
        <Label>9:41</Label>
        <Label>5G · 100%</Label>
      </View>
      <Text style={[st.title, { color: c.text }]}>Insights</Text>

      <ScrollView style={{ flex: 1, marginTop: 10 }} contentContainerStyle={{ paddingBottom: 10 }}>
        <View style={[st.big, { backgroundColor: c.card, borderColor: c.border }]}>
          <Label>TRUE RETENTION</Label>
          <View style={{ flexDirection: "row", alignItems: "baseline", gap: 8 }}>
            <Text style={{ fontFamily: FONT.display, fontSize: 34, fontWeight: "600", color: c.text }}>91%</Text>
            <Label style={{ color: c.turquoiseLt }}>TARGET 90%</Label>
          </View>
          <Svg width="100%" height={30} viewBox="0 0 100 30" preserveAspectRatio="none" style={{ marginTop: 6 }}>
            <Polyline points="0,22 14,20 28,21 43,14 57,15 71,9 85,8 100,6" fill="none" stroke={c.turquoiseLt} strokeWidth={2.5} />
          </Svg>
        </View>

        <Label style={{ marginTop: 16, marginBottom: 8 }}>REVIEWS · THIS WEEK</Label>
        <View style={[st.chart, { backgroundColor: c.card, borderColor: c.border }]}>
          <View style={st.bars}>
            {WEEK.map((v, i) => (
              <View key={i} style={{ flex: 1, alignItems: "center" }}>
                <View style={{ width: "72%", height: 10 + (v / wkMax) * 82, backgroundColor: c.tangerine, borderTopLeftRadius: 4, borderTopRightRadius: 4 }} />
              </View>
            ))}
          </View>
          <View style={st.axis}>{DAYS.map((d, i) => <Text key={i} style={[st.axisT, { color: c.muted }]}>{d}</Text>)}</View>
        </View>

        <View style={st.statrow}>
          <View style={[st.stat, { backgroundColor: c.card, borderColor: c.border }]}><Label>MATURE</Label><Text style={[st.statbig, { color: c.text }]}>612</Text></View>
          <View style={[st.stat, { backgroundColor: c.card, borderColor: c.border }]}><Label>YOUNG</Label><Text style={[st.statbig, { color: c.text }]}>188</Text></View>
          <View style={[st.stat, { backgroundColor: c.card, borderColor: c.border }]}><Label style={{ color: c.cherry }}>LEECHES</Label><Text style={[st.statbig, { color: c.cherry }]}>5</Text></View>
        </View>

        <Label style={{ marginTop: 16, marginBottom: 8 }}>FORECAST · NEXT 7 DAYS</Label>
        <View style={[st.chart, { backgroundColor: c.card, borderColor: c.border }]}>
          <View style={st.bars}>
            {FORECAST.map((v, i) => (
              <View key={i} style={{ flex: 1, alignItems: "center" }}>
                <View style={{ width: "72%", height: 10 + (v / fcMax) * 82, backgroundColor: c.turquoise, borderTopLeftRadius: 4, borderTopRightRadius: 4 }} />
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      <TabBar />
    </View>
  );
}

const st = StyleSheet.create({
  screen: { flex: 1, paddingHorizontal: 20, paddingTop: 14, paddingBottom: 8 },
  statusbar: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  title: { fontFamily: FONT.display, fontSize: 23, fontWeight: "600", letterSpacing: -0.4 },
  big: { borderWidth: 1, borderRadius: 16, padding: 16 },
  chart: { borderWidth: 1, borderRadius: 14, padding: 14 },
  bars: { flexDirection: "row", alignItems: "flex-end", height: 96, gap: 7 },
  axis: { flexDirection: "row", marginTop: 6 },
  axisT: { flex: 1, textAlign: "center", fontFamily: FONT.mono, fontSize: 9 },
  statrow: { flexDirection: "row", gap: 12, marginTop: 16 },
  stat: { flex: 1, borderWidth: 1, borderRadius: 14, padding: 12 },
  statbig: { fontFamily: FONT.display, fontSize: 25, fontWeight: "600", marginTop: 3 },
});

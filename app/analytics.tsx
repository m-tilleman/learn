import { View, Text, StyleSheet, ScrollView } from "react-native";
import { theme } from "@/theme";
import { analytics } from "@/mock/data";

export default function Analytics() {
  const week = analytics.reviewsThisWeek;
  const max = Math.max(...week);
  return (
    <ScrollView style={{ backgroundColor: theme.bg }} contentContainerStyle={s.pad}>
      <View style={s.row}>
        <Stat label="Retention" value={`${Math.round(analytics.retention * 100)}%`} accent={theme.good} />
        <Stat label="Mature" value={String(analytics.matureCards)} />
        <Stat label="Leeches" value={String(analytics.leeches)} accent={theme.again} />
      </View>

      <Text style={s.h2}>Reviews this week</Text>
      <View style={s.chart}>
        {week.map((v, i) => (
          <View key={i} style={s.barCol}>
            <View style={[s.bar, { height: 20 + (v / max) * 90 }]} />
            <Text style={s.axis}>{["M", "T", "W", "T", "F", "S", "S"][i]}</Text>
          </View>
        ))}
      </View>

      <Text style={s.h2}>Forecast (next 10 days)</Text>
      <View style={s.chart}>
        {analytics.forecast30d.map((v, i) => (
          <View key={i} style={s.barCol}>
            <View style={[s.bar, { height: 20 + v * 2, backgroundColor: theme.primaryDim }]} />
          </View>
        ))}
      </View>
      <Text style={s.muted}>Load smoothing keeps daily reviews near your cap — pace ingestion accordingly.</Text>
    </ScrollView>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <View style={s.stat}>
      <Text style={[s.statValue, accent ? { color: accent } : null]}>{value}</Text>
      <Text style={s.muted}>{label}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  pad: { padding: 20, gap: 14 },
  row: { flexDirection: "row", gap: 10 },
  stat: { flex: 1, backgroundColor: theme.surface, borderRadius: theme.radius, padding: 14, borderWidth: 1, borderColor: theme.border },
  statValue: { color: theme.text, fontSize: 22, fontWeight: "700" },
  muted: { color: theme.muted, fontSize: 13 },
  h2: { color: theme.text, fontSize: 17, fontWeight: "600", marginTop: 8 },
  chart: { flexDirection: "row", alignItems: "flex-end", gap: 8, height: 130, backgroundColor: theme.surface, borderRadius: theme.radius, padding: 14, borderWidth: 1, borderColor: theme.border },
  barCol: { flex: 1, alignItems: "center", justifyContent: "flex-end", gap: 6 },
  bar: { width: "70%", backgroundColor: theme.primary, borderRadius: 4 },
  axis: { color: theme.muted, fontSize: 11 },
});

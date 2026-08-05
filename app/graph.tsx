import { View, Text, StyleSheet, ScrollView } from "react-native";
import { theme } from "@/theme";

// Placeholder graph. In production, render with react-native-svg + a force layout
// (d3-force). Node size = stability/mastery; color = retention; edges = concept_edges.
const nodes = [
  { id: "spacing", x: 0.5, y: 0.2, r: 30, label: "Spacing effect", mastery: 0.9 },
  { id: "testing", x: 0.22, y: 0.45, r: 24, label: "Testing effect", mastery: 0.7 },
  { id: "fsrs", x: 0.78, y: 0.45, r: 26, label: "FSRS", mastery: 0.5 },
  { id: "stability", x: 0.6, y: 0.72, r: 18, label: "Stability", mastery: 0.4 },
  { id: "dual", x: 0.35, y: 0.75, r: 16, label: "Dual coding", mastery: 0.85 },
];
const edges: [string, string][] = [["spacing", "testing"], ["spacing", "fsrs"], ["fsrs", "stability"], ["testing", "dual"]];

export default function Graph() {
  const color = (m: number) => (m > 0.75 ? theme.good : m > 0.5 ? theme.hard : theme.again);
  return (
    <ScrollView style={{ backgroundColor: theme.bg }} contentContainerStyle={s.pad}>
      <Text style={s.muted}>Node size = mastery · color = retention · tap a concept to review its cluster.</Text>
      <View style={s.canvas}>
        {nodes.map((n) => (
          <View
            key={n.id}
            style={[
              s.node,
              { left: `${n.x * 100}%`, top: `${n.y * 100}%`, width: n.r * 2, height: n.r * 2, borderRadius: n.r, marginLeft: -n.r, marginTop: -n.r, borderColor: color(n.mastery) },
            ]}
          >
            <Text style={s.nodeLabel} numberOfLines={2}>{n.label}</Text>
          </View>
        ))}
      </View>
      <Text style={s.h2}>Weak spots</Text>
      {nodes.filter((n) => n.mastery <= 0.5).map((n) => (
        <View key={n.id} style={s.weak}><Text style={s.weakText}>{n.label} · {Math.round(n.mastery * 100)}%</Text></View>
      ))}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  pad: { padding: 20, gap: 12 },
  muted: { color: theme.muted, fontSize: 13 },
  canvas: { height: 360, backgroundColor: theme.surface, borderRadius: theme.radius, borderWidth: 1, borderColor: theme.border, position: "relative" },
  node: { position: "absolute", backgroundColor: theme.surfaceAlt, borderWidth: 2, alignItems: "center", justifyContent: "center", padding: 4 },
  nodeLabel: { color: theme.text, fontSize: 10, textAlign: "center" },
  h2: { color: theme.text, fontSize: 17, fontWeight: "600", marginTop: 8 },
  weak: { backgroundColor: theme.surface, borderRadius: theme.radius, padding: 12, borderWidth: 1, borderColor: theme.border },
  weakText: { color: theme.text, fontSize: 14 },
});

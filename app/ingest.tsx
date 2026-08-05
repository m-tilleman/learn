import { useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, ScrollView } from "react-native";
import { theme } from "@/theme";
import { ingesting } from "@/mock/data";

const STAGES = ["Parsing", "Segmenting", "Ranking salience", "Generating cards", "Building graph", "Ready"];

export default function Ingest() {
  const [url, setUrl] = useState("");
  return (
    <ScrollView style={{ backgroundColor: theme.bg }} contentContainerStyle={s.pad}>
      <Text style={s.h2}>Add a source</Text>
      <TextInput
        value={url}
        onChangeText={setUrl}
        placeholder="Paste a URL, or drop a PDF / ePub…"
        placeholderTextColor={theme.muted}
        style={s.input}
      />
      <View style={s.chips}>
        {["URL", "PDF", "ePub", "Paste text"].map((c) => (
          <View key={c} style={s.chip}><Text style={s.chipText}>{c}</Text></View>
        ))}
      </View>
      <Pressable style={s.primaryBtn}><Text style={s.primaryBtnText}>Ingest →</Text></Pressable>

      <Text style={[s.h2, { marginTop: 18 }]}>Library</Text>
      {ingesting.map((d) => (
        <View key={d.id} style={s.card}>
          <Text style={s.cardTitle}>{d.title}</Text>
          {d.status === "ready" ? (
            <Text style={s.ready}>Ready · {d.cardCount} cards · tap to review & activate layers</Text>
          ) : (
            <>
              <Text style={s.muted}>{d.stage ?? "Queued"} · {Math.round((d.progress ?? 0) * 100)}%</Text>
              <View style={s.track}><View style={[s.fill, { width: `${(d.progress ?? 0.05) * 100}%` }]} /></View>
              <Text style={s.stageline}>{STAGES.join("  ›  ")}</Text>
            </>
          )}
        </View>
      ))}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  pad: { padding: 20, gap: 12 },
  h2: { color: theme.text, fontSize: 18, fontWeight: "700" },
  input: { backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border, borderRadius: theme.radius, padding: 14, color: theme.text, fontSize: 15 },
  chips: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  chip: { backgroundColor: theme.surfaceAlt, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 7 },
  chipText: { color: theme.text, fontSize: 13 },
  primaryBtn: { backgroundColor: theme.primary, borderRadius: theme.radius, padding: 16, alignItems: "center" },
  primaryBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  card: { backgroundColor: theme.surface, borderRadius: theme.radius, padding: 14, borderWidth: 1, borderColor: theme.border, gap: 6 },
  cardTitle: { color: theme.text, fontSize: 15, fontWeight: "600" },
  muted: { color: theme.muted, fontSize: 13 },
  ready: { color: theme.good, fontSize: 13 },
  track: { height: 6, backgroundColor: theme.surfaceAlt, borderRadius: 3, overflow: "hidden" },
  fill: { height: 6, backgroundColor: theme.primary },
  stageline: { color: theme.muted, fontSize: 10 },
});

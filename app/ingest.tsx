import { useRef, useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { useColors, FONT } from "@/theme";
import { TabBar, Label, EmptyState, Glyph } from "@/ui";
import { tapLight } from "@/lib/haptics";

interface Item { id: number; t: string; s: string; ready: boolean; p: number; }
let nextId = 100;

const START: Item[] = [
  { id: 1, t: "Make It Stick · Ch. 2", s: "GENERATING CARDS · 62%", ready: false, p: 62 },
  { id: 2, t: "FSRS benchmark · arXiv", s: "27 CARDS READY — PREVIEW & ACTIVATE", ready: true, p: 100 },
  { id: 3, t: "blog · memory models", s: "QUEUED", ready: false, p: 6 },
];

function detect(v: string) {
  const s = v.toLowerCase();
  if (/\.pdf($|\?)/.test(s)) return "PDF";
  if (/\.epub($|\?)/.test(s)) return "EPUB";
  if (/^https?:|\./.test(s)) return "URL";
  return "TEXT";
}

export default function Ingest() {
  const c = useColors();
  const router = useRouter();
  const [url, setUrl] = useState("https://skillshop.docebosaas.com/…/ai-ads");
  const [lib, setLib] = useState<Item[]>(START);
  const timers = useRef<Record<number, any>>({});

  const remove = (id: number) => {
    if (timers.current[id]) { clearInterval(timers.current[id]); delete timers.current[id]; }
    setLib((l) => l.filter((x) => x.id !== id));
  };

  const add = () => {
    const u = url.trim();
    if (!u) return;
    tapLight();
    const id = nextId++;
    const name = u.replace(/^https?:\/\//, "").split("/")[0];
    setLib((l) => [{ id, t: name, s: "PARSING · 2%", ready: false, p: 2 }, ...l]);
    setUrl("");
    const stages = ["PARSING", "SEGMENTING", "RANKING SALIENCE", "GENERATING CARDS", "BUILDING GRAPH"];
    timers.current[id] = setInterval(() => {
      setLib((l) => l.map((x) => {
        if (x.id !== id) return x;
        const p = Math.min(100, x.p + 11);
        const si = Math.min(stages.length - 1, Math.floor(p / 20));
        if (p >= 100) { clearInterval(timers.current[id]); delete timers.current[id]; return { ...x, p, ready: true, s: "27 CARDS READY — PREVIEW & ACTIVATE" }; }
        return { ...x, p, s: `${stages[si]} · ${p}%` };
      }));
    }, 400);
  };

  return (
    <View style={[st.screen, { backgroundColor: c.bg }]}>
      <Text style={[st.title, { color: c.text }]}>Add material</Text>
      <Text style={[st.subtitle, { color: c.muted }]}>Paste a link or drop a file.</Text>

      <View style={st.inputwrap}>
        <TextInput
          value={url}
          onChangeText={setUrl}
          accessibilityLabel="Source URL or text to ingest"
          placeholder="https://…"
          placeholderTextColor={c.muted}
          style={[st.inp, { backgroundColor: c.card, borderColor: c.border, color: c.text }]}
        />
        <View style={[st.autotag, { backgroundColor: "rgba(226,141,52,0.2)" }]}>
          <Text style={{ color: c.tangerineSoft, fontFamily: FONT.mono, fontSize: 10, letterSpacing: 1 }}>{detect(url)}</Text>
        </View>
      </View>

      <Pressable accessibilityRole="button" accessibilityLabel="Add to library" onPress={add} style={[st.primary, { backgroundColor: c.tangerine }]}>
        <Text style={{ color: c.onAccent, fontFamily: FONT.display, fontWeight: "600", fontSize: 14 }}>Add to library  →</Text>
      </Pressable>

      <Label style={{ marginTop: 18, marginBottom: 10 }}>LIBRARY</Label>
      {lib.length === 0 ? (
        <View style={{ flex: 1 }}>
          <EmptyState glyph="⌸" title="Nothing here yet" body="Add a link, PDF, or ePub above and it'll turn into review cards." />
        </View>
      ) : (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ gap: 12, paddingBottom: 8 }}>
          {lib.map((it) => (
            <Pressable key={it.id} accessibilityRole="button" accessibilityLabel={`Open card set: ${it.t}`}
              onPress={() => { tapLight(); router.push(`/study?deck=${encodeURIComponent(it.t)}` as any); }}
              style={[st.libitem, { backgroundColor: c.card, borderColor: c.border }]}>
              <View style={st.libhead}>
                <Text style={{ fontFamily: FONT.display, fontSize: 13, fontWeight: "600", color: c.text, flex: 1 }}>{it.t}</Text>
                <Pressable accessibilityRole="button" accessibilityLabel={`Remove ${it.t}`} hitSlop={8} onPress={() => remove(it.id)}>
                  <Glyph g="✕" size={15} color={c.muted} />
                </Pressable>
              </View>
              <Text style={{ fontFamily: FONT.mono, fontSize: 10.5, marginTop: 5, color: it.ready ? c.turquoiseLt : c.muted }}>{it.s}</Text>
              {!it.ready && (
                <View style={[st.track, { backgroundColor: c.border }]}>
                  <View style={{ height: "100%", width: `${it.p}%`, backgroundColor: c.tangerine }} />
                </View>
              )}
            </Pressable>
          ))}
        </ScrollView>
      )}

      <TabBar />
    </View>
  );
}

const st = StyleSheet.create({
  screen: { flex: 1, paddingHorizontal: 20, paddingTop: 14, paddingBottom: 8 },
  statusbar: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  title: { fontFamily: FONT.display, fontSize: 23, fontWeight: "600", letterSpacing: -0.4 },
  subtitle: { fontFamily: FONT.mono, fontSize: 10.5, letterSpacing: 1, marginTop: 6, lineHeight: 17 },
  inputwrap: { position: "relative", marginTop: 16 },
  inp: { borderWidth: 1, borderRadius: 14, paddingVertical: 14, paddingLeft: 14, paddingRight: 56, fontSize: 13, fontFamily: FONT.display },
  autotag: { position: "absolute", right: 10, top: 11, borderRadius: 8, paddingVertical: 4, paddingHorizontal: 8 },
  primary: { marginTop: 12, borderRadius: 12, paddingVertical: 12, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 },
  libitem: { borderWidth: 1, borderRadius: 14, padding: 13 },
  libhead: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  track: { height: 5, borderRadius: 3, marginTop: 9, overflow: "hidden" },
});

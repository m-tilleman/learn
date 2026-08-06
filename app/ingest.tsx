import { useEffect, useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, ScrollView, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { useColors, FONT } from "@/theme";
import { TabBar, Label, EmptyState, Glyph } from "@/ui";
import { tapLight } from "@/lib/haptics";
import { useAuth, useIsConnected } from "@/auth";
import { ingestText, getDocuments, DocRow } from "@/data/repo";

const ago = (iso: string) => {
  const s = Math.max(1, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 3600) return `${Math.round(s / 60)}m ago`;
  if (s < 86400) return `${Math.round(s / 3600)}h ago`;
  return `${Math.round(s / 86400)}d ago`;
};

type Phase = "idle" | "working" | "done" | "error";

export default function Ingest() {
  const c = useColors();
  const router = useRouter();
  const connected = useIsConnected();
  const userId = useAuth((s) => s.userId);

  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [msg, setMsg] = useState("");
  const [docs, setDocs] = useState<DocRow[]>([]);

  const refresh = () => { if (connected && userId) getDocuments(userId).then(setDocs).catch(() => {}); };
  useEffect(refresh, [connected, userId]);

  const canSubmit = connected && text.trim().length >= 40 && phase !== "working";

  const submit = async () => {
    if (!canSubmit) return;
    tapLight();
    setPhase("working"); setMsg("Reading your text and writing cards…");
    try {
      const { count } = await ingestText(title.trim() || "Untitled source", text.trim());
      setPhase("done");
      setMsg(`${count} card${count === 1 ? "" : "s"} added.`);
      setTitle(""); setText("");
      refresh();
    } catch (e: any) {
      setPhase("error");
      setMsg(e?.message ? String(e.message) : "Something went wrong generating cards.");
    }
  };

  return (
    <View style={[st.screen, { backgroundColor: c.bg }]}>
      <Text style={[st.title, { color: c.text }]}>Add material</Text>
      <Text style={[st.subtitle, { color: c.muted }]}>Paste an article, notes, or a chapter. Recall turns it into review cards.</Text>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 8 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <TextInput
          value={title}
          onChangeText={setTitle}
          accessibilityLabel="Title for this material"
          placeholder="Title (optional) — e.g. Make It Stick, Ch. 2"
          placeholderTextColor={c.muted}
          style={[st.inp, { backgroundColor: c.card, borderColor: c.border, color: c.text, marginTop: 16 }]}
        />
        <TextInput
          value={text}
          onChangeText={setText}
          accessibilityLabel="Text to turn into cards"
          placeholder="Paste your text here…"
          placeholderTextColor={c.muted}
          multiline
          textAlignVertical="top"
          style={[st.area, { backgroundColor: c.card, borderColor: c.border, color: c.text }]}
        />
        <Text style={[st.count, { color: c.muted }]}>{text.trim().length.toLocaleString()} chars{text.trim().length > 0 && text.trim().length < 40 ? " · paste a bit more" : ""}</Text>

        <Pressable accessibilityRole="button" accessibilityLabel="Generate cards" disabled={!canSubmit}
          onPress={submit}
          style={[st.primary, { backgroundColor: canSubmit ? c.tangerine : c.border }]}>
          {phase === "working"
            ? <ActivityIndicator color={c.onAccent} />
            : <Text style={{ color: canSubmit ? c.onAccent : c.muted, fontFamily: FONT.display, fontWeight: "600", fontSize: 14 }}>Generate cards  →</Text>}
        </Pressable>

        {!connected && (
          <Text style={[st.note, { color: c.muted }]}>Sign in to add your own material.</Text>
        )}

        {phase !== "idle" && msg !== "" && (
          <View style={[st.flash, {
            backgroundColor: phase === "error" ? "rgba(226,74,52,0.12)" : "rgba(95,154,166,0.14)",
            borderColor: phase === "error" ? "rgba(226,74,52,0.4)" : "rgba(95,154,166,0.35)",
          }]}>
            <Text style={{ color: phase === "error" ? c.cherry : c.turquoiseLt, fontFamily: FONT.mono, fontSize: 11, lineHeight: 16 }}>{msg}</Text>
            {phase === "done" && (
              <Pressable accessibilityRole="button" accessibilityLabel="Study now" onPress={() => { tapLight(); router.push("/study" as any); }} style={{ marginTop: 8 }}>
                <Text style={{ color: c.tangerineSoft, fontFamily: FONT.mono, fontSize: 11, letterSpacing: 1 }}>STUDY NOW  →</Text>
              </Pressable>
            )}
          </View>
        )}

        <Label style={{ marginTop: 20, marginBottom: 10 }}>LIBRARY</Label>
        {docs.length === 0 ? (
          <EmptyState glyph="⌸" title="Nothing here yet" body="Paste some text above and it'll become review cards you can study." />
        ) : (
          <View style={{ gap: 12 }}>
            {docs.map((d) => (
              <Pressable key={d.id} accessibilityRole="button" accessibilityLabel={`Study ${d.title}`}
                onPress={() => { tapLight(); router.push("/study" as any); }}
                style={[st.libitem, { backgroundColor: c.card, borderColor: c.border }]}>
                <View style={st.libhead}>
                  <Text style={{ fontFamily: FONT.display, fontSize: 13, fontWeight: "600", color: c.text, flex: 1 }}>{d.title}</Text>
                  <Glyph g="›" size={16} color={c.muted} />
                </View>
                <Text style={{ fontFamily: FONT.mono, fontSize: 10.5, marginTop: 5, color: c.turquoiseLt }}>
                  {d.cardCount} CARD{d.cardCount === 1 ? "" : "S"} · {ago(d.created_at).toUpperCase()}
                </Text>
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>

      <TabBar />
    </View>
  );
}

const st = StyleSheet.create({
  screen: { flex: 1, paddingHorizontal: 20, paddingTop: 14, paddingBottom: 8 },
  title: { fontFamily: FONT.display, fontSize: 23, fontWeight: "600", letterSpacing: -0.4 },
  subtitle: { fontFamily: FONT.display, fontSize: 13, marginTop: 6, lineHeight: 18 },
  inp: { borderWidth: 1, borderRadius: 14, paddingVertical: 13, paddingHorizontal: 14, fontSize: 13, fontFamily: FONT.display },
  area: { borderWidth: 1, borderRadius: 14, padding: 14, fontSize: 13, fontFamily: FONT.display, minHeight: 180, marginTop: 12 },
  count: { fontFamily: FONT.mono, fontSize: 10, marginTop: 6, textAlign: "right" },
  primary: { marginTop: 12, borderRadius: 12, paddingVertical: 13, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, minHeight: 46 },
  note: { fontFamily: FONT.mono, fontSize: 10.5, marginTop: 10, textAlign: "center" },
  flash: { marginTop: 12, borderWidth: 1, borderRadius: 10, paddingVertical: 10, paddingHorizontal: 12 },
  libitem: { borderWidth: 1, borderRadius: 14, padding: 13 },
  libhead: { flexDirection: "row", alignItems: "center", gap: 10 },
});

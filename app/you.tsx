import { useState } from "react";
import { View, Text, Pressable, StyleSheet, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useColors, useTheme, FONT } from "@/theme";
import { TabBar, Label } from "@/ui";
import { tapLight } from "@/lib/haptics";

function Toggle({ on, onToggle, label }: { on: boolean; onToggle: () => void; label: string }) {
  const c = useColors();
  return (
    <Pressable accessibilityRole="switch" accessibilityState={{ checked: on }} accessibilityLabel={label}
      onPress={() => { tapLight(); onToggle(); }}
      style={[tg.track, { backgroundColor: on ? c.tangerine : c.border }]}>
      <View style={[tg.knob, { backgroundColor: c.text, alignSelf: on ? "flex-end" : "flex-start" }]} />
    </Pressable>
  );
}

export default function You() {
  const c = useColors();
  const mode = useTheme((s) => s.mode);
  const toggleTheme = useTheme((s) => s.toggle);
  const [reminders, setReminders] = useState(true);

  const Row = ({ icon, label, value, color }: { icon: any; label: string; value?: React.ReactNode; color?: string }) => (
    <View style={[rw.row, { borderBottomColor: c.border }]}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <Ionicons name={icon} size={16} color={color ?? c.muted} />
        <Text style={{ color: color ?? c.text, fontSize: 14, fontFamily: FONT.display }}>{label}</Text>
      </View>
      {value}
    </View>
  );
  const chev = <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }} />;

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

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 10 }}>
        <View style={st.profile}>
          <View style={[st.avatar, { backgroundColor: c.tangerine }]}><Text style={{ fontFamily: FONT.display, fontSize: 24, fontWeight: "600", color: c.onAccent }}>M</Text></View>
          <View>
            <Text style={{ fontFamily: FONT.display, fontSize: 20, fontWeight: "600", color: c.text }}>Mike</Text>
            <Label style={{ marginTop: 3 }}>michaeltilleman@gmail.com</Label>
          </View>
        </View>

        <View style={st.statrow}>
          <View style={[st.stat, { backgroundColor: c.card, borderColor: c.border }]}><Label>STREAK</Label><Text style={[st.statbig, { color: c.text }]}>23</Text><Label style={{ marginTop: 4 }}>LONGEST 41</Label></View>
          <View style={[st.stat, { backgroundColor: c.card, borderColor: c.border }]}><Label>REVIEWED</Label><Text style={[st.statbig, { color: c.text }]}>8,412</Text><Label style={{ marginTop: 4 }}>ALL TIME</Label></View>
        </View>

        <Label style={{ marginTop: 18, marginBottom: 8 }}>APPEARANCE</Label>
        <View style={[st.rows, { backgroundColor: c.card, borderColor: c.border }]}>
          <Row icon="color-palette-outline" label="Vintage white theme"
            value={<Toggle on={mode === "white"} onToggle={toggleTheme} label="Toggle vintage white theme" />} />
        </View>

        <Label style={{ marginTop: 18, marginBottom: 8 }}>STUDY SETTINGS</Label>
        <View style={[st.rows, { backgroundColor: c.card, borderColor: c.border }]}>
          <Row icon="options-outline" label="Scheduler" value={<Text style={rw.rv(c)}>FSRS-6</Text>} />
          <Row icon="disc-outline" label="Target retention" value={<Text style={rw.rv(c)}>90%</Text>} />
          <Row icon="albums-outline" label="Daily new cards" value={<Text style={rw.rv(c)}>20</Text>} />
          <Row icon="notifications-outline" label="Reminders" value={<Toggle on={reminders} onToggle={() => setReminders(!reminders)} label="Toggle reminders" />} />
        </View>

        <Label style={{ marginTop: 18, marginBottom: 8 }}>ACCOUNT</Label>
        <View style={[st.rows, { backgroundColor: c.card, borderColor: c.border }]}>
          <Row icon="download-outline" label="Export data" />
          <Row icon="log-out-outline" label="Sign out" color={c.cherry} />
        </View>
      </ScrollView>

      <TabBar />
    </View>
  );
}

const st = StyleSheet.create({
  screen: { flex: 1, paddingHorizontal: 20, paddingTop: 14, paddingBottom: 8 },
  statusbar: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  profile: { flexDirection: "row", alignItems: "center", gap: 14, marginTop: 6 },
  avatar: { width: 56, height: 56, borderRadius: 28, alignItems: "center", justifyContent: "center" },
  statrow: { flexDirection: "row", gap: 12, marginTop: 16 },
  stat: { flex: 1, borderWidth: 1, borderRadius: 14, padding: 12 },
  statbig: { fontFamily: FONT.display, fontSize: 25, fontWeight: "600", marginTop: 3 },
  rows: { borderWidth: 1, borderRadius: 14, overflow: "hidden" },
});
const rw = {
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 14, borderBottomWidth: 1 } as any,
  rv: (c: any) => ({ fontFamily: FONT.mono, fontSize: 12, color: c.muted }),
};
const tg = StyleSheet.create({
  track: { width: 42, height: 24, borderRadius: 999, padding: 2, justifyContent: "center" },
  knob: { width: 20, height: 20, borderRadius: 10 },
});

import { useState } from "react";
import { View, Text, Pressable, StyleSheet, ScrollView } from "react-native";
import { useColors, useTheme, FONT } from "@/theme";
import { useSettings, Settings } from "@/settings";
import { TabBar, Label, Glyph } from "@/ui";
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

// cycle helper: next value in a list
function next<T>(list: T[], cur: T): T {
  const i = list.findIndex((x) => x === cur);
  return list[(i + 1) % list.length];
}

export default function You() {
  const c = useColors();
  const mode = useTheme((s) => s.mode);
  const toggleTheme = useTheme((s) => s.toggle);
  const s = useSettings();
  const [flash, setFlash] = useState<string | null>(null);

  const set = (patch: Partial<Settings>) => { tapLight(); s.update(patch); };

  const RowToggle = ({ glyph, label, value, onToggle }: { glyph: string; label: string; value: boolean; onToggle: () => void }) => (
    <View style={[rw.row, { borderBottomColor: c.border }]}>
      <View style={rw.left}><Glyph g={glyph} size={16} color={c.muted} /><Text style={rw.label(c)}>{label}</Text></View>
      <Toggle on={value} onToggle={onToggle} label={label} />
    </View>
  );
  const RowChoice = ({ glyph, label, value, onPress, color }: { glyph: string; label: string; value: string; onPress: () => void; color?: string }) => (
    <Pressable accessibilityRole="button" accessibilityLabel={`${label}: ${value}`} onPress={onPress} style={[rw.row, { borderBottomColor: c.border }]}>
      <View style={rw.left}><Glyph g={glyph} size={16} color={color ?? c.muted} /><Text style={rw.label(c, color)}>{label}</Text></View>
      <View style={rw.right}><Text style={rw.val(c)}>{value}</Text><Glyph g="›" size={15} color={c.muted} /></View>
    </Pressable>
  );

  const intervalLabel = (d: number) => (d >= 36500 ? "Unlimited" : d >= 365 ? `${Math.round(d / 365)} yr` : `${Math.round(d / 30)} mo`);

  return (
    <View style={[st.screen, { backgroundColor: c.bg }]}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 12 }} showsVerticalScrollIndicator={false}>
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

        {flash && (
          <View style={[st.flash, { backgroundColor: "rgba(95,154,166,0.14)", borderColor: "rgba(95,154,166,0.35)" }]}>
            <Text style={{ color: c.turquoiseLt, fontFamily: FONT.mono, fontSize: 11 }}>{flash}</Text>
          </View>
        )}

        {/* SCHEDULING */}
        <Label style={st.section}>SCHEDULING</Label>
        <View style={[st.rows, { backgroundColor: c.card, borderColor: c.border }]}>
          <RowChoice glyph="⚙" label="Scheduler" value="FSRS-6" onPress={() => {}} />
          <RowChoice glyph="◎" label="Target retention" value={`${s.targetRetention}%`} onPress={() => set({ targetRetention: next([80, 85, 90, 95], s.targetRetention) })} />
          <RowChoice glyph="＋" label="Daily new cards" value={String(s.dailyNew)} onPress={() => set({ dailyNew: next([10, 20, 30, 50], s.dailyNew) })} />
          <RowChoice glyph="▤" label="Daily review limit" value={s.dailyReview == null ? "Unlimited" : String(s.dailyReview)} onPress={() => set({ dailyReview: next<number | null>([100, 200, 500, null], s.dailyReview) })} />
          <RowChoice glyph="∞" label="Maximum interval" value={intervalLabel(s.maxIntervalDays)} onPress={() => set({ maxIntervalDays: next([90, 365, 730, 36500], s.maxIntervalDays) })} />
          <RowChoice glyph="↕" label="New card order" value={s.newOrder} onPress={() => set({ newOrder: next<Settings["newOrder"]>(["Added", "Random"], s.newOrder) })} />
          <RowChoice glyph="✦" label="Optimize FSRS from history" value="" color={c.turquoiseLt}
            onPress={() => { tapLight(); setFlash("Re-optimizing weights from your review log…"); setTimeout(() => setFlash(null), 2600); }} />
        </View>

        {/* SESSION & STUDY */}
        <Label style={st.section}>SESSION & STUDY</Label>
        <View style={[st.rows, { backgroundColor: c.card, borderColor: c.border }]}>
          <RowChoice glyph="◷" label="Session length" value={`${s.sessionMinutes} min`} onPress={() => set({ sessionMinutes: next([5, 7, 10, 15], s.sessionMinutes) })} />
          <RowToggle glyph="✎" label="Guess before reveal" value={s.guessFirst} onToggle={() => set({ guessFirst: !s.guessFirst })} />
          <RowToggle glyph="◔" label="Confidence ratings" value={s.confidence} onToggle={() => set({ confidence: !s.confidence })} />
          <RowToggle glyph="▹" label="Show interval previews" value={s.intervalPreviews} onToggle={() => set({ intervalPreviews: !s.intervalPreviews })} />
          <RowToggle glyph="⇄" label="Interleave decks" value={s.interleave} onToggle={() => set({ interleave: !s.interleave })} />
        </View>

        {/* NOTIFICATIONS */}
        <Label style={st.section}>NOTIFICATIONS</Label>
        <View style={[st.rows, { backgroundColor: c.card, borderColor: c.border }]}>
          <RowChoice glyph="◔" label="Reminder time" value={s.reminderTime} onPress={() => set({ reminderTime: next(["7:00 AM", "8:00 AM", "12:00 PM", "8:00 PM"], s.reminderTime) })} />
          <RowToggle glyph="☾" label="Quiet hours" value={s.quietHours} onToggle={() => set({ quietHours: !s.quietHours })} />
          <RowToggle glyph="◴" label="Optimal-window reminders" value={s.optimalWindow} onToggle={() => set({ optimalWindow: !s.optimalWindow })} />
          <RowToggle glyph="▲" label="Streak reminders" value={s.streakReminders} onToggle={() => set({ streakReminders: !s.streakReminders })} />
        </View>

        {/* FEEL & ACCESSIBILITY */}
        <Label style={st.section}>FEEL & ACCESSIBILITY</Label>
        <View style={[st.rows, { backgroundColor: c.card, borderColor: c.border }]}>
          <RowToggle glyph="◑" label="Vintage white theme" value={mode === "white"} onToggle={() => { tapLight(); toggleTheme(); }} />
          <RowToggle glyph="≈" label="Haptics" value={s.haptics} onToggle={() => set({ haptics: !s.haptics })} />
          <RowToggle glyph="⇢" label="Reduce motion" value={s.reduceMotion} onToggle={() => set({ reduceMotion: !s.reduceMotion })} />
          <RowChoice glyph="A" label="Text size" value={s.textSize} onPress={() => set({ textSize: next<Settings["textSize"]>(["Small", "Medium", "Large"], s.textSize) })} />
        </View>

        {/* ACCOUNT */}
        <Label style={st.section}>ACCOUNT</Label>
        <View style={[st.rows, { backgroundColor: c.card, borderColor: c.border }]}>
          <RowChoice glyph="↧" label="Export data" value="" onPress={() => {}} />
          <View style={[rw.row, { borderBottomColor: c.border, borderBottomWidth: 0 }]}>
            <View style={rw.left}><Glyph g="⏻" size={16} color={c.cherry} /><Text style={rw.label(c, c.cherry)}>Sign out</Text></View>
          </View>
        </View>

        <View style={{ height: 6 }} />
      </ScrollView>

      <TabBar />
    </View>
  );
}

const st = StyleSheet.create({
  screen: { flex: 1, paddingHorizontal: 20, paddingTop: 18, paddingBottom: 8 },
  profile: { flexDirection: "row", alignItems: "center", gap: 14, marginTop: 6 },
  avatar: { width: 56, height: 56, borderRadius: 28, alignItems: "center", justifyContent: "center" },
  statrow: { flexDirection: "row", gap: 12, marginTop: 16 },
  stat: { flex: 1, borderWidth: 1, borderRadius: 14, padding: 12 },
  statbig: { fontFamily: FONT.display, fontSize: 25, fontWeight: "600", marginTop: 3 },
  section: { marginTop: 18, marginBottom: 8 },
  rows: { borderWidth: 1, borderRadius: 14, overflow: "hidden" },
  flash: { marginTop: 14, borderWidth: 1, borderRadius: 10, paddingVertical: 8, paddingHorizontal: 12 },
});
const rw = {
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 14, borderBottomWidth: 1 } as any,
  left: { flexDirection: "row", alignItems: "center", gap: 10 } as any,
  right: { flexDirection: "row", alignItems: "center", gap: 6 } as any,
  label: (c: any, color?: string) => ({ color: color ?? c.text, fontSize: 14, fontFamily: FONT.display }),
  val: (c: any) => ({ fontFamily: FONT.mono, fontSize: 12, color: c.muted }),
};
const tg = StyleSheet.create({
  track: { width: 42, height: 24, borderRadius: 999, padding: 2, justifyContent: "center" },
  knob: { width: 20, height: 20, borderRadius: 10 },
});

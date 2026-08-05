import { View, Text, Pressable, StyleSheet, ImageBackground } from "react-native";
import { useRouter } from "expo-router";
import { theme, HERO_IMAGE, HERO_CREDIT } from "@/theme";
import { analytics } from "@/mock/data";

// The dashboard puts the Unsplash "water drop on green plant" photo behind
// frosted-glass cards. A dark scrim keeps text legible over the photo.
export default function Dashboard() {
  const router = useRouter();
  const dueMin = Math.max(1, Math.round((analytics.dueToday * 14) / 60));

  return (
    <ImageBackground source={{ uri: HERO_IMAGE }} style={s.hero} imageStyle={s.heroImg}>
      <View style={s.scrim} />
      <View style={s.content}>
        {/* Top bar */}
        <View style={s.topbar}>
          <View style={s.avatar} />
          <View style={[s.glass, s.badge]}>
            <View style={s.badgeDot}><Text style={s.badgeIcon}>◧</Text></View>
            <View>
              <Text style={s.badgeTitle}>RECALL</Text>
              <Text style={s.badgeSub}>LEARNING</Text>
            </View>
          </View>
          <View style={[s.glass, s.iconBtn]}><Text style={s.iconGlyph}>⊞</Text></View>
        </View>

        {/* Headline */}
        <View style={s.headlineRow}>
          <Text style={s.headline}>Keep it{"\n"}stuck</Text>
          <View style={[s.glass, s.iconBtn]}><Text style={s.iconGlyph}>◔</Text></View>
        </View>

        <View style={{ flex: 1 }} />

        {/* Retention score */}
        <View style={[s.glass, s.scoreCard]}>
          <Text style={s.scoreNum}>{Math.round(analytics.retention * 100)}</Text>
          <Text style={s.scoreLabel}>Your retention{"\n"}score</Text>
          <View style={s.scoreCircle}><Text style={s.iconGlyph}>↗</Text></View>
        </View>

        {/* Stat tiles */}
        <View style={s.tiles}>
          <Pressable style={[s.tile, { backgroundColor: "rgba(52,122,60,0.85)" }]} onPress={() => router.push("/study")}>
            <Text style={s.tileLabel}>Study{"\n"}now</Text>
            <Text style={s.tileNum}>{analytics.dueToday}</Text>
            <Text style={s.tileFoot}>cards due · ~{dueMin} min</Text>
          </Pressable>
          <View style={[s.tile, { backgroundColor: "rgba(12,30,18,0.55)" }]}>
            <Text style={s.tileLabel}>Day{"\n"}streak</Text>
            <Text style={s.tileNum}>{analytics.streak}</Text>
            <Text style={s.tileFoot}>on track</Text>
          </View>
        </View>

        {/* Floating pill nav */}
        <View style={[s.glass, s.navbar]}>
          <NavItem label="Study" active onPress={() => router.push("/study")} />
          <NavItem label="Add" onPress={() => router.push("/ingest")} />
          <View style={s.fab}><Text style={{ color: "#14331B", fontSize: 20 }}>⁘</Text></View>
          <NavItem label="Graph" onPress={() => router.push("/graph")} />
          <NavItem label="You" onPress={() => router.push("/analytics")} />
        </View>

        <Text style={s.credit}>{HERO_CREDIT}</Text>
      </View>
    </ImageBackground>
  );
}

function NavItem({ label, active, onPress }: { label: string; active?: boolean; onPress?: () => void }) {
  return (
    <Pressable style={s.navItem} onPress={onPress}>
      <Text style={[s.navLabel, active && { color: theme.primary }]}>{label}</Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  hero: { flex: 1, backgroundColor: theme.bg },
  heroImg: { resizeMode: "cover" },
  scrim: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(5,12,6,0.35)" },
  content: { flex: 1, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },

  glass: {
    backgroundColor: theme.glass,
    borderWidth: 1,
    borderColor: theme.glassBorder,
    // On web this maps to backdrop-filter; on native use @react-native-community/blur (BlurView).
  },
  topbar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  avatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: theme.primaryDim, borderWidth: 2, borderColor: "rgba(255,255,255,0.55)" },
  badge: { flexDirection: "row", alignItems: "center", gap: 7, paddingVertical: 7, paddingLeft: 9, paddingRight: 14, borderRadius: 999 },
  badgeDot: { width: 24, height: 24, borderRadius: 12, backgroundColor: "#EAFBEF", alignItems: "center", justifyContent: "center" },
  badgeIcon: { color: "#1B4D26", fontSize: 12 },
  badgeTitle: { color: theme.text, fontSize: 13, fontWeight: "600" },
  badgeSub: { color: "#C8E6CC", fontSize: 9, letterSpacing: 2 },
  iconBtn: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center" },
  iconGlyph: { color: theme.text, fontSize: 16 },

  headlineRow: { marginTop: 22, flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  headline: { color: theme.text, fontSize: 40, fontWeight: "700", lineHeight: 42, letterSpacing: -1 },

  scoreCard: { flexDirection: "row", alignItems: "center", gap: 14, padding: 16, borderRadius: 22, marginBottom: 12 },
  scoreNum: { color: theme.text, fontSize: 38, fontWeight: "700" },
  scoreLabel: { flex: 1, color: theme.text, fontSize: 15, fontWeight: "600" },
  scoreCircle: { width: 42, height: 42, borderRadius: 21, backgroundColor: "rgba(255,255,255,0.16)", alignItems: "center", justifyContent: "center" },

  tiles: { flexDirection: "row", gap: 12, marginBottom: 16 },
  tile: { flex: 1, borderRadius: 22, padding: 15, borderWidth: 1, borderColor: "rgba(255,255,255,0.14)" },
  tileLabel: { color: theme.text, fontSize: 14, fontWeight: "600" },
  tileNum: { color: theme.text, fontSize: 34, fontWeight: "700", marginTop: 18 },
  tileFoot: { color: "#D3ECD6", fontSize: 12, marginTop: 2 },

  navbar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderRadius: 26, paddingVertical: 10, paddingHorizontal: 18, marginBottom: 8 },
  navItem: { alignItems: "center" },
  navLabel: { color: theme.muted, fontSize: 11, fontWeight: "600" },
  fab: { width: 52, height: 52, borderRadius: 26, backgroundColor: "#fff", alignItems: "center", justifyContent: "center", marginTop: -26 },

  credit: { color: "rgba(255,255,255,0.5)", fontSize: 10, textAlign: "center" },
});

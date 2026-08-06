// Shared UI: bottom tab bar, empty/loading/error states, keyboard hook, primitives.
// Icons are unicode glyphs (no native icon module needed on web).
import { useEffect } from "react";
import { View, Text, Pressable, ActivityIndicator, Platform, StyleSheet } from "react-native";
import { useRouter, usePathname } from "expo-router";
import { useColors, FONT } from "@/theme";

export function Glyph({ g, size = 18, color }: { g: string; size?: number; color?: string }) {
  return <Text allowFontScaling={false} style={{ fontSize: size, color, lineHeight: size + 2 }}>{g}</Text>;
}

export function Label({ children, style }: { children: React.ReactNode; style?: any }) {
  const c = useColors();
  return (
    <Text allowFontScaling style={[{ fontFamily: FONT.mono, fontSize: 10, letterSpacing: 1.5, color: c.muted }, style]}>
      {children}
    </Text>
  );
}

const TABS = [
  { key: "home", label: "Home", g: "⌂", href: "/" },
  { key: "ingest", label: "Add", g: "＋", href: "/ingest" },
  { key: "study", label: "Study", g: "▶", href: "/study" },
  { key: "stats", label: "Stats", g: "▤", href: "/stats" },
  { key: "you", label: "You", g: "◍", href: "/you" },
] as const;

export function TabBar() {
  const c = useColors();
  const router = useRouter();
  const path = usePathname();
  const activeFor = (href: string) => (href === "/" ? path === "/" : path.startsWith(href));
  return (
    <View accessibilityRole="tablist" style={[s.tabbar, { borderTopColor: c.border }]}>
      {TABS.map((t) => {
        const on = activeFor(t.href);
        if (t.key === "study") {
          return (
            <Pressable
              key={t.key}
              accessibilityRole="tab"
              accessibilityState={{ selected: on }}
              accessibilityLabel={t.label}
              onPress={() => router.replace(t.href as any)}
              style={s.tab}
            >
              <View style={[s.fab, { backgroundColor: c.tangerine, shadowColor: c.tangerine }]}>
                <Glyph g="▶" size={22} color={c.onAccent} />
              </View>
              <Text style={{ fontFamily: FONT.mono, fontSize: 9, letterSpacing: 0.5, marginTop: 4, color: c.tangerine }}>
                {t.label}
              </Text>
            </Pressable>
          );
        }
        return (
          <Pressable
            key={t.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            accessibilityLabel={t.label}
            onPress={() => router.replace(t.href as any)}
            style={s.tab}
          >
            <Glyph g={t.g} size={19} color={on ? c.tangerine : c.muted} />
            <Text style={{ fontFamily: FONT.mono, fontSize: 9, letterSpacing: 0.5, marginTop: 3, color: on ? c.tangerine : c.muted }}>
              {t.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function EmptyState({ glyph = "✧", title, body, cta, onCta }: {
  glyph?: string; title: string; body: string; cta?: string; onCta?: () => void;
}) {
  const c = useColors();
  return (
    <View style={s.center} accessibilityRole="summary">
      <Glyph g={glyph} size={34} color={c.muted} />
      <Text style={{ fontFamily: FONT.display, fontSize: 18, fontWeight: "600", color: c.text, marginTop: 12 }}>{title}</Text>
      <Text style={{ fontFamily: FONT.display, fontSize: 14, color: c.muted, textAlign: "center", marginTop: 6, maxWidth: 260 }}>{body}</Text>
      {cta && (
        <Pressable onPress={onCta} accessibilityRole="button" accessibilityLabel={cta} style={[s.cta, { backgroundColor: c.tangerine }]}>
          <Text style={{ color: c.onAccent, fontFamily: FONT.display, fontWeight: "600" }}>{cta}</Text>
        </Pressable>
      )}
    </View>
  );
}

export function LoadingState({ label = "Loading…" }: { label?: string }) {
  const c = useColors();
  return (
    <View style={s.center} accessibilityRole="progressbar" accessibilityLabel={label}>
      <ActivityIndicator color={c.tangerine} />
      <Label style={{ marginTop: 10, textTransform: "uppercase" }}>{label}</Label>
    </View>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  const c = useColors();
  return (
    <View style={s.center} accessibilityRole="alert">
      <Glyph g="⚠" size={30} color={c.cherry} />
      <Text style={{ fontFamily: FONT.display, fontSize: 15, color: c.text, textAlign: "center", marginTop: 10, maxWidth: 260 }}>{message}</Text>
      {onRetry && (
        <Pressable onPress={onRetry} accessibilityRole="button" accessibilityLabel="Retry" style={[s.cta, { backgroundColor: c.card, borderWidth: 1, borderColor: c.border }]}>
          <Text style={{ color: c.text, fontFamily: FONT.display, fontWeight: "600" }}>Retry</Text>
        </Pressable>
      )}
    </View>
  );
}

// Web keyboard shortcuts: space = reveal, 1–4 = grade.
export function useCardShortcuts(handlers: { onReveal?: () => void; onGrade?: (g: 1 | 2 | 3 | 4) => void }) {
  useEffect(() => {
    if (Platform.OS !== "web" || typeof window === "undefined") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Space") { e.preventDefault(); handlers.onReveal?.(); }
      else if (["1", "2", "3", "4"].includes(e.key)) { e.preventDefault(); handlers.onGrade?.(Number(e.key) as 1 | 2 | 3 | 4); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handlers]);
}

const s = StyleSheet.create({
  tabbar: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", borderTopWidth: 1, paddingTop: 11, paddingBottom: 4 },
  tab: { alignItems: "center", flex: 1 },
  fab: {
    width: 56, height: 56, borderRadius: 28, alignItems: "center", justifyContent: "center", marginTop: -26,
    shadowOpacity: 0.55, shadowRadius: 16, shadowOffset: { width: 0, height: 4 }, elevation: 10,
  },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  cta: { marginTop: 16, borderRadius: 12, paddingHorizontal: 18, paddingVertical: 11 },
});

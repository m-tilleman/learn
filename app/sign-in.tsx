import { useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { useColors, FONT } from "@/theme";
import { useAuth } from "@/auth";

export default function SignIn() {
  const c = useColors();
  const router = useRouter();
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!email.trim() || !pw) { setErr("Enter your email and password."); return; }
    setBusy(true); setErr(null);
    const e = mode === "in" ? await signIn(email.trim(), pw) : await signUp(email.trim(), pw);
    setBusy(false);
    if (e) setErr(e);
    else if (mode === "up") setErr("Check your email to confirm, then sign in.");
    else router.replace("/");
  };

  return (
    <View style={[s.screen, { backgroundColor: c.bg }]}>
      <View style={{ flex: 1, justifyContent: "center" }}>
        <Text style={[s.wordmark, { color: c.text }]}>RECALL</Text>
        <Text style={[s.title, { color: c.text }]}>{mode === "in" ? "Welcome back" : "Create your account"}</Text>
        <Text style={[s.sub, { color: c.muted }]}>Your cards, reviews and streak sync across every device.</Text>

        <TextInput value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address"
          accessibilityLabel="Email" placeholder="name@email.com" placeholderTextColor={c.muted}
          style={[s.inp, { backgroundColor: c.card, borderColor: c.border, color: c.text }]} />
        <TextInput value={pw} onChangeText={setPw} secureTextEntry
          accessibilityLabel="Password" placeholder="Password" placeholderTextColor={c.muted}
          style={[s.inp, { backgroundColor: c.card, borderColor: c.border, color: c.text, marginTop: 12 }]} />

        {err && <Text style={{ color: c.cherry, fontFamily: FONT.mono, fontSize: 12, marginTop: 12 }}>{err}</Text>}

        <Pressable accessibilityRole="button" accessibilityLabel={mode === "in" ? "Sign in" : "Create account"}
          onPress={submit} disabled={busy} style={[s.primary, { backgroundColor: c.tangerine, opacity: busy ? 0.7 : 1 }]}>
          {busy ? <ActivityIndicator color={c.onAccent} /> :
            <Text style={{ color: c.onAccent, fontFamily: FONT.display, fontWeight: "600", fontSize: 15 }}>{mode === "in" ? "Sign in" : "Create account"}</Text>}
        </Pressable>

        <Pressable accessibilityRole="button" onPress={() => { setMode(mode === "in" ? "up" : "in"); setErr(null); }} style={{ marginTop: 18, alignItems: "center" }}>
          <Text style={{ color: c.turquoiseLt, fontFamily: FONT.mono, fontSize: 12, letterSpacing: 1 }}>
            {mode === "in" ? "NEW HERE? CREATE AN ACCOUNT" : "HAVE AN ACCOUNT? SIGN IN"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, paddingHorizontal: 24, paddingTop: 20, paddingBottom: 24 },
  wordmark: { fontFamily: FONT.mono, fontSize: 15, letterSpacing: 4, fontWeight: "700", textAlign: "center", marginBottom: 28 },
  title: { fontFamily: FONT.display, fontSize: 26, fontWeight: "600", letterSpacing: -0.5, textAlign: "center" },
  sub: { fontFamily: FONT.display, fontSize: 14, textAlign: "center", marginTop: 8, marginBottom: 28, lineHeight: 20 },
  inp: { borderWidth: 1, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 14, fontSize: 15, fontFamily: FONT.display },
  primary: { marginTop: 20, borderRadius: 14, paddingVertical: 15, alignItems: "center" },
});

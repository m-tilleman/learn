import { useEffect } from "react";
import { Stack, useRouter, usePathname } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useColors, useTheme } from "@/theme";
import { useAuth } from "@/auth";
import { isSupabaseConfigured } from "@/lib/supabase";

export default function RootLayout() {
  const c = useColors();
  const mode = useTheme((s) => s.mode);
  const { initialized, userId, init } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => { init(); }, []);

  // Auth gate — active only in live mode. Demo mode (no backend) is untouched.
  useEffect(() => {
    if (!isSupabaseConfigured || !initialized) return;
    const onSignIn = pathname === "/sign-in";
    if (!userId && !onSignIn) router.replace("/sign-in");
    else if (userId && onSignIn) router.replace("/");
  }, [initialized, userId, pathname]);

  return (
    <>
      <StatusBar style={mode === "vinyl" ? "light" : "dark"} />
      <Stack
        screenOptions={{
          headerShown: false,
          animation: "fade",
          animationDuration: 220,
          contentStyle: { backgroundColor: c.bg },
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="study" options={{ animation: "slide_from_bottom" }} />
        <Stack.Screen name="ingest" />
        <Stack.Screen name="stats" />
        <Stack.Screen name="you" />
        <Stack.Screen name="sign-in" />
      </Stack>
    </>
  );
}

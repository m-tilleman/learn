import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useColors, useTheme } from "@/theme";

export default function RootLayout() {
  const c = useColors();
  const mode = useTheme((s) => s.mode);
  return (
    <>
      <StatusBar style={mode === "vinyl" ? "light" : "dark"} />
      <Stack
        screenOptions={{
          headerShown: false,
          animation: "fade",          // premium cross-screen transition
          animationDuration: 220,
          contentStyle: { backgroundColor: c.bg },
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="study" options={{ animation: "slide_from_bottom" }} />
        <Stack.Screen name="ingest" />
        <Stack.Screen name="stats" />
        <Stack.Screen name="you" />
      </Stack>
    </>
  );
}

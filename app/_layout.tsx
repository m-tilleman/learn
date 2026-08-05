import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { theme } from "@/theme";

export default function RootLayout() {
  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: theme.bg },
          headerTintColor: theme.text,
          contentStyle: { backgroundColor: theme.bg },
        }}
      >
        <Stack.Screen name="index" options={{ title: "Recall" }} />
        <Stack.Screen name="study" options={{ title: "Study", presentation: "fullScreenModal" }} />
        <Stack.Screen name="ingest" options={{ title: "Add material" }} />
        <Stack.Screen name="analytics" options={{ title: "Retention" }} />
        <Stack.Screen name="graph" options={{ title: "Knowledge graph" }} />
      </Stack>
    </>
  );
}

import { LinearGradient } from "expo-linear-gradient";
import { Stack } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { registerForPush } from "../lib/push";
import { supabase } from "../lib/supabase";

export default function RootLayout() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      await supabase.auth.getSession();

      // Register device for push notifications
      const token = await registerForPush();
      if (token) {
        await supabase.from("push_tokens").upsert({ token });
      }

      setLoading(false);
    })();
  }, []);

  if (loading) {
    return (
      <LinearGradient colors={["#fff", "#82af43"]} style={{ flex: 1 }}>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator />
        </View>
      </LinearGradient>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <LinearGradient colors={["#fff", "#82af43"]} style={{ flex: 1 }}>
        <Stack
          initialRouteName="(tabs)"
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: "transparent" },
            animation: "none",
            gestureEnabled: true,
            fullScreenGestureEnabled: true,
          }}
        />
      </LinearGradient>
    </GestureHandlerRootView>
  );
}
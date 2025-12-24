import { LinearGradient } from "expo-linear-gradient";
import { Redirect, Stack, useSegments } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { supabase } from "../lib/supabase";

export default function RootLayout() {
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const segments = useSegments();

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsLoggedIn(!!session);
      setLoading(false);

      const { data: sub } = supabase.auth.onAuthStateChange((_e, s) =>
        setIsLoggedIn(!!s)
      );
      return () => sub.subscription.unsubscribe();
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

  const atAuth =
    segments.length > 0 && (segments[0] === "login" || segments[0] === "signup");

  if (!isLoggedIn && !atAuth) return <Redirect href="/login" />;
  if (isLoggedIn && atAuth) return <Redirect href="/" />;

  return (
    <LinearGradient colors={["#fff", "#82af43"]} style={{ flex: 1 }}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: "transparent" },
          animation: "none"
        }}
      />
    </LinearGradient>
  );
}

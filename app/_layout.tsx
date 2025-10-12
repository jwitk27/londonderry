import { Redirect, Stack, useSegments } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { supabase } from "../lib/supabase";

export default function RootLayout() {
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false); // start false
  const segments = useSegments();                       // current route parts

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsLoggedIn(!!session);
      setLoading(false);
      supabase.auth.onAuthStateChange((_e, s) => setIsLoggedIn(!!s));
    })();
  }, []);

  if (loading) {
    return (
      <View style={{ flex:1, justifyContent:"center", alignItems:"center" }}>
        <ActivityIndicator />
      </View>
    );
  }

  // Are we already in auth screens?
  const atAuth =
    segments.length > 0 && (segments[0] === "login" || segments[0] === "signup");

  // Only redirect when needed (prevents bouncing)
  if (!isLoggedIn && !atAuth) return <Redirect href="/login" />;
  if (isLoggedIn && atAuth) return <Redirect href="/" />;

  return <Stack screenOptions={{ headerShown: false }} />;
}

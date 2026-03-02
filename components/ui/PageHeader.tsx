import { supabase } from "@/lib/supabase";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import { Platform, Pressable, Text, View } from "react-native";

export default function PageHeader({
  title,
  sub,
}: {
  title: string;
  sub?: string;
}) {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getSession();
      setUser(data.session?.user ?? null);
    };
    init();

    const { data: listener } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    router.replace("/");
  };

  const iosOffset = Platform.OS === "ios" ? 20 : 0;

  // Never show stale "logged in as ..." passed from screens
  const safeSub =
    sub && sub.toLowerCase().includes("logged in as") ? undefined : sub;

  return (
    <View style={{ marginBottom: 12, position: "relative" }}>
      <Text
        style={{
          textTransform: "uppercase",
          fontSize: 22,
          fontWeight: "900",
          color: "#878787ff",
          borderBottomWidth: 1,
          borderBottomColor: "#878787ff",
          paddingTop: 20 + iosOffset,
          paddingRight: 140,
        }}
      >
        {title}
      </Text>

      {user ? (
        <Text style={{ marginTop: 4, color: "#6b7280", fontWeight: "700" }}>
          Logged in as {user.email}
        </Text>
      ) : (
        !!safeSub && (
          <Text style={{ marginTop: 4, color: "#6b7280", fontWeight: "700" }}>
            {safeSub}
          </Text>
        )
      )}

      {user ? (
        <Pressable
          onPress={signOut}
          style={{ position: "absolute", right: 0, top: 22 + iosOffset }}
        >
          <Text style={{ color: "#e11d48", fontWeight: "800" }}>Sign out</Text>
        </Pressable>
      ) : (
        <Pressable
          onPress={() => router.push("/login")}
          style={{ position: "absolute", right: 0, top: 22 + iosOffset }}
        >
          <Text style={{ color: "#2563eb", fontWeight: "800" }}>Log in</Text>
        </Pressable>
      )}
    </View>
  );
}
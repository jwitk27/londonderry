import { supabase } from "@/lib/supabase";
import { router } from "expo-router";
import React from "react";
import { Platform, Pressable, Text, View } from "react-native";

export default function PageHeader({
  title,
  sub,
}: {
  title: string;
  sub?: string;
}) {
  const signOut = async () => {
    await supabase.auth.signOut();
    router.replace("/login");
  };

  const iosOffset = Platform.OS === "ios" ? 20 : 0;

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
          paddingRight: 80,
        }}
      >
        {title}
      </Text>

      {!!sub && (
        <Text style={{ marginTop: 4, color: "#6b7280", fontWeight: "700" }}>
          {sub}
        </Text>
      )}

      <Pressable
        onPress={signOut}
        style={{ position: "absolute", right: 0, top: 22 + iosOffset }}
      >
        <Text style={{ color: "#e11d48", fontWeight: "800" }}>
          Sign out
        </Text>
      </Pressable>
    </View>
  );
}

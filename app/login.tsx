import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, Pressable, Text, TextInput, View } from "react-native";
import { supabase } from "../lib/supabase";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const signIn = async () => {
    if (loading) return;
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      Alert.alert("Error", error.message);
    } else {
      router.replace("/"); // go to home (tabs)
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: "center", padding: 16 }}>
      <TextInput
        placeholder="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
        style={{ borderWidth: 1, marginBottom: 8, padding: 8 }}
      />

      <TextInput
        placeholder="Password"
        secureTextEntry
        autoCapitalize="none"
        value={password}
        onChangeText={setPassword}
        style={{ borderWidth: 1, marginBottom: 12, padding: 8 }}
      />

      <Pressable
        onPress={signIn}
        style={{
          padding: 12,
          backgroundColor: "#2563eb",
          borderRadius: 6,
        }}
      >
        <Text style={{ color: "white", textAlign: "center", fontWeight: "700" }}>
          {loading ? "Logging in..." : "Log In"}
        </Text>
      </Pressable>

      <Pressable onPress={() => router.push("/forgot-password")} style={{ marginTop: 12 }}>
        <Text style={{ color: "#6b7280", textAlign: "center" }}>
          Forgot password?
        </Text>
      </Pressable>

      <Pressable onPress={() => router.push("/signup")} style={{ marginTop: 16 }}>
        <Text style={{ color: "#2563eb", textAlign: "center" }}>
          Don’t have an account? Sign Up
        </Text>
      </Pressable>
    </View>
  );
}
import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, Button, Pressable, Text, TextInput, View } from "react-native";
import { supabase } from "../lib/supabase";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  // password login
  const signIn = async () => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) Alert.alert("Error", error.message);
    // session listener handles redirect
  };

  // magic link login
  const magicLink = async () => {
    if (!email) return Alert.alert("Email required");
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: "londonderry://auth/callback",
      },
    });
    if (error) Alert.alert("Error", error.message);
    else Alert.alert("Check your email", "Magic link sent.");
  };

  return (
    <View style={{ flex: 1, justifyContent: "center", padding: 16, gap: 8 }}>
      <TextInput
        placeholder="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
        style={{
          borderWidth: 1,
          borderColor: "#e5e7eb",
          borderRadius: 8,
          padding: 10,
        }}
      />

      <TextInput
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        style={{
          borderWidth: 1,
          borderColor: "#e5e7eb",
          borderRadius: 8,
          padding: 10,
        }}
      />

      <Button title="Log In" onPress={signIn} />

      <Pressable onPress={magicLink} style={{ marginTop: 6 }}>
        <Text style={{ color: "#2563eb", textAlign: "center" }}>
          Email me a magic login link
        </Text>
      </Pressable>

      <Pressable onPress={() => router.push("/forgot-password")} style={{ marginTop: 6 }}>
        <Text style={{ color: "#6b7280", textAlign: "center" }}>
          Forgot password?
        </Text>
      </Pressable>

      <Pressable onPress={() => router.push("/signup")} style={{ marginTop: 14 }}>
        <Text style={{ color: "#2563eb", textAlign: "center" }}>
          Don’t have an account? Sign Up
        </Text>
      </Pressable>
    </View>
  );
}

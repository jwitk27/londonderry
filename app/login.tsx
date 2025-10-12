import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, Button, Pressable, Text, TextInput, View } from "react-native";
import { supabase } from "../lib/supabase";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  const signIn = async () => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      Alert.alert("Error", error.message);
    }
    // ✅ no redirect here
    // _layout.tsx listener will see session and show "/"
  };

  return (
    <View style={{ flex: 1, justifyContent: "center", padding: 16, gap: 8 }}>
      <TextInput
        placeholder="Email"
        autoCapitalize="none"
        keyboardType="email-address"
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
        onChangeText={setPassword}
        style={{
          borderWidth: 1,
          borderColor: "#e5e7eb",
          borderRadius: 8,
          padding: 10,
        }}
      />
      <Button title="Log In" onPress={signIn} />

      <Pressable onPress={() => router.push("/signup")} style={{ marginTop: 12 }}>
        <Text style={{ color: "blue", textAlign: "center" }}>
          Don’t have an account? Sign Up
        </Text>
      </Pressable>
    </View>
  );
}

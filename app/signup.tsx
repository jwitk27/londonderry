import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, Button, TextInput, View } from "react-native";
import { supabase } from "../lib/supabase";

export default function SignUpScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  const signUp = async () => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: "londonderry://auth/callback",
      },
    });

    if (error) return Alert.alert("Error", error.message);

    // Email confirm ON -> no session yet
    if (!data.session) {
      Alert.alert(
        "Success",
        "Check your email to confirm your account.",
        [{ text: "OK", onPress: () => router.replace("/login") }]
      );
      return;
    }

    // Email confirm OFF -> logged in immediately
    router.replace("/");
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
        value={password}
        onChangeText={setPassword}
        style={{ borderWidth: 1, marginBottom: 8, padding: 8 }}
      />
      <Button title="Sign Up" onPress={signUp} />
    </View>
  );
}

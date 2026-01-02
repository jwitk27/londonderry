import { supabase } from "@/lib/supabase";
import { useState } from "react";
import { Alert, Button, TextInput, View } from "react-native";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");

  const send = async () => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: "londonderry://auth/callback",
    });
    if (error) Alert.alert("Error", error.message);
    else Alert.alert("Sent", "Check your email for the reset link.");
  };

  return (
    <View style={{ flex: 1, justifyContent: "center", padding: 16, gap: 10 }}>
      <TextInput
        placeholder="Email"
        autoCapitalize="none"
        value={email}
        onChangeText={setEmail}
        style={{ borderWidth: 1, padding: 10, borderRadius: 8 }}
      />
      <Button title="Send password reset email" onPress={send} />
    </View>
  );
}

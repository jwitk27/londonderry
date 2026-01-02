import { supabase } from "@/lib/supabase";
import { useState } from "react";
import { Alert, Button, Text, TextInput, View } from "react-native";

export default function CheckEmail() {
  const [email, setEmail] = useState("");

  const resend = async () => {
    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
      options: { emailRedirectTo: "londonderry://auth/callback" },
    });
    if (error) Alert.alert("Error", error.message);
    else Alert.alert("Sent", "Check your email again.");
  };

  return (
    <View style={{ flex: 1, justifyContent: "center", padding: 16, gap: 10 }}>
      <Text style={{ fontWeight: "800" }}>Check your email</Text>
      <Text>Tap the link in the email to finish signup.</Text>

      <TextInput
        placeholder="Email to resend"
        autoCapitalize="none"
        value={email}
        onChangeText={setEmail}
        style={{ borderWidth: 1, padding: 10, borderRadius: 8 }}
      />

      <Button title="Resend confirmation email" onPress={resend} />
    </View>
  );
}

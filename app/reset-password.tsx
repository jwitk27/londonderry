import { supabase } from "@/lib/supabase";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, Button, Text, TextInput, View } from "react-native";

export default function ResetPassword() {
  const router = useRouter();
  const [p1, setP1] = useState("");
  const [p2, setP2] = useState("");

  const save = async () => {
    if (!p1 || p1.length < 6) return Alert.alert("Error", "Password too short.");
    if (p1 !== p2) return Alert.alert("Error", "Passwords do not match.");

    const { data } = await supabase.auth.getSession();
    if (!data.session) return Alert.alert("Error", "Open the reset link again.");

    const { error } = await supabase.auth.updateUser({ password: p1 });
    if (error) return Alert.alert("Error", error.message);

    Alert.alert("Success", "Password updated.");
    router.replace("/");
  };

  return (
    <View style={{ flex: 1, justifyContent: "center", padding: 16, gap: 10 }}>
      <Text style={{ fontWeight: "800" }}>Set new password</Text>
      <TextInput
        placeholder="New password"
        secureTextEntry
        value={p1}
        onChangeText={setP1}
        style={{ borderWidth: 1, padding: 10, borderRadius: 8 }}
      />
      <TextInput
        placeholder="Confirm new password"
        secureTextEntry
        value={p2}
        onChangeText={setP2}
        style={{ borderWidth: 1, padding: 10, borderRadius: 8 }}
      />
      <Button title="Save new password" onPress={save} />
    </View>
  );
}

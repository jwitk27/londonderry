import { useState } from "react";
import { Alert, Button, TextInput, View } from "react-native";
import { supabase } from "../lib/supabase";

export default function SignUpScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const signUp = async () => {
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) Alert.alert("Error", error.message);
    else Alert.alert("Success", "Check your email to confirm (if required).");
  };

  return (
    <View style={{ flex:1, justifyContent:"center", padding:16 }}>
      <TextInput placeholder="Email" autoCapitalize="none"
        onChangeText={setEmail} style={{ borderWidth:1, marginBottom:8, padding:8 }} />
      <TextInput placeholder="Password" secureTextEntry
        onChangeText={setPassword} style={{ borderWidth:1, marginBottom:8, padding:8 }} />
      <Button title="Sign Up" onPress={signUp} />
    </View>
  );
}

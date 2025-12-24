import { styles, ui } from "@/components/bulletins/ui";
import { supabase } from "@/lib/supabase";
import { router } from "expo-router";
import { useState } from "react";
import { Alert, Button, Text, TextInput, View } from "react-native";

export default function NewBulletinPage() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  const create = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return Alert.alert("Not logged in");

    const { data: prof, error: pErr } = await supabase
      .from("profiles")
      .select("id, role")
      .eq("auth_uid", user.id)
      .single();

    if (pErr) return Alert.alert("Error", pErr.message);
    if (prof.role !== "admin") return Alert.alert("Admins only");

    if (!title.trim()) return Alert.alert("Title required");

    const { error } = await supabase.from("bulletins").insert([
      { title: title.trim(), body: body.trim() || null, pinned: false, created_by: prof.id },
    ]);

    if (error) return Alert.alert("Error", error.message);

    router.back(); // return to list
  };

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Text style={{ fontSize: 22, fontWeight: "900", marginBottom: 12 }}>New Bulletin</Text>

      <TextInput
        placeholder="Title"
        placeholderTextColor={ui.colors.muted}
        value={title}
        onChangeText={setTitle}
        style={[styles.input, { color: ui.colors.text }]}
      />

      <TextInput
        placeholder="Body (optional)"
        placeholderTextColor={ui.colors.muted}
        value={body}
        onChangeText={setBody}
        multiline
        style={[styles.input, styles.inputMultiline, { color: ui.colors.text }]}
        textAlignVertical="top"
      />

      <View style={{ flexDirection: "row", justifyContent: "flex-end", gap: 8, marginTop: 12 }}>
        <Button title="Cancel" onPress={() => router.back()} />
        <Button title="Create" onPress={create} />
      </View>
    </View>
  );
}

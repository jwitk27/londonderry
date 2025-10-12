import * as DocumentPicker from "expo-document-picker";
import * as Linking from "expo-linking";
import { useEffect, useState } from "react";
import { Alert, Button, FlatList, Pressable, Text, View } from "react-native";
import { supabase } from "../../lib/supabase";

type Doc = { id: string; title: string; path: string; created_at: string };
const BUCKET = "docs";

export default function DocumentsScreen() {
  const [docs, setDocs] = useState<Doc[]>([]);
  const [uid, setUid] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUid(user?.id ?? null);
      await refresh();
    })();
  }, []);

  const refresh = async () => {
    const { data, error } = await supabase
      .from("documents")
      .select("id,title,path,created_at")
      .order("created_at", { ascending: false });
    if (error) Alert.alert("Load error", error.message);
    else setDocs(data || []);
  };

  const upload = async () => {
    if (!uid) return Alert.alert("Not logged in");
    const pick = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true });
    if (pick.canceled || !pick.assets?.length) return;

    const f = pick.assets[0]; // { uri, name, mimeType, size }
    const fileName = f.name || "file";
    const key = `users/${uid}/${Date.now()}-${fileName}`; // ✅ matches policies

    try {
      // RN: fetch -> blob works on iOS/Android/Web
      const blob = await (await fetch(f.uri)).blob();

      // 1) upload to Storage (private bucket)
      const up = await supabase.storage.from(BUCKET).upload(key, blob, {
        contentType: f.mimeType || "application/octet-stream",
        upsert: false,
      });
      if (up.error) throw up.error;

      // 2) insert DB row (for listing/metadata)
      const ins = await supabase
        .from("documents")
        .insert([{ title: fileName, path: key, owner_auth_uid: uid }])
        .select("id")
        .single();
      if (ins.error) throw ins.error;

      Alert.alert("Uploaded", fileName);
      refresh();
    } catch (e: any) {
      Alert.alert("Upload failed", e.message || String(e));
    }
  };

  const download = async (path: string) => {
    const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, 600); // 10 min
    if (error || !data?.signedUrl) return Alert.alert("Link error", error?.message || "No URL");
    Linking.openURL(data.signedUrl);
  };

  // Optional: admin-only delete (uncomment + ensure storage DELETE policy)
  // const remove = async (path: string, id: string) => {
  //   const del1 = await supabase.storage.from(BUCKET).remove([path]);
  //   if (del1.error) return Alert.alert("Storage delete error", del1.error.message);
  //   const del2 = await supabase.from("documents").delete().eq("id", id);
  //   if (del2.error) return Alert.alert("DB delete error", del2.error.message);
  //   refresh();
  // };

  return (
    <View style={{ flex:1, padding:16 }}>
      <Text style={{ fontSize:22, fontWeight:"700", marginBottom:12 }}>Documents</Text>
      <Button title="Upload a document" onPress={upload} />

      <FlatList
        style={{ marginTop:12 }}
        data={docs}
        keyExtractor={(d)=>d.id}
        ItemSeparatorComponent={() => <View style={{ height:8 }} />}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => download(item.path)}
            style={{ padding:12, borderWidth:1, borderColor:"#e5e7eb", borderRadius:12 }}
          >
            <Text style={{ fontWeight:"600" }}>{item.title}</Text>
            <Text style={{ color:"#6b7280", fontSize:12 }}>
              {new Date(item.created_at).toLocaleString()}
            </Text>
            {/* <Button title="Delete" onPress={() => remove(item.path, item.id)} /> */}
          </Pressable>
        )}
        ListEmptyComponent={<Text style={{ color:"#6b7280", marginTop:16 }}>No documents yet.</Text>}
      />
    </View>
  );
}

import PageHeader from "@/components/ui/PageHeader";
import * as DocumentPicker from "expo-document-picker";
import * as Linking from "expo-linking";
import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Button,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { supabase } from "../../lib/supabase";

type Doc = {
  id: string;
  title: string;
  path: string;
  created_at: string;
  is_priority: boolean;
};

const BUCKET = "docs";

export default function DocumentsScreen() {
  const [docs, setDocs] = useState<Doc[]>([]);
  const [uid, setUid] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

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
      .select("id,title,path,created_at,is_priority")
      .order("created_at", { ascending: false });

    if (error) Alert.alert("Load error", error.message);
    else setDocs((data as Doc[]) || []);
  };

  const general = useMemo(() => docs.filter((d) => !d.is_priority), [docs]);
  const priority = useMemo(() => docs.filter((d) => d.is_priority), [docs]);

  const askPriority = (): Promise<boolean> =>
    new Promise((resolve) => {
      Alert.alert("Priority document?", "Put this in Priority list?", [
        { text: "No", style: "cancel", onPress: () => resolve(false) },
        { text: "Yes", onPress: () => resolve(true) },
      ]);
    });

  const upload = async () => {
    if (!uid) return Alert.alert("Not logged in");
    if (uploading) return;

    const pick = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true });
    if (pick.canceled || !pick.assets?.length) return;

    const f = pick.assets[0];
    const fileName = f.name || "file";
    const is_priority = await askPriority();

    const key = `users/${uid}/${Date.now()}-${fileName}`;

    try {
      setUploading(true);

      const res = await fetch(f.uri);
      const arrayBuffer = await res.arrayBuffer();

      const up = await supabase.storage.from(BUCKET).upload(
        key,
        arrayBuffer, // ✅ real file bytes
        {
          contentType: f.mimeType || "application/octet-stream",
          upsert: false,
        }
      );
      if (up.error) throw up.error;


      const ins = await supabase.from("documents").insert([
        { title: fileName, path: key, owner_auth_uid: uid, is_priority },
      ]);
      if (ins.error) throw ins.error;

      Alert.alert("Uploaded", fileName);
      await refresh();
    } catch (e: any) {
      Alert.alert("Upload failed", e.message || String(e));
    } finally {
      setUploading(false);
    }
  };

  const download = async (path: string) => {
    const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, 600);
    if (error || !data?.signedUrl) return Alert.alert("Link error", error?.message || "No URL");
    Linking.openURL(data.signedUrl);
  };

  const DocRow = ({
    item,
    variant = "general",
  }: {
    item: Doc;
    variant?: "general" | "priority";
  }) => (
    <Pressable
      onPress={() => download(item.path)}
      style={variant === "priority" ? styles.rowPriority : styles.row}
    >
      <Text style={variant === "priority" ? styles.rowTitlePriority : styles.rowTitle}>
        {item.title}
      </Text>
    </Pressable>
  );

  return (
    <View style={styles.screen}>
      <PageHeader title="Londonderry Documents" sub="" />

      <View style={{ marginTop: 10 }}>
        <Button
          title={uploading ? "Uploading..." : "Upload a document"}
          onPress={upload}
          disabled={uploading}
        />
      </View>

      <ScrollView style={{ marginTop: 14 }} contentContainerStyle={{ paddingBottom: 24 }}>
        {general.length === 0 ? (
          <Text style={styles.empty}>No documents yet.</Text>
        ) : (
          <FlatList
            data={general}
            keyExtractor={(d) => d.id}
            renderItem={({ item }) => <DocRow item={item} variant="general" />}
            ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
            scrollEnabled={false}
          />
        )}

        {priority.length > 0 ? (
          <>
            <View style={{ height: 18 }} />
            <Text style={styles.priorityTitle}>PRIORITY LIST</Text>
            <FlatList
              data={priority}
              keyExtractor={(d) => d.id}
              renderItem={({ item }) => <DocRow item={item} variant="priority" />}
              ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
              scrollEnabled={false}
            />
          </>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: 16 },

  sectionHeader: { marginTop: 10, marginBottom: 10 },
  sectionTitle: {
    fontSize: 14,
    letterSpacing: 1,
    fontWeight: "900",
    color: "#9ca3af",
  },
  sectionLine: { marginTop: 8, height: 1, backgroundColor: "#e5e7eb" },

  row: {
    alignSelf: "flex-start",
    backgroundColor: "#84a83a",
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 0,
  },
  
  rowTitle: { fontWeight: "900", color: "#fff", letterSpacing: 0.5 },

  empty: { color: "#6b7280", marginTop: 12 },

  priorityTitle: {
    color: "#5c7bbfff",
    fontWeight: "900",
    textDecorationLine: "underline",
    marginBottom: 10
  },

  rowPriority: {
    paddingVertical: 0, // no box
  },

  rowTitlePriority: {
    color: "#5c7bbfff",
    fontWeight: "700",
    marginBottom: 0
  },
});

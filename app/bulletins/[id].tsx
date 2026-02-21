import PageHeader from "@/components/ui/PageHeader";
import { supabase } from "@/lib/supabase";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import RenderHtml from "react-native-render-html";

type Role = "resident" | "admin" | null;

type Bulletin = {
  id: string;
  title: string;
  body_html: string | null;
  pinned: boolean;
  created_at: string;
};

export default function BulletinDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { width } = useWindowDimensions();

  const [item, setItem] = useState<Bulletin | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || cancelled) return setIsAdmin(false);

      const { data: prof } = await supabase
        .from("profiles")
        .select("role")
        .eq("auth_uid", user.id)
        .single();

      if (!cancelled) setIsAdmin(prof?.role === "admin");
    })();

    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    setItem(null);

    (async () => {
      const { data, error } = await supabase
        .from("bulletins")
        .select("id,title,body_html,pinned,created_at")
        .eq("id", id)
        .single();

      if (cancelled) return;

      if (error) {
        console.log(error);
        setItem(null);
        return;
      }

      setItem(data as Bulletin);
    })();

    return () => { cancelled = true; };
  }, [id]);

  const html = useMemo(() => item?.body_html || "<p></p>", [item?.body_html]);

  if (!item) return <ActivityIndicator style={{ marginTop: 40 }} />;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <PageHeader title={item.title} />
      <Text style={styles.meta}>{new Date(item.created_at).toLocaleString()}</Text>

      {isAdmin ? (
        <View style={{ alignItems: "flex-end", marginTop: 10 }}>
          <Pressable
            onPress={() => router.push(`/bulletins/${item.id}/edit`)}
            style={styles.editBtn}
          >
            <Text style={styles.editBtnText}>Edit</Text>
          </Pressable>
        </View>
      ) : null}

      <View style={{ marginTop: 14 }}>
        <RenderHtml
          contentWidth={width - 32}
          source={{ html }}
          baseStyle={styles.htmlBase}
          tagsStyles={{
            p: { marginBottom: 10, lineHeight: 22 },
            li: { marginBottom: 6, lineHeight: 22 },
            img: { borderRadius: 12 },
          }}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: 16 },
  pinned: { color: "#be123c", fontWeight: "900", marginBottom: 6, fontSize: 12 },
  meta: { marginTop: 6, color: "#6b7280", fontWeight: "600" },
  htmlBase: { color: "#111827", fontSize: 16 },

  editBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#fff",
  },
  editBtnText: { fontWeight: "900", color: "#111827" },
});

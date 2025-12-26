import PageHeader from "@/components/ui/PageHeader";
import { supabase } from "@/lib/supabase";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import RenderHtml from "react-native-render-html";

type Bulletin = {
  id: string;
  title: string;
  body_html: string | null;
  pinned: boolean;
  created_at: string;
};

export default function BulletinDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { width } = useWindowDimensions();

  const [item, setItem] = useState<Bulletin | null>(null);

useEffect(() => {
  if (!id) return;

  let cancelled = false;

  // ✅ clear old bulletin immediately so you don't flash it
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

  return () => {
    cancelled = true;
  };
}, [id]);

  const html = useMemo(() => item?.body_html || "<p></p>", [item?.body_html]);

  if (!item) return <ActivityIndicator style={{ marginTop: 40 }} />;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      {item.pinned ? (
        <Text style={styles.pinned}>IMPORTANT PINNED ALERT</Text>
      ) : null}

      <PageHeader title={item.title} />
      <Text style={styles.meta}>{new Date(item.created_at).toLocaleString()}</Text>

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
  pinned: {
    color: "#be123c",
    fontWeight: "900",
    marginBottom: 6,
    fontSize: 12,
  },
  title: { fontSize: 26, fontWeight: "900", color: "#111827" },
  meta: { marginTop: 6, color: "#6b7280", fontWeight: "600" },
  htmlBase: { color: "#111827", fontSize: 16 },
});

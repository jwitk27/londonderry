import { supabase } from "@/lib/supabase";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";

export default function BulletinDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [item, setItem] = useState<any>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("bulletins")
        .select("id,title,body,pinned,created_at")
        .eq("id", id)
        .single();
      setItem(data);
    })();
  }, [id]);

  if (!item) return <ActivityIndicator style={{ marginTop: 40 }} />;

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Text style={{ fontSize: 24, fontWeight: "900" }}>{item.title}</Text>
      <Text style={{ marginTop: 6, color: "#6b7280" }}>
        {new Date(item.created_at).toLocaleString()}
      </Text>
      {item.body ? <Text style={{ marginTop: 14, fontSize: 16 }}>{item.body}</Text> : null}
    </View>
  );
}

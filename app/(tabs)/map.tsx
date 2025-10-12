// app/map.tsx
import { useEffect, useState } from "react";
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, View } from "react-native";
import { supabase } from "../../lib/supabase";

const BUCKET = "assets";
const KEY = "maps/site-plan.jpg"; // change if you use .png/.webp

export default function MapPage() {
  const [url, setUrl] = useState<string | null>(null);
  const [ratio, setRatio] = useState<number | null>(null); // width / height
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(KEY, 60 * 60);
        if (error || !data?.signedUrl) throw new Error(error?.message || "No URL");
        setUrl(data.signedUrl);

        // get intrinsic size → set aspectRatio so it scales perfectly
        Image.getSize(
          data.signedUrl,
          (w, h) => setRatio(w / h),
          () => setRatio(4 / 3) // safe fallback
        );
      } catch (e: any) {
        setErr(e.message || "Failed to load map");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }
  if (err || !url) {
    return (
      <View style={styles.center}>
        <Text>{err ?? "No map available"}</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.card}>
        <Image
          source={{ uri: url }}
          resizeMode="contain"
          style={[
            styles.image,
            ratio ? { aspectRatio: ratio } : undefined, // keeps padding; no edge bleed
          ]}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,            // ⬅️ nice padding around the image
    backgroundColor: "#fff",
  },
  card: {
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#fafafa",
    borderWidth: 1,
    borderColor: "#eee",
    padding: 12,            // inner padding to avoid touching edges
  },
  image: {
    width: "100%",          // fill width
    height: undefined,      // let aspectRatio determine height
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    backgroundColor: "#fff",
  },
});

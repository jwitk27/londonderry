// app/(tabs)/map.tsx
import { MaterialIcons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { supabase } from "../../lib/supabase";


const BUCKET = "assets";
const KEY = "maps/site-plan.jpg";

// Markers use "image coordinates" as percent of the image (0..1)
type Marker = {
  id: string;
  x: number; // 0..1
  y: number; // 0..1
  label: string;
};

export default function MapPage() {
  const [url, setUrl] = useState<string | null>(null);
  const [ratio, setRatio] = useState<number | null>(null); // width/height
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // space available for the map (between top and tabs)
  const [mapH, setMapH] = useState<number>(0);

  const [active, setActive] = useState<Marker | null>(null);

  // “random” markers (edit these whenever)
  const markers: Marker[] = useMemo(
    () => [
      { id: "m1", x: 0.18, y: 0.25, label: "Office" },
      { id: "m2", x: 0.42, y: 0.55, label: "Dining" },
      { id: "m3", x: 0.72, y: 0.33, label: "Parking" },
      { id: "m4", x: 0.63, y: 0.78, label: "Gym" },
    ],
    []
  );

  useEffect(() => {
    (async () => {
      try {
        const { data, error } = await supabase.storage
          .from(BUCKET)
          .createSignedUrl(KEY, 60 * 60);

        if (error || !data?.signedUrl) throw new Error(error?.message || "No URL");
        setUrl(data.signedUrl);

        Image.getSize(
          data.signedUrl,
          (w, h) => setRatio(w / h),
          () => setRatio(4 / 3)
        );
      } catch (e: any) {
        setErr(e.message || "Failed to load map");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const mapW = useMemo(() => {
    if (!ratio || !mapH) return 0;
    return Math.round(mapH * ratio);
  }, [ratio, mapH]);

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
    <View
      style={styles.screen}
      onLayout={(e) => setMapH(e.nativeEvent.layout.height)}
    >
      {!mapH || !ratio ? (
        <View style={styles.center}>
          <ActivityIndicator />
        </View>
      ) : (
        <ScrollView
          horizontal
          style={styles.scroller}
          contentContainerStyle={[styles.scrollerContent, { height: mapH }]}
          showsHorizontalScrollIndicator
          bounces={false}
        >
          <View style={[styles.mapWrap, { width: mapW, height: mapH }]}>
            <Image
              source={{ uri: url }}
              resizeMode="stretch"
              style={{ width: mapW, height: mapH }}
            />

            {/* Markers layer */}
            <View style={[StyleSheet.absoluteFillObject]}>
              {markers.map((m) => (
                <Pressable
                  key={m.id}
                  onPress={() => setActive(m)}
                  style={{
                    position: "absolute",
                    left: m.x * mapW - 12,
                    top: m.y * mapH - 24,
                  }}
                >
                  <MaterialIcons name="place" size={32} color="#e11d48" />
                </Pressable>
              ))}
            </View>
          </View>
        </ScrollView>
      )}

      {/* Tooltip */}
      <Modal visible={!!active} transparent animationType="fade">
        <Pressable style={styles.modalBg} onPress={() => setActive(null)}>
          <View style={styles.tooltip}>
            <Text style={styles.tooltipTitle}>{active?.label}</Text>
            <Text style={styles.tooltipSub}>Tap anywhere to close</Text>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const MARKER_SIZE = 24;

const styles = StyleSheet.create({
  screen: {
    flex: 1, // fills between top and tabs
  },
  scroller: {
    flex: 1,
  },
  scrollerContent: {
    alignItems: "center",
  },
  mapWrap: {
    position: "relative",
  },
  marker: {
    position: "absolute",
    width: MARKER_SIZE,
    alignItems: "center",
  },
  pin: {
    width: MARKER_SIZE,
    height: MARKER_SIZE,
    backgroundColor: "#e11d48",
    transform: [{ rotate: "45deg" }],
    borderRadius: MARKER_SIZE / 2,
    borderTopLeftRadius: 0,
    borderWidth: 2,
    borderColor: "#fff",
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  modalBg: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.35)",
    padding: 16,
  },
  tooltip: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 14,
    minWidth: 220,
  },
  tooltipTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
  },
  tooltipSub: {
    color: "#6b7280",
    fontSize: 12,
  },
});

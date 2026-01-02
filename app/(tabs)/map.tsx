// app/(tabs)/map.tsx
import { MaterialIcons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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

  const [mapH, setMapH] = useState(0);
  const scrollerRef = useRef<ScrollView>(null);

  const [active, setActive] = useState<Marker | null>(null);

  // overlay hint
  const [hint, setHint] = useState(true);

  useFocusEffect(
    useCallback(() => {
      setHint(true);
    }, [])
  );

  const markers: Marker[] = useMemo(
    () => [
      {
        id: "m1",
        x: 0.52,
        y: 0.68,
        label:
          "This is the (somethingfields), not sure how it's spelled or what it actually says, but hey it's a tooltip anywho!",
      },
      {
        id: "m2",
        x: 0.624,
        y: 0.46,
        label: "Community Center & Dining Room. This is where ya eat! and play bingo",
      },
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

  // center the scroll position after layout
  useEffect(() => {
    if (!mapW || !mapH) return;
    requestAnimationFrame(() => {
      const x = Math.max(0, (mapW - 1) / 2);
      scrollerRef.current?.scrollTo({ x, y: 0, animated: false });
    });
  }, [mapW, mapH]);

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
    <View style={styles.screen} onLayout={(e) => setMapH(e.nativeEvent.layout.height)}>
      {!mapH || !ratio ? (
        <View style={styles.center}>
          <ActivityIndicator />
        </View>
      ) : (
        <ScrollView
          ref={scrollerRef}
          horizontal
          style={styles.scroller}
          contentContainerStyle={[styles.scrollerContent, { height: mapH }]}
          showsHorizontalScrollIndicator
          bounces={false}
          scrollEnabled
        >
          <View style={[styles.mapWrap, { width: mapW, height: mapH }]}>
            <Image
              source={{ uri: url }}
              resizeMode="stretch"
              style={{ width: mapW, height: mapH }}
            />

            {/* Markers layer */}
            <View style={StyleSheet.absoluteFillObject} pointerEvents="box-none">
              {markers.map((m) => (
                <Pressable
                  key={m.id}
                  onPress={() => {
                    setHint(false);
                    setActive(m);
                  }}
                  style={{
                    position: "absolute",
                    left: m.x * mapW - MARKER_HIT / 2,
                    top: m.y * mapH - MARKER_HIT,
                    width: MARKER_HIT,
                    height: MARKER_HIT,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <MaterialIcons name="place" size={MARKER_ICON} color="#e11d48" />
                </Pressable>
              ))}
            </View>
          </View>
        </ScrollView>
      )}

      {/* Overlay hint */}
      {hint && (
        <Pressable style={styles.hintWrap} onPress={() => setHint(false)}>
          <View style={styles.hintCard}>
            <Text style={styles.hintTitle}>Swipe left / right to scroll</Text>
            <Text style={styles.hintSub}>Tap a pin for details</Text>
          </View>
        </Pressable>
      )}

      {/* Tooltip (marker modal) */}
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

const MARKER_ICON = 46;
const MARKER_HIT = 52;

const styles = StyleSheet.create({
  screen: { flex: 1 },
  scroller: { flex: 1 },
  scrollerContent: { alignItems: "center" },
  mapWrap: { position: "relative" },

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
    maxWidth: 340,
  },
  tooltipTitle: { fontSize: 16, fontWeight: "700", marginBottom: 4 },
  tooltipSub: { color: "#6b7280", fontSize: 12 },

  hintWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 56,
    alignItems: "center",
    zIndex: 50,
  },
  hintCard: {
    backgroundColor: "rgba(0,0,0,0.65)",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 14,
  },
  hintTitle: {
    color: "white",
    fontWeight: "700",
    fontSize: 14,
    textAlign: "center",
  },
  hintSub: {
    color: "white",
    opacity: 0.9,
    fontSize: 12,
    marginTop: 2,
    textAlign: "center",
  },
});

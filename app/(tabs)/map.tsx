// app/(tabs)/map.tsx
import { MaterialIcons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import ImageZoom from "react-native-image-pan-zoom";
import { SvgUri } from "react-native-svg";
import { supabase } from "../../lib/supabase";

const BUCKET = "assets";
const KEY = "maps/map-revision.svg";

// SVG needs a fixed aspect ratio (width/height)
const MAP_RATIO = 4 / 3;

type Marker = {
  id: string;
  x: number; // 0..1
  y: number; // 0..1
  label: string;
};

export default function MapPage() {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [active, setActive] = useState<Marker | null>(null);

  // overlay hint
  const [hint, setHint] = useState(true);
  useFocusEffect(
    useCallback(() => {
      setHint(true);
    }, [])
  );

  // layout (needed for ImageZoom crop size)
  const [cropW, setCropW] = useState(0);
  const [cropH, setCropH] = useState(0);

  // content size (what ImageZoom thinks it is zooming)
  const contentH = cropH;
  const contentW = useMemo(() => (contentH ? Math.round(contentH * MAP_RATIO) : 0), [contentH]);

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
    <View
      style={styles.screen}
      onLayout={(e) => {
        setCropW(e.nativeEvent.layout.width);
        setCropH(e.nativeEvent.layout.height);
      }}
    >
      {!cropW || !cropH || !contentW || !contentH ? (
        <View style={styles.center}>
          <ActivityIndicator />
        </View>
      ) : (
        <ImageZoom
          cropWidth={cropW}
          cropHeight={cropH}
          imageWidth={contentW}
          imageHeight={contentH}
          minScale={1}
          maxScale={4}
          enableCenterFocus={false}
          useNativeDriver
          style={{ backgroundColor: "transparent" }}
          onMove={() => {
            // hide hint once they interact
            // (fires a lot; but harmless)
            if (hint) setHint(false);
          }}
        >
          <View style={{ width: contentW, height: contentH, backgroundColor: "transparent" }}>
            {/* Map */}
            <SvgUri uri={url} width={contentW} height={contentH} />

            {/* Markers (inside zoom so they scale/pan with map) */}
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
                    left: m.x * contentW - MARKER_HIT / 2,
                    top: m.y * contentH - MARKER_HIT,
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
        </ImageZoom>
      )}

      {/* Overlay hint */}
      {hint && (
        <Pressable style={styles.hintWrap} onPress={() => setHint(false)}>
          <View style={styles.hintCard}>
            <Text style={styles.hintTitle}>Pinch to zoom • Drag to pan</Text>
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

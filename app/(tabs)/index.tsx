// app/(tabs)/index.tsx
import BulletinFab from "@/components/bulletins/BulletinFab";
import BulletinList from "@/components/bulletins/BulletinList";
import { styles as bulletinStyles } from "@/components/bulletins/ui";
import { useBulletins } from "@/components/bulletins/useBulletins";
import PageHeader from "@/components/ui/PageHeader";
import WeatherWidget from "@/components/weather/WeatherWidget";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    AppState,
    ImageBackground,
    Modal,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { WebView } from "react-native-webview";
import { supabase } from "../../lib/supabase";

const ASSETS_BUCKET = "assets";
const STAFF_BG_KEY = "images/staff-link-background.jpg";
const TREDAVON_IMG_KEY = "images/tredavon-times.jpg";
const HAPPENINGS_IMG_KEY = "images/happenings.jpg";

const DOCS_BUCKET = "assets";

const TREDAVON_PDF_KEY = "times/tred-avon-times-february-2026.pdf";
const HAPPENINGS_PDF_KEY = "happenings/londonderry-happenings-february-2026.pdf";

function toPdfViewerUrl(rawUrl: string) {
  if (!rawUrl) return rawUrl;

  // iOS WKWebView renders PDFs directly; Google viewer often fails with signed/private URLs
  if (Platform.OS === "ios") return rawUrl;

  // Android fallback
  return `https://docs.google.com/gview?embedded=1&url=${encodeURIComponent(
    rawUrl,
  )}`;
}

function PdfViewerModal({
  visible,
  title,
  url,
  onClose,
}: {
  visible: boolean;
  title: string;
  url: string | null;
  onClose: () => void;
}) {
  const viewerUrl = useMemo(() => (url ? toPdfViewerUrl(url) : null), [url]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (visible) setLoading(true);
  }, [visible, viewerUrl]);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={pdf.ui.wrap}>
        <View style={pdf.ui.header}>
          <Text style={pdf.ui.title} numberOfLines={1}>
            {title}
          </Text>

          <Pressable onPress={onClose} hitSlop={12}>
            <Text style={pdf.ui.close}>Close</Text>
          </Pressable>
        </View>

        {!viewerUrl ? (
          <View style={pdf.ui.center}>
            <Text>No PDF URL</Text>
          </View>
        ) : (
          <View style={{ flex: 1 }}>
            {loading && (
              <View style={pdf.ui.loading}>
                <ActivityIndicator />
              </View>
            )}

            <WebView
              source={{ uri: viewerUrl }}
              onLoadEnd={() => setLoading(false)}
              startInLoadingState
              originWhitelist={["*"]}
              allowsInlineMediaPlayback
              allowsLinkPreview
              javaScriptEnabled
            />
          </View>
        )}
      </View>
    </Modal>
  );
}

export default function HomeScreen() {
  const b = useBulletins();

  const [staffBgUrl, setStaffBgUrl] = useState<string | null>(null);
  const [tredavonBgUrl, setTredavonBgUrl] = useState<string | null>(null);
  const [happeningsBgUrl, setHappeningsBgUrl] = useState<string | null>(null);

  const [pdfOpen, setPdfOpen] = useState(false);
  const [pdfTitle, setPdfTitle] = useState("");
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      b.reload();
    }, [b.reload]),
  );

  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") b.reload();
    });
    return () => sub.remove();
  }, [b.reload]);

  useEffect(() => {
    const loadFromStorage = async (
      bucket: string,
      key: string,
      setter: (url: string) => void,
    ) => {
      const pub = supabase.storage.from(bucket).getPublicUrl(key);
      if (pub?.data?.publicUrl) {
        setter(pub.data.publicUrl);
        return;
      }

      const { data } = await supabase.storage
        .from(bucket)
        .createSignedUrl(key, 60 * 60);

      if (data?.signedUrl) setter(data.signedUrl);
    };

    loadFromStorage(ASSETS_BUCKET, STAFF_BG_KEY, setStaffBgUrl);
    loadFromStorage(ASSETS_BUCKET, TREDAVON_IMG_KEY, setTredavonBgUrl);
    loadFromStorage(ASSETS_BUCKET, HAPPENINGS_IMG_KEY, setHappeningsBgUrl);
  }, []);

    const openPdf = async (title: string, key: string) => {
        setPdfTitle(title);
        setPdfUrl(null);
        setPdfOpen(true);

        // ALWAYS use signed URL (works for public + private)
        const { data, error } = await supabase.storage
            .from(DOCS_BUCKET)
            .createSignedUrl(key, 60 * 60);

        if (data?.signedUrl) {
            setPdfUrl(data.signedUrl);
        } else {
            console.log("PDF ERROR", error);
        }
    };

  return (
    <View style={bulletinStyles.screen}>
      <PageHeader title="Home" sub={b.userLabel} />

      <BulletinList
        bulletins={b.bulletins}
        loading={b.loading}
        isAdmin={b.isAdmin}
        onTogglePin={b.togglePin}
        onDelete={b.deleteBulletin}
        onRefresh={b.reload}
        footer={
          <View>
            <Pressable onPress={() => router.push("/weather")}>
              <WeatherWidget />
            </Pressable>

            <Pressable
              onPress={() => router.push("/staffDirectory")}
              style={{ marginTop: 20 }}
            >
              <ImageBackground
                source={staffBgUrl ? { uri: staffBgUrl } : undefined}
                resizeMode="cover"
                imageStyle={ui.staffImg}
                style={ui.staffCard}
              >
                <View style={ui.blueOverlay} />
                <Text style={ui.staffTitle}>Staff Directory</Text>
              </ImageBackground>
            </Pressable>

            <Pressable
              onPress={() => openPdf("TredAvon Times", TREDAVON_PDF_KEY)}
              style={{ marginTop: 20 }}
            >
              <ImageBackground
                source={tredavonBgUrl ? { uri: tredavonBgUrl } : undefined}
                resizeMode="cover"
                imageStyle={ui.staffImg}
                style={ui.staffCard}
              >
                <View style={ui.blueOverlay} />
                <Text style={ui.staffTitle}>TredAvon Times</Text>
              </ImageBackground>
            </Pressable>

            <Pressable
              onPress={() =>
                openPdf("Londonderry Happenings", HAPPENINGS_PDF_KEY)
              }
              style={{ marginTop: 20 }}
            >
              <ImageBackground
                source={happeningsBgUrl ? { uri: happeningsBgUrl } : undefined}
                resizeMode="cover"
                imageStyle={ui.staffImg}
                style={ui.staffCard}
              >
                <View style={ui.blueOverlay} />
                <Text style={ui.staffTitle}>Londonderry Happenings</Text>
              </ImageBackground>
            </Pressable>
          </View>
        }
      />

      {b.isAdmin && <BulletinFab />}

      <PdfViewerModal
        visible={pdfOpen}
        title={pdfTitle}
        url={pdfUrl}
        onClose={() => setPdfOpen(false)}
      />
    </View>
  );
}

const ui = StyleSheet.create({
  staffCard: {
    width: "100%",
    height: 160,
    borderRadius: 22,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
  },
  staffImg: { borderRadius: 22 },
  blueOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(56, 189, 248, 0.35)",
  },
  staffTitle: {
    color: "white",
    fontSize: 38,
    fontWeight: "800",
    textAlign: "center",
    paddingHorizontal: 12,
  },
});

const pdf = {
  ui: StyleSheet.create({
    wrap: { flex: 1, backgroundColor: "white" },
    header: {
      paddingTop: Platform.OS === "ios" ? 60 : 18,
      paddingHorizontal: 16,
      paddingBottom: 12,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: "#ddd",
    },
    title: { fontSize: 18, fontWeight: "800", flex: 1, paddingRight: 12 },
    close: { fontSize: 16, fontWeight: "700" },
    loading: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      height: 6,
      alignItems: "center",
      justifyContent: "center",
      zIndex: 2,
    },
    center: { flex: 1, alignItems: "center", justifyContent: "center" },
  }),
};
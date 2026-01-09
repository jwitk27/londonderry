// app/(tabs)/index.tsx
import BulletinFab from "@/components/bulletins/BulletinFab";
import BulletinList from "@/components/bulletins/BulletinList";
import { styles as bulletinStyles } from "@/components/bulletins/ui";
import { useBulletins } from "@/components/bulletins/useBulletins";
import PageHeader from "@/components/ui/PageHeader";
import WeatherWidget from "@/components/weather/WeatherWidget";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ImageBackground,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { supabase } from "../../lib/supabase";

const BUCKET = "assets";
const STAFF_BG_KEY = "staff/staff-link-background.jpg";

export default function HomeScreen() {
  const b = useBulletins();
  const [staffBgUrl, setStaffBgUrl] = useState<string | null>(null);

  useEffect(() => {
    // Prefer public URL (best for images)
    const pub = supabase.storage.from(BUCKET).getPublicUrl(STAFF_BG_KEY);
    if (pub?.data?.publicUrl) {
      setStaffBgUrl(pub.data.publicUrl);
      return;
    }

    // Fallback to signed URL if bucket is private
    (async () => {
      const { data } = await supabase.storage
        .from(BUCKET)
        .createSignedUrl(STAFF_BG_KEY, 60 * 60);

      if (data?.signedUrl) setStaffBgUrl(data.signedUrl);
    })();
  }, []);

  return (
    <View style={bulletinStyles.screen}>
      <PageHeader title="Home" sub={b.userLabel} />

      <BulletinList
        bulletins={b.bulletins}
        loading={b.loading}
        isAdmin={b.isAdmin}
        onTogglePin={b.togglePin}
        onRefresh={b.reload}
        footer={
          <View>
            <Pressable onPress={() => router.push("/weather")}>
              <WeatherWidget />
            </Pressable>

            {/* Staff Directory Card */}
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
                {/* bluish overlay */}
                <View style={ui.blueOverlay} />
                <Text style={ui.staffTitle}>Staff Directory</Text>
              </ImageBackground>
            </Pressable>
          </View>
        }
      />

      {b.isAdmin && <BulletinFab />}
    </View>
  );
}

const ui = StyleSheet.create({
  staffCard: {
    width: "100%",          // IMPORTANT: fixes invisible image
    height: 160,
    borderRadius: 22,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
  },
  staffImg: {
    borderRadius: 22,
  },
  blueOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(56, 189, 248, 0.35)", // bluish overlay
  },
  staffTitle: {
    color: "white",
    fontSize: 38,
    fontWeight: "800",
    textAlign: "center",
    paddingHorizontal: 12,
  },
  staffLinkText: {
    marginTop: 10,
    color: "#767480ff",
    textDecorationLine: "underline",
  },
});

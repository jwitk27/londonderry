import { supabase } from "@/lib/supabase";
import * as ExpoLinking from "expo-linking";
import { useRouter } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const go = async (url?: string | null) => {
      try {
        if (url) {
          await supabase.auth.exchangeCodeForSession(url);

          const parsed = ExpoLinking.parse(url);
          const type = (parsed.queryParams?.type as string) || "";

          if (type === "recovery") {
            router.replace("/reset-password");
            return;
          }

          // signup / magiclink / invite -> send to login (your preference)
          router.replace("/login");
          return;
        }

        // fallback
        const { data } = await supabase.auth.getSession();
        router.replace(data.session ? "/" : "/login");
      } catch (e) {
        router.replace("/login");
      }
    };

    ExpoLinking.getInitialURL().then(go);
    const sub = ExpoLinking.addEventListener("url", (e) => go(e.url));
    return () => sub.remove();
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <ActivityIndicator size="large" />
    </View>
  );
}

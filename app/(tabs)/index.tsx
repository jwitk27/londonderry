import BulletinFab from "@/components/bulletins/BulletinFab";
import BulletinList from "@/components/bulletins/BulletinList";
import { styles } from "@/components/bulletins/ui";
import { useBulletins } from "@/components/bulletins/useBulletins";
import PageHeader from "@/components/ui/PageHeader";
import WeatherWidget from "@/components/weather/WeatherWidget";
import { router } from "expo-router";
import { Pressable, Text, View } from "react-native";

export default function HomeScreen() {
  const b = useBulletins();

  return (
    <View style={styles.screen}>
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

            <Pressable
              onPress={() => router.push("/staffDirectory")}
              style={{ marginTop: 14 }}
            >
              <Text style={{ color: "#767480ff", textDecorationLine: 'underline' }}>
                Staff Directory
              </Text>
            </Pressable>
          </View>
        }
      />

      {b.isAdmin && <BulletinFab />}
    </View>
  );
}

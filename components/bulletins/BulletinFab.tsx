import { router } from "expo-router";
import { Pressable, Text } from "react-native";
import { styles } from "./ui";

export default function BulletinFab({ onPress }: { onPress: () => void }) {
  return (
    <Pressable onPress={() => router.push("/bulletins/new")} style={styles.fab}>
      <Text style={styles.fabText}>+ New Bulletin</Text>
    </Pressable>
  );
}

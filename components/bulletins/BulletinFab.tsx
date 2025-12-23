import { Pressable, Text } from "react-native";
import { styles } from "./ui";

export default function BulletinFab({ onPress }: { onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.fab}>
      <Text style={styles.fabText}>+ New Bulletin</Text>
    </Pressable>
  );
}

import { Text, View } from "react-native";
import { styles } from "./ui";
import type { Bulletin } from "./useBulletins";

export default function BulletinCard({ item }: { item: Bulletin }) {
  return (
    <View style={styles.card}>
      {item.pinned ? <Text style={styles.pinned}>PINNED</Text> : null}
      <Text style={styles.cardTitle}>{item.title}</Text>
      {item.body ? <Text style={styles.body}>{item.body}</Text> : null}
      <Text style={styles.meta}>{new Date(item.created_at).toLocaleString()}</Text>
    </View>
  );
}

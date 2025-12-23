import { Text, View } from "react-native";
import { styles } from "./ui";

export default function BulletinHeader({ title, sub }: { title: string; sub: string }) {
  return (
    <View>
      <Text style={styles.headerTitle}>{title}</Text>
      <Text style={styles.headerSub}>{sub}</Text>
    </View>
  );
}

import { ActivityIndicator, FlatList, Text } from "react-native";
import BulletinCard from "./BulletinCard";
import { styles } from "./ui";
import type { Bulletin } from "./useBulletins";

export default function BulletinList({
  bulletins,
  loading,
}: {
  bulletins: Bulletin[];
  loading: boolean;
}) {
  if (loading) return <ActivityIndicator style={{ marginTop: 40 }} />;

  return (
    <FlatList
      style={styles.list}
      data={bulletins}
      keyExtractor={(i) => i.id}
      ListEmptyComponent={<Text style={{ marginTop: 12 }}>No bulletins yet.</Text>}
      renderItem={({ item }) => <BulletinCard item={item} />}
    />
  );
}

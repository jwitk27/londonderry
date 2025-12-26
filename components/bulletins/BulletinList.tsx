import React from "react";
import { ActivityIndicator, FlatList, RefreshControl, Text, View } from "react-native";
import BulletinCard from "./BulletinCard";
import { styles } from "./ui";
import type { Bulletin } from "./useBulletins";

export default function BulletinList({
  bulletins,
  loading,
  isAdmin,
  onTogglePin,
  onRefresh,
  footer,
}: {
  bulletins: Bulletin[];
  loading: boolean;
  isAdmin: boolean;
  onTogglePin: (id: string, nextPinned: boolean) => void;
  onRefresh: () => void;
  footer?: React.ReactElement | null;
}) {
  if (loading) return <ActivityIndicator style={{ marginTop: 40 }} />;

  return (
    <FlatList
      style={styles.list}
      data={bulletins}
      keyExtractor={(i) => i.id}
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={onRefresh} />
      }
      ListEmptyComponent={<Text style={{ marginTop: 12 }}>No bulletins yet.</Text>}
      renderItem={({ item }) => (
        <BulletinCard item={item} isAdmin={isAdmin} onTogglePin={onTogglePin} />
      )}
      ListFooterComponent={footer ? <View style={{ marginTop: 12 }}>{footer}</View> : null}
    />
  );
}

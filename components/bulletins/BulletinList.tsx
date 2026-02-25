import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  Text,
  View,
} from "react-native";
import BulletinCard from "./BulletinCard";
import { styles } from "./ui";
import type { Bulletin } from "./useBulletins";

export default function BulletinList({
    bulletins,
    loading,
    isAdmin,
    onTogglePin,
    onDelete,
    onRefresh,
    footer,
}: {
    bulletins: Bulletin[];
    loading: boolean;
    isAdmin: boolean;
    onTogglePin: (id: string, nextPinned: boolean) => void;
    onDelete: (id: string) => void;
    onRefresh: () => void;
    footer?: React.ReactElement | null;
}) {
    const STEP = 4;
    const [visibleCount, setVisibleCount] = useState(STEP);

    // reset when list changes (refresh/new items)
    React.useEffect(() => {
        setVisibleCount(STEP);
    }, [bulletins.length]);

    const visible = useMemo(
        () => bulletins.slice(0, visibleCount),
        [bulletins, visibleCount],
    );

    const hasMore = visibleCount < bulletins.length;

    if (loading) return <ActivityIndicator style={{ marginTop: 40 }} />;

    return (
        <FlatList
            style={styles.list}
            data={visible}
            keyExtractor={(i) => i.id}
            refreshControl={
                <RefreshControl
                    refreshing={loading}
                    onRefresh={() => {
                        setVisibleCount(STEP);
                        onRefresh();
                    }}
                />
            }
            ListEmptyComponent={
                <Text style={{ marginTop: 12 }}>No bulletins yet.</Text>
            }
            renderItem={({ item }) => (
                <BulletinCard
                    item={item}
                    isAdmin={isAdmin}
                    onTogglePin={onTogglePin}
                    onDelete={onDelete}
                />
            )}
            ListFooterComponent={
                <View style={{ marginTop: 12 }}>
                    {hasMore ? (
                        <Pressable
                            onPress={() =>
                                setVisibleCount((c) =>
                                    Math.min(c + STEP, bulletins.length),
                                )
                            }
                            style={{
                                alignSelf: "center",
                                paddingVertical: 10,
                                paddingHorizontal: 14,
                                borderWidth: 1,
                                borderRadius: 12,
                                opacity: 0.9,
                                marginBottom: 12,
                                backgroundColor: "#fff",
                            }}
                        >
                            <Text style={{ fontWeight: "800" }}>Load more</Text>
                        </Pressable>
                    ) : null}

                    {footer ? (
                        <View style={{ marginTop: 12 }}>{footer}</View>
                    ) : null}
                </View>
            }
        />
    );
}

import { router } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { styles } from "./ui";
import type { Bulletin } from "./useBulletins";

function fmtDate(d: string) {
  const dt = new Date(d);
  const month = dt.toLocaleString([], { month: "long" }).toUpperCase();
  return `${month}, ${dt.getDate()}`;
}

export default function BulletinCard({
  item,
  isAdmin,
  onTogglePin,
}: {
  item: Bulletin;
  isAdmin: boolean;
  onTogglePin: (id: string, nextPinned: boolean) => void;
}) {
  return (
    <Pressable
      style={[
        styles.cardBase,
        item.pinned ? styles.cardPinned : styles.cardNormal,
      ]}
      onPress={() => router.push(`/bulletins/${item.id}`)}
    >
      {item.pinned ? <Text style={styles.important}>IMPORTANT PINNED ALERT</Text> : null}

      <View style={styles.row}>
        {/* LEFT */}
        <View style={{ flex: 1, paddingRight: 12 }}>
          <Text style={styles.title}>{item.title}</Text>
          {item.body ? (
            <Text style={styles.body} numberOfLines={2}>
              {item.body}
            </Text>
          ) : null}
        </View>

        {/* RIGHT fixed col */}
        <View style={styles.rightCol}>
          <Text style={styles.date}>{fmtDate(item.created_at)}</Text>

          {isAdmin && (
            <Pressable
              style={styles.pinBtn}
              onPress={(e) => {
                e.stopPropagation();
                onTogglePin(item.id, !item.pinned);
              }}
            >
              <Text style={styles.pinBtnText}>{item.pinned ? "Unpin" : "Pin"}</Text>
            </Pressable>
          )}
        </View>
      </View>
    </Pressable>
  );
}

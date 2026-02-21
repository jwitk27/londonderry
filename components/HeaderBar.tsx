import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Image, Modal, Pressable, StyleSheet, Text, View } from "react-native";

export default function HeaderBar() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const go = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  return (
    <View style={styles.wrap}>
      {/* Hamburger */}
      <Pressable style={styles.left} onPress={() => setOpen(true)} hitSlop={10}>
        <MaterialIcons name="menu" size={26} color="#111" />
      </Pressable>

      {/* Center logo */}
      <View style={styles.center}>
        {/* replace with your logo */}
        <Image source={require("@/assets/images/logo.jpg")} style={{ width: 40, height: 40, borderRadius: 0 }} />
      </View>

      {/* right spacer to keep title centered */}
      <View style={styles.right} />

      {/* Dropdown menu */}
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)} />
        <View style={styles.menu}>
          <Pressable style={styles.item} onPress={() => go("/")}>
            <MaterialIcons name="home" size={20} color="#111" /><Text style={styles.label}>Home</Text>
          </Pressable>
          <Pressable style={styles.item} onPress={() => go("/map")}>
            <MaterialIcons name="map" size={20} color="#111" /><Text style={styles.label}>Map</Text>
          </Pressable>
          <Pressable style={styles.item} onPress={() => go("/documents")}>
            <MaterialIcons name="description" size={20} color="#111" /><Text style={styles.label}>Documents</Text>
          </Pressable>
          <Pressable style={styles.item} onPress={() => go("/weather")}>
            <MaterialIcons name="cloud" size={20} color="#111" /><Text style={styles.label}>Weather</Text>
          </Pressable>
          {/* add more: /settings, /admin, etc. */}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    height: 75, backgroundColor: "transparent",
    borderBottomWidth: 1, borderColor: "#eee",
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 12,
    paddingTop: 20,
  },
  left: { width: 40, alignItems: "flex-start" },
  right: { width: 40 }, // balances the left icon to keep center truly centered
  center: { flex: 1, flexDirection: "row", justifyContent: "center", alignItems: "center" },

  backdrop: { position: "absolute", inset: 0, backgroundColor: "rgba(0,0,0,0.2)" },
  menu: {
    position: "absolute", top: 56, left: 8,
    backgroundColor: "#fff", borderRadius: 12, paddingVertical: 6,
    borderWidth: 1, borderColor: "#eee", width: 220, elevation: 6,
  },
  item: { flexDirection: "row", alignItems: "center", paddingVertical: 10, paddingHorizontal: 12 },
  label: { marginLeft: 10, fontSize: 16 },
});

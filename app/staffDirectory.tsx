// app/(tabs)/staffDirectory.tsx
import PageHeader from "@/components/ui/PageHeader";
import { supabase } from "@/lib/supabase";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    Modal,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";

const BUCKET = "assets";
const STAFF_PREFIX = "staff/";

type Role = "resident" | "admin" | null;

type Staff = {
  id: string;
  name: string;
  role_title: string;
  phone: string | null;
  email: string | null;
  photo_url: string | null;
  sort_order: number;
  created_at: string;
};

type PickedPhoto = {
  uri: string;
  mime: string;
  ext: string;
};

export default function StaffDirectoryScreen() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [role, setRole] = useState<Role>(null);
  const isAdmin = role === "admin";

  const [staff, setStaff] = useState<Staff[]>([]);

  // modal + form
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Staff | null>(null);

  const [name, setName] = useState("");
  const [roleTitle, setRoleTitle] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [picked, setPicked] = useState<PickedPhoto | null>(null);

  const resetForm = () => {
    setEditing(null);
    setName("");
    setRoleTitle("");
    setPhone("");
    setEmail("");
    setPicked(null);
  };

  const openAdd = () => {
    resetForm();
    setModalOpen(true);
  };

  const openEdit = (s: Staff) => {
    setEditing(s);
    setName(s.name);
    setRoleTitle(s.role_title);
    setPhone(s.phone ?? "");
    setEmail(s.email ?? "");
    setPicked(null); // keep existing unless they pick a new one
    setModalOpen(true);
  };

  const load = async () => {
    const { data, error } = await supabase
      .from("staff_members")
      .select("id,name,role_title,phone,email,photo_url,sort_order,created_at")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });

    if (error) {
      console.log(error);
      Alert.alert("Load failed", error.message);
      return;
    }

    setStaff((data as Staff[]) || []);
  };

  useEffect(() => {
    (async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          const { data: prof, error: pErr } = await supabase
            .from("profiles")
            .select("role")
            .eq("auth_uid", user.id)
            .single();

          if (!pErr) setRole((prof?.role as Role) ?? null);
        }

        await load();
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const pickPhoto = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return Alert.alert("Permission needed");

    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
    });
    if (res.canceled) return;

    const a = res.assets?.[0];
    if (!a?.uri) return;

    const uri = a.uri;
    const ext = (uri.split(".").pop() || "jpg").toLowerCase();
    const mime = a.mimeType || `image/${ext === "jpg" ? "jpeg" : ext}`;

    setPicked({ uri, ext, mime });
  };

  // ✅ The important part: upload bytes (ArrayBuffer) to storage
  const uploadPhotoIfAny = async (): Promise<string | null> => {
    if (!picked) return editing?.photo_url ?? null;

    const objectPath = `${STAFF_PREFIX}${Date.now()}_${Math.random()
      .toString(16)
      .slice(2)}.${picked.ext}`;

    const resp = await fetch(picked.uri);
    const arrayBuffer = await resp.arrayBuffer();

    const { error } = await supabase.storage.from(BUCKET).upload(objectPath, arrayBuffer, {
      contentType: picked.mime,
      upsert: false,
    });

    if (error) throw error;

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(objectPath);
    return data.publicUrl;
  };

  const save = async () => {
    if (!isAdmin) return Alert.alert("Admins only");

    if (!name.trim()) return Alert.alert("Name required");
    if (!roleTitle.trim()) return Alert.alert("Role/title required");

    setSaving(true);
    try {
      const photo_url = await uploadPhotoIfAny();

      if (editing) {
        const { error } = await supabase
          .from("staff_members")
          .update({
            name: name.trim(),
            role_title: roleTitle.trim(),
            phone: phone.trim() || null,
            email: email.trim() || null,
            photo_url,
          })
          .eq("id", editing.id);

        if (error) throw error;
      } else {
        const { error } = await supabase.from("staff_members").insert([
          {
            name: name.trim(),
            role_title: roleTitle.trim(),
            phone: phone.trim() || null,
            email: email.trim() || null,
            photo_url,
            sort_order: 0,
          },
        ]);

        if (error) throw error;
      }

      setModalOpen(false);
      resetForm();
      await load();
    } catch (e: any) {
      Alert.alert("Save failed", e?.message || "Unknown error");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (s: Staff) => {
    if (!isAdmin) return;
    Alert.alert("Delete staff?", s.name, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          const { error } = await supabase.from("staff_members").delete().eq("id", s.id);
          if (error) return Alert.alert("Delete failed", error.message);
          load();
        },
      },
    ]);
  };

  const Row = ({ item }: { item: Staff }) => (
    <View style={styles.row}>
      <View style={styles.photoBox}>
        {item.photo_url ? (
          <Image source={{ uri: item.photo_url }} style={styles.photo} />
        ) : (
          <MaterialCommunityIcons name="account" size={26} color="#6b7280" />
        )}
      </View>

      <View style={{ flex: 1 }}>
        <Text style={styles.rowName}>{item.name}</Text>
        <Text style={styles.rowRole}>{item.role_title}</Text>

        {(item.phone || item.email) ? (
          <Text style={styles.rowMeta}>
            {[item.phone, item.email].filter(Boolean).join(" · ")}
          </Text>
        ) : null}
      </View>

      {isAdmin ? (
        <View style={{ flexDirection: "row", gap: 10 }}>
          <Pressable onPress={() => openEdit(item)} style={styles.iconBtn}>
            <MaterialCommunityIcons name="pencil" size={18} color="#111827" />
          </Pressable>
          <Pressable onPress={() => remove(item)} style={styles.iconBtn}>
            <MaterialCommunityIcons name="trash-can-outline" size={18} color="#be123c" />
          </Pressable>
        </View>
      ) : null}
    </View>
  );

  if (loading) return <ActivityIndicator style={{ marginTop: 40 }} />;

  return (
    <View style={styles.screen}>
      <PageHeader title="Staff Directory" sub={isAdmin ? "Admin" : ""} />

      {isAdmin ? (
        <Pressable onPress={openAdd} style={styles.addBtn}>
          <Text style={styles.addBtnText}>Add staff member</Text>
        </Pressable>
      ) : null}

      <FlatList
        style={{ marginTop: 12 }}
        data={staff}
        keyExtractor={(i) => i.id}
        renderItem={({ item }) => <Row item={item} />}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        ListEmptyComponent={<Text style={styles.empty}>No staff yet.</Text>}
      />

      <Modal visible={modalOpen} transparent animationType="fade">
        <Pressable style={styles.modalBg} onPress={() => (!saving ? setModalOpen(false) : null)}>
          <Pressable style={styles.modalCard} onPress={() => {}}>
            <Text style={styles.modalTitle}>{editing ? "Edit Staff" : "New Staff"}</Text>

            <Pressable onPress={pickPhoto} style={styles.photoPick}>
              {picked?.uri ? (
                <Image source={{ uri: picked.uri }} style={styles.photoPickImg} />
              ) : editing?.photo_url ? (
                <Image source={{ uri: editing.photo_url }} style={styles.photoPickImg} />
              ) : (
                <View style={styles.photoPickEmpty}>
                  <MaterialCommunityIcons name="camera" size={22} color="#6b7280" />
                  <Text style={{ color: "#6b7280", fontWeight: "700", marginTop: 6 }}>
                    Add photo
                  </Text>
                </View>
              )}
            </Pressable>

            <Text style={styles.label}>Name</Text>
            <TextInput value={name} onChangeText={setName} style={styles.input} />

            <Text style={styles.label}>Role / Title</Text>
            <TextInput value={roleTitle} onChangeText={setRoleTitle} style={styles.input} />

            <Text style={styles.label}>Phone (optional)</Text>
            <TextInput value={phone} onChangeText={setPhone} style={styles.input} />

            <Text style={styles.label}>Email (optional)</Text>
            <TextInput value={email} onChangeText={setEmail} style={styles.input} autoCapitalize="none" />

            <View style={styles.modalActions}>
              <Pressable
                onPress={() => {
                  if (saving) return;
                  setModalOpen(false);
                  resetForm();
                }}
                style={[styles.btn, styles.btnGhost]}
              >
                <Text style={styles.btnGhostText}>Cancel</Text>
              </Pressable>

              <Pressable onPress={save} disabled={saving} style={[styles.btn, styles.btnPrimary]}>
                <Text style={styles.btnPrimaryText}>{saving ? "Saving..." : "Save"}</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: 16 },

  addBtn: {
    marginTop: 10,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#111827",
    alignItems: "center",
  },
  addBtnText: { color: "#fff", fontWeight: "900" },

  empty: { color: "#6b7280", marginTop: 16 },

  row: {
    flexDirection: "row",
    gap: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 14,
    backgroundColor: "#fff",
    alignItems: "center",
  },
  photoBox: {
    width: 54,
    height: 54,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#f9fafb",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  photo: { width: 54, height: 54, resizeMode: "cover" },

  rowName: { fontWeight: "900", color: "#111827", fontSize: 16 },
  rowRole: { fontWeight: "800", color: "#111827", marginTop: 2 },
  rowMeta: { color: "#6b7280", marginTop: 4, fontWeight: "600", fontSize: 12 },

  iconBtn: {
    padding: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#fff",
  },

  modalBg: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
    padding: 16,
  },
  modalCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  modalTitle: { fontWeight: "900", fontSize: 18, color: "#111827", marginBottom: 10 },

  photoPick: {
    width: "100%",
    height: 140,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#f9fafb",
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  photoPickImg: { width: "100%", height: "100%", resizeMode: "cover" },
  photoPickEmpty: { alignItems: "center" },

  label: { fontWeight: "800", color: "#111827", marginTop: 10, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#fff",
  },

  modalActions: { flexDirection: "row", gap: 10, marginTop: 14 },
  btn: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: "center" },
  btnGhost: { borderWidth: 1, borderColor: "#e5e7eb", backgroundColor: "#fff" },
  btnGhostText: { fontWeight: "900", color: "#111827" },
  btnPrimary: { backgroundColor: "#111827" },
  btnPrimaryText: { fontWeight: "900", color: "#fff" },
});

import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Button, FlatList, Modal, Pressable, Text, TextInput, View } from "react-native";
import { supabase } from "../../lib/supabase";

type Role = "resident" | "admin" | null;

export default function HomeScreen() {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [role, setRole] = useState<Role>(null);

  const [bulletins, setBulletins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // create form
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  useEffect(() => {
    (async () => {
      // who am i?
      const { data: { user } } = await supabase.auth.getUser();
      setUserEmail(user?.email ?? null);
      if (!user) { setLoading(false); return; }

      // fetch my profile (to get role + profile id)
      const { data: prof, error: pErr } = await supabase
        .from("profiles")
        .select("id, role")
        .eq("auth_uid", user.id)
        .single();
      if (pErr) { console.log(pErr); setLoading(false); return; }

      setProfileId(prof.id);
      setRole(prof.role as Role);

      // load bulletins
      const { data: rows, error } = await supabase
        .from("bulletins")
        .select("id,title,body,pinned,created_at")
        .order("pinned", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) console.log(error);
      setBulletins(rows || []);
      setLoading(false);
    })();
  }, []);

  const createBulletin = async () => {
    if (!profileId) return;
    if (!title.trim()) { Alert.alert("Title required"); return; }
    const { error } = await supabase
      .from("bulletins")
      .insert([{ title, body, pinned: false, created_by: profileId }]);

    if (error) {
      Alert.alert("Error", error.message);
      return;
    }
    // refresh list
    const { data } = await supabase
      .from("bulletins")
      .select("id,title,body,pinned,created_at")
      .order("pinned", { ascending: false })
      .order("created_at", { ascending: false });
    setBulletins(data || []);
    setShowForm(false);
    setTitle(""); setBody("");
  };

  if (loading) return <ActivityIndicator style={{ marginTop: 40 }} />;

  return (
    <View style={{ flex:1, padding:16, backgroundColor:"#fff" }}>
      <Text style={{ fontSize:22, fontWeight:"700" }}>Bulletins</Text>
      <Text style={{ marginTop:4, color:"#6b7280" }}>
        {userEmail ? `Logged in as ${userEmail}${role ? ` (${role})` : ""}` : "Not logged in"}
      </Text>

      <FlatList
        style={{ marginTop:12 }}
        data={bulletins}
        keyExtractor={(i)=>i.id}
        renderItem={({ item }) => (
          <View style={{ padding:14, borderRadius:12, borderWidth:1, borderColor:"#e5e7eb", marginBottom:8 }}>
            {item.pinned ? <Text style={{ fontSize:12, fontWeight:"700", color:"#3730a3" }}>PINNED</Text> : null}
            <Text style={{ fontSize:16, fontWeight:"600" }}>{item.title}</Text>
            {item.body ? <Text style={{ marginTop:6 }}>{item.body}</Text> : null}
            <Text style={{ marginTop:6, fontSize:12, color:"#6b7280" }}>
              {new Date(item.created_at).toLocaleString()}
            </Text>
          </View>
        )}
      />

      {role === "admin" && (
        <Pressable onPress={()=>setShowForm(true)} style={{ position:"absolute", right:16, bottom:24, backgroundColor:"#111827", paddingHorizontal:16, paddingVertical:14, borderRadius:999 }}>
          <Text style={{ color:"#fff", fontWeight:"700" }}>+ New Bulletin</Text>
        </Pressable>
      )}

      <Modal visible={showForm} animationType="slide" transparent>
        <View style={{ flex:1, backgroundColor:"rgba(0,0,0,0.3)", justifyContent:"flex-end" }}>
          <View style={{ backgroundColor:"#fff", padding:16, borderTopLeftRadius:16, borderTopRightRadius:16 }}>
            <Text style={{ fontSize:18, fontWeight:"700", marginBottom:8 }}>Create bulletin</Text>
            <TextInput placeholder="Title" value={title} onChangeText={setTitle}
              style={{ borderWidth:1, borderColor:"#e5e7eb", borderRadius:8, padding:10, marginBottom:8 }} />
            <TextInput placeholder="Body (optional)" value={body} onChangeText={setBody} multiline
              style={{ borderWidth:1, borderColor:"#e5e7eb", borderRadius:8, padding:10, minHeight:80, textAlignVertical:"top" }} />
            <View style={{ flexDirection:"row", justifyContent:"flex-end", gap:8, marginTop:12 }}>
              <Button title="Cancel" onPress={()=>setShowForm(false)} />
              <Button title="Create" onPress={createBulletin} />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

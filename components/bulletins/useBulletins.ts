import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";
import { Alert } from "react-native";

type Role = "resident" | "admin" | null;

export type Bulletin = {
  id: string;
  title: string;
  body: string | null;
  pinned: boolean;
  created_at: string;
};

export function useBulletins() {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [role, setRole] = useState<Role>(null);

  const [bulletins, setBulletins] = useState<Bulletin[]>([]);
  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  const isAdmin = role === "admin";

  const userLabel = userEmail
    ? `Logged in as ${userEmail}${role ? ` (${role})` : ""}`
    : "Not logged in";

  const loadBulletins = async () => {
    const { data, error } = await supabase
      .from("bulletins")
      .select("id,title,body,pinned,created_at")
      .order("pinned", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) console.log(error);
    setBulletins((data as Bulletin[]) || []);
  };

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserEmail(user?.email ?? null);

      if (!user) {
        setLoading(false);
        return;
      }

      const { data: prof, error: pErr } = await supabase
        .from("profiles")
        .select("id, role")
        .eq("auth_uid", user.id)
        .single();

      if (pErr) {
        console.log(pErr);
        setLoading(false);
        return;
      }

      setProfileId(prof.id);
      setRole(prof.role as Role);

      await loadBulletins();
      setLoading(false);
    })();
  }, []);

  const openForm = () => setShowForm(true);
  const closeForm = () => setShowForm(false);

  const createBulletin = async () => {
    if (!profileId) return;
    if (!title.trim()) {
      Alert.alert("Title required");
      return;
    }

    const { error } = await supabase.from("bulletins").insert([
      {
        title: title.trim(),
        body: body.trim() || null,
        pinned: false,
        created_by: profileId,
      },
    ]);

    if (error) {
      Alert.alert("Error", error.message);
      return;
    }

    await loadBulletins();
    setShowForm(false);
    setTitle("");
    setBody("");
  };

  // ✅ Admin pin/unpin
  const togglePin = async (id: string, nextPinned: boolean) => {
    if (!isAdmin) return;

    const { error } = await supabase
      .from("bulletins")
      .update({ pinned: nextPinned })
      .eq("id", id);

    if (error) {
      Alert.alert("Error", error.message);
      return;
    }

    // optimistic UI update
    setBulletins((prev) =>
      prev
        .map((b) => (b.id === id ? { ...b, pinned: nextPinned } : b))
        .sort((a, b) => Number(b.pinned) - Number(a.pinned) || +new Date(b.created_at) - +new Date(a.created_at))
    );
  };

  return {
    bulletins,
    loading,
    isAdmin,
    userLabel,

    showForm,
    title,
    body,
    setTitle,
    setBody,
    openForm,
    closeForm,
    createBulletin,

    togglePin,
    reload: loadBulletins,
  };
}

import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";
import { Alert } from "react-native";

type Role = "resident" | "admin" | null;

export type Bulletin = {
  id: string;
  title: string;
  body_html: string | null;
  pinned: boolean;
  created_at: string;
};

export function useBulletins() {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [role, setRole] = useState<Role>(null);

  const [bulletins, setBulletins] = useState<Bulletin[]>([]);
  const [loading, setLoading] = useState(true);

  const isAdmin = role === "admin";

  const userLabel = userEmail
    ? `Logged in as ${userEmail}${role ? ` (${role})` : ""}`
    : "Not logged in";

  const loadBulletins = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("bulletins")
      .select("id,title,body_html,pinned,created_at")
      .order("pinned", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) console.log(error);

    setBulletins((data as Bulletin[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    const channel = supabase
      .channel("bulletins_changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "bulletins" }, () => {
        loadBulletins();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadBulletins]);

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
        .select("role")
        .eq("auth_uid", user.id)
        .single();

      if (pErr) {
        console.log(pErr);
        setLoading(false);
        return;
      }

      setRole(prof.role as Role);

      await loadBulletins();
      setLoading(false);
    })();
  }, []);

  const togglePin = async (id: string, nextPinned: boolean) => {
    if (!isAdmin) return;

    const { error } = await supabase
      .from("bulletins")
      .update({ pinned: nextPinned })
      .eq("id", id);

    if (error) return Alert.alert("Error", error.message);

    setBulletins((prev) =>
      prev
        .map((b) => (b.id === id ? { ...b, pinned: nextPinned } : b))
        .sort(
          (a, b) =>
            Number(b.pinned) - Number(a.pinned) ||
            +new Date(b.created_at) - +new Date(a.created_at)
        )
    );
  };

  return {
    bulletins,
    loading,
    isAdmin,
    userLabel,
    togglePin,
    reload: loadBulletins,
  };
}

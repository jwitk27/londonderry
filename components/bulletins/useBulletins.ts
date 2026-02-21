import { supabase } from "@/lib/supabase";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert } from "react-native";

type Role = "resident" | "admin" | null;

export type Bulletin = {
  id: string;
  title: string;
  pinned: boolean;
  created_at: string;
};

export function useBulletins() {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [role, setRole] = useState<Role>(null);

  const [bulletins, setBulletins] = useState<Bulletin[]>([]);
  const [loading, setLoading] = useState(true);

  const isAdmin = role === "admin";

  const userLabel = useMemo(() => {
    return userEmail
      ? `Logged in as ${userEmail}${role ? ` (${role})` : ""}`
      : "Not logged in";
  }, [userEmail, role]);

  const loadBulletins = useCallback(async () => {
    const { data, error } = await supabase
      .from("bulletins")
      .select("id,title,pinned,created_at")
      .order("pinned", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) {
      console.log(error);
      return;
    }

    setBulletins((data as Bulletin[]) || []);
  }, []);

  // realtime subscription (IMPORTANT: loadBulletins must be stable via useCallback)
  useEffect(() => {
    const channel = supabase
      .channel("bulletins_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "bulletins" },
        () => {
          loadBulletins();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadBulletins]);

  // initial load + role lookup
  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (cancelled) return;

      setUserEmail(user?.email ?? null);

      // Everyone can read bulletins (your policy shows anon+authed), so load either way
      await loadBulletins();

      if (!user) {
        setRole(null);
        setLoading(false);
        return;
      }

      const { data: prof, error: pErr } = await supabase
        .from("profiles")
        .select("role")
        .eq("auth_uid", user.id)
        .single();

      if (!cancelled) {
        if (pErr) {
          console.log(pErr);
          setRole(null);
        } else {
          setRole((prof?.role as Role) ?? null);
        }
        setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [loadBulletins]);

  const togglePin = useCallback(
    async (id: string, nextPinned: boolean) => {
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
    },
    [isAdmin]
  );

  return {
    bulletins,
    loading,
    isAdmin,
    userLabel,
    togglePin,
    reload: loadBulletins,
  };
}

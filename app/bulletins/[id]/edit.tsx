import PageHeader from "@/components/ui/PageHeader";
import { supabase } from "@/lib/supabase";
import { RichText, TenTapStartKit, useEditorBridge } from "@10play/tentap-editor";
import * as ImagePicker from "expo-image-picker";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Keyboard,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";

const BUCKET = "assets";
const IMG_PREFIX = "bulletins/";

type PendingImg = { id: string; contentType: string; ext: string; base64: string };
type Bulletin = { id: string; title: string; body_html: string | null };

function getBulletinImagePaths(html: string | null) {
  if (!html) return [];
  const matches = html.match(/<img[^>]+src="([^"]+)"/g) || [];
  const paths: string[] = [];
  for (const m of matches) {
    const src = m.match(/src="([^"]+)"/)?.[1];
    if (!src) continue;
    const marker = `/storage/v1/object/public/${BUCKET}/`;
    const idx = src.indexOf(marker);
    if (idx === -1) continue;
    const path = src.slice(idx + marker.length);
    if (path.startsWith(IMG_PREFIX)) paths.push(path);
  }
  return Array.from(new Set(paths));
}

export default function EditBulletin() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [initialHtml, setInitialHtml] = useState("<p></p>");
  const [editorKey, setEditorKey] = useState(0);

  const [pending, setPending] = useState<PendingImg[]>([]);
  const pendingRef = useRef<PendingImg[]>([]);
  pendingRef.current = pending;

  const [kbHeight, setKbHeight] = useState(0);

  const editor = useEditorBridge({
    autofocus: false,
    avoidIosKeyboard: true,
    initialContent: initialHtml,
    bridgeExtensions: TenTapStartKit,
  });

  useEffect(() => {
    const s = Keyboard.addListener("keyboardDidShow", (e) => {
      setKbHeight(e?.endCoordinates?.height ?? 260);
    });
    const h = Keyboard.addListener("keyboardDidHide", () => setKbHeight(0));
    return () => {
      s.remove();
      h.remove();
    };
  }, []);

  const dismissAll = () => {
    editor?.blur?.();
    Keyboard.dismiss();
  };

  const active = useMemo(() => {
    const s = editor?.getEditorState?.();
    return {
      bold: !!s?.isBoldActive,
      italic: !!s?.isItalicActive,
      ul: !!s?.isBulletListActive,
      ol: !!s?.isOrderedListActive,
    };
  }, [editor]);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    (async () => {
      setLoading(true);

      const { data, error } = await supabase
        .from("bulletins")
        .select("id,title,body_html")
        .eq("id", id)
        .single();

      if (cancelled) return;

      if (error) {
        Alert.alert("Error", error.message);
        setLoading(false);
        return;
      }

      const b = data as Bulletin;
      setTitle(b.title || "");
      setInitialHtml(b.body_html || "<p></p>");
      setEditorKey((k) => k + 1);

      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [id]);

  const base64ToUint8 = (b64: string) => {
    const bin = atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return bytes;
  };

  const uploadImage = async (p: PendingImg) => {
    const objectPath = `${IMG_PREFIX}${Date.now()}_${p.id}.${p.ext}`;
    const bytes = base64ToUint8(p.base64);

    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(objectPath, bytes, { contentType: p.contentType, upsert: false });

    if (error) throw new Error(error.message);

    return supabase.storage.from(BUCKET).getPublicUrl(objectPath).data.publicUrl;
  };

  const swapImageSrcs = (html: string, idToUrl: Record<string, string>) =>
    html.replace(/<img([^>]*?)data-local-id="([^"]+)"([^>]*?)>/g, (full, a, imgId, b) => {
      const url = idToUrl[imgId];
      if (!url) return full;
      let tag = `<img${a}${b}>`;
      tag = tag.replace(/\sdata-local-id="[^"]+"/, "");
      if (tag.includes('src="')) return tag.replace(/src="[^"]*"/, `src="${url}"`);
      return tag.replace("<img", `<img src="${url}"`);
    });

  const pickImage = async () => {
    if (!editor?.insertContent) return Alert.alert("Editor not ready yet");

    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return Alert.alert("Permission needed");

    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      base64: true,
    });
    if (res.canceled) return;

    const asset = res.assets?.[0];
    if (!asset?.base64) return Alert.alert("Image error", "No preview data returned.");

    const uri = asset.uri || "";
    const ext = (uri.split(".").pop() || "jpg").toLowerCase();
    const contentType = asset.mimeType || `image/${ext === "jpg" ? "jpeg" : ext}`;
    const localId = `img_${Date.now()}_${Math.random().toString(16).slice(2)}`;

    setPending((p) => [...p, { id: localId, ext, contentType, base64: asset.base64! }]);

    const dataUrl = `data:${contentType};base64,${asset.base64}`;
    editor.focus?.();
    editor.insertContent?.(
      `<img data-local-id="${localId}" src="${dataUrl}" style="max-width:100%;height:auto;" />`
    );
  };

  const requireAdmin = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { ok: false, msg: "Not logged in" as const };

    const { data: prof, error: pErr } = await supabase
      .from("profiles")
      .select("role")
      .eq("auth_uid", user.id)
      .single();

    if (pErr) return { ok: false, msg: pErr.message as const };
    if (prof?.role !== "admin") return { ok: false, msg: "Admins only" as const };
    return { ok: true as const };
  };

  const save = async () => {
    if (!id) return;
    if (!title.trim()) return Alert.alert("Title required");

    const gate = await requireAdmin();
    if (!gate.ok) return Alert.alert("Error", gate.msg);

    let body_html = await editor.getHTML();

    try {
      const idToUrl: Record<string, string> = {};
      for (const img of pendingRef.current) idToUrl[img.id] = await uploadImage(img);
      body_html = swapImageSrcs(body_html, idToUrl);
    } catch (e: any) {
      return Alert.alert("Image upload failed", e?.message || "Unknown error");
    }

    const { error } = await supabase
      .from("bulletins")
      .update({ title: title.trim(), body_html })
      .eq("id", id);

    if (error) return Alert.alert("Error", error.message);

    setPending([]);
    dismissAll();
    router.back();
  };

  const doDelete = async () => {
    if (!id) return;

    const gate = await requireAdmin();
    if (!gate.ok) return Alert.alert("Error", gate.msg);

    const { data, error } = await supabase
      .from("bulletins")
      .select("body_html")
      .eq("id", id)
      .single();

    if (error) return Alert.alert("Error", error.message);

    const paths = getBulletinImagePaths(data?.body_html ?? null);
    if (paths.length) {
      const { error: sErr } = await supabase.storage.from(BUCKET).remove(paths);
      if (sErr) return Alert.alert("Error", sErr.message);
    }

    const { error: dErr } = await supabase.from("bulletins").delete().eq("id", id);
    if (dErr) return Alert.alert("Delete failed", dErr.message);

    dismissAll();
    router.back();
  };

  const confirmDelete = () => {
    dismissAll();
    Alert.alert("Delete bulletin?", "This will permanently delete the bulletin and its images.", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: doDelete },
    ]);
  };

  if (loading) return <ActivityIndicator style={{ marginTop: 40 }} />;

  return (
    <View style={styles.page}>
      <PageHeader title="Edit Bulletin" />

      <Text style={styles.label}>Title</Text>
      <TextInput
        value={title}
        onChangeText={setTitle}
        placeholder="Title"
        style={styles.input}
        returnKeyType="done"
        onSubmitEditing={dismissAll}
      />

      <Text style={styles.label}>Body</Text>

      <View style={styles.toolbar}>
        <ToolBtn label="b" active={active.bold} onPress={() => { editor.focus?.(); editor.toggleBold?.(); }} />
        <ToolBtn label="i" active={active.italic} labelStyle={{ fontStyle: "italic" }} onPress={() => { editor.focus?.(); editor.toggleItalic?.(); }} />
        <ToolBtn label="• List" active={active.ul} onPress={() => { editor.focus?.(); editor.toggleBulletList?.(); }} />
        <ToolBtn label="1. List" active={active.ol} onPress={() => { editor.focus?.(); editor.toggleOrderedList?.(); }} />
        <ToolBtn label="Img" onPress={pickImage} />
      </View>

      <View style={styles.editorWrap}>
        <RichText key={editorKey} editor={editor} />
      </View>

      <View style={styles.actions}>
        <Pressable onPress={() => { dismissAll(); router.back(); }} style={[styles.actionBtn, styles.actionGhost]}>
          <Text style={styles.actionGhostText}>Cancel</Text>
        </Pressable>

        <Pressable onPress={confirmDelete} style={[styles.actionBtn, styles.actionDanger]}>
          <Text style={styles.actionDangerText}>Delete</Text>
        </Pressable>

        <Pressable onPress={save} style={[styles.actionBtn, styles.actionPrimary]}>
          <Text style={styles.actionPrimaryText}>Save</Text>
        </Pressable>
      </View>

      {kbHeight > 0 ? (
        <View style={[styles.floatingDoneWrap, { bottom: kbHeight + 12 }]} pointerEvents="box-none">
          <Pressable onPress={dismissAll} style={styles.floatingDone}>
            <Text style={styles.floatingDoneText}>Done</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

function ToolBtn({
  label,
  onPress,
  active,
  labelStyle,
}: {
  label: string;
  onPress: () => void;
  active?: boolean;
  labelStyle?: any;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.toolBtn, active ? styles.toolBtnActive : undefined]}>
      <Text style={[styles.toolText, active ? styles.toolTextActive : undefined, labelStyle]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, padding: 16, paddingTop: 60 },

  label: { fontWeight: "800", marginTop: 12, marginBottom: 6, color: "#111827" },
  input: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#fff",
  },

  toolbar: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 10 },
  toolBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: "#e5e7eb", backgroundColor: "#fff" },
  toolBtnActive: { backgroundColor: "#111827", borderColor: "#111827" },
  toolText: { fontWeight: "800", color: "#111827" },
  toolTextActive: { color: "#fff" },

  editorWrap: { flex: 1, borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 12, padding: 10, backgroundColor: "#fff" },

  actions: { flexDirection: "row", justifyContent: "space-between", gap: 10, marginTop: 12 },
  actionBtn: { paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12, flex: 1, alignItems: "center" },
  actionGhost: { borderWidth: 1, borderColor: "#e5e7eb", backgroundColor: "#fff" },
  actionGhostText: { fontWeight: "800", color: "#111827" },
  actionPrimary: { backgroundColor: "#111827" },
  actionPrimaryText: { fontWeight: "900", color: "#fff" },
  actionDanger: { backgroundColor: "#b91c1c" },
  actionDangerText: { fontWeight: "900", color: "#fff" },

  floatingDoneWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    alignItems: "flex-end",
  },
  floatingDone: {
    backgroundColor: "#111827",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  floatingDoneText: { color: "#fff", fontWeight: "900", fontSize: 16 },
});

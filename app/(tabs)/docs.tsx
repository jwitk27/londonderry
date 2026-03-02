// app/(tabs)/docs.tsx
import PageHeader from "@/components/ui/PageHeader";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as DocumentPicker from "expo-document-picker";
import { useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Button,
    FlatList,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import { WebView } from "react-native-webview";
import { supabase } from "../../lib/supabase";

type Doc = {
  id: string;
  title: string;
  file_name: string | null;
  path: string;
  created_at: string;
  category: string | null;
  subcategory: string | null;
};

const BUCKET = "docs";
const DOCS_PASS = "TredAvon2026";
const PASS_KEY = "docs_unlocked_v1";

const UNCATEGORIZED = "Uncategorized";
const NO_SUBCATEGORY = "None";

const CATEGORIES = [
  "Protected Documents",
  "Priority List",
  "Policies",
  "Safety",
  "IT",
  "Forms",
  "Training",
];

const CATEGORY_TREE: Record<string, string[]> = {
  "Priority List": [
    NO_SUBCATEGORY,
    "Priority List Agreement",
    "Priority List Packet",
    "Return Priority List Deposit",
  ],
  Policies: [NO_SUBCATEGORY, "HR", "Finance", "General"],
  Safety: [NO_SUBCATEGORY, "General"],
  IT: [NO_SUBCATEGORY, "General"],
  Forms: [NO_SUBCATEGORY, "General"],
  Training: [NO_SUBCATEGORY, "General"],
  "Protected Documents": [NO_SUBCATEGORY, "General"],
};

export default function DocumentsScreen() {
  const [docs, setDocs] = useState<Doc[]>([]);
  const [uid, setUid] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const [loadingDocs, setLoadingDocs] = useState(true);
  const [uploading, setUploading] = useState(false);

  const [unlocked, setUnlocked] = useState(false);
  const [pass, setPass] = useState("");

  const [openUrl, setOpenUrl] = useState<string | null>(null);
  const [webLoading, setWebLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [pendingUpload, setPendingUpload] = useState<{
    uri: string;
    fileName: string;
  } | null>(null);

  const [docTitle, setDocTitle] = useState("");

  const [selectedCategory, setSelectedCategory] = useState<string>(
    CATEGORIES[0] || "General",
  );
  const [selectedSubcategory, setSelectedSubcategory] =
    useState<string>(NO_SUBCATEGORY);
  const [step, setStep] = useState<"title" | "category" | "subcategory">(
    "title",
  );

  useEffect(() => {
    (async () => {
      const v = await AsyncStorage.getItem(PASS_KEY);
      if (v === "1") setUnlocked(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      setUid(user?.id ?? null);

      if (user?.id) {
        const { data } = await supabase
          .from("profiles")
          .select("role")
          .eq("auth_uid", user.id)
          .maybeSingle();

        setIsAdmin(data?.role === "super");
      }

      await refresh();
    })();
  }, []);

  const refresh = async () => {
    setLoadingDocs(true);

    const { data, error } = await supabase
      .from("documents")
      .select("id,title,file_name,path,created_at,category,subcategory")
      .order("created_at", { ascending: false });

    setLoadingDocs(false);

    if (error) {
      Alert.alert("Load error", error.message);
      setDocs([]);
      return;
    }

    setDocs((data as Doc[]) || []);
  };

  const groupByCategorySubcategory = (list: Doc[]) => {
    const catMap = new Map<string, Map<string, Doc[]>>();

    for (const d of list) {
      const cat = (d.category || "").trim() || UNCATEGORIZED;

      const rawSub = (d.subcategory || "").trim();
      const sub = rawSub ? rawSub : NO_SUBCATEGORY;

      if (!catMap.has(cat)) catMap.set(cat, new Map());
      const subMap = catMap.get(cat)!;

      subMap.set(sub, [...(subMap.get(sub) || []), d]);
    }

    const known = CATEGORIES.filter((c) => catMap.has(c));
    const other = [...catMap.keys()].filter(
      (k) => !CATEGORIES.includes(k) && k !== UNCATEGORIZED,
    );
    const orderedCats = [
      ...known,
      ...other.sort((a, b) => a.localeCompare(b)),
      ...(catMap.has(UNCATEGORIZED) ? [UNCATEGORIZED] : []),
    ];

    const orderSubs = (category: string, subs: string[]) => {
      const hasNone = subs.includes(NO_SUBCATEGORY);
      const rest = subs
        .filter((s) => s !== NO_SUBCATEGORY)
        .sort((a, b) => a.localeCompare(b));

      const preferred = (CATEGORY_TREE[category] || [])
        .filter((s) => s !== NO_SUBCATEGORY && rest.includes(s));
      const remaining = rest.filter((s) => !preferred.includes(s));

      return [...(hasNone ? [NO_SUBCATEGORY] : []), ...preferred, ...remaining];
    };

    return orderedCats.map((category) => {
      const subMap = catMap.get(category)!;
      const subs = [...subMap.keys()];
      const orderedSubs = orderSubs(category, subs);

      return {
        category,
        subgroups: orderedSubs.map((subcategory) => ({
          subcategory,
          docs: subMap.get(subcategory) || [],
        })),
      };
    });
  };

  const grouped = useMemo(() => groupByCategorySubcategory(docs), [docs]);

  const startUploadFlow = async () => {
    if (!uid) return Alert.alert("Not logged in");
    if (!isAdmin) return Alert.alert("Admins only");
    if (uploading) return;

    const pick = await DocumentPicker.getDocumentAsync({
      copyToCacheDirectory: true,
      type: ["application/pdf"],
    });

    if (pick.canceled || !pick.assets?.length) return;

    const f = pick.assets[0];
    const fileName = f.name || `document-${Date.now()}.pdf`;
    if (!fileName.toLowerCase().endsWith(".pdf")) {
      return Alert.alert("PDF only", "Please select a .pdf file.");
    }

    setPendingUpload({ uri: f.uri, fileName });

    const firstCat = CATEGORIES[0] || "General";
    setSelectedCategory(firstCat);
    const subs = CATEGORY_TREE[firstCat] || [NO_SUBCATEGORY];
    setSelectedSubcategory(subs[0] || NO_SUBCATEGORY);

    setDocTitle(fileName.replace(/\.pdf$/i, ""));
    setStep("title");
    setModalOpen(true);
  };

  const doUploadPdf = async (category: string, subcategory: string) => {
    if (!uid) return Alert.alert("Not logged in");
    if (!isAdmin) return Alert.alert("Admins only");
    if (!pendingUpload) return;
    if (uploading) return;

    const title = docTitle.trim();
    if (!title) return Alert.alert("Title required", "Enter a document title.");

    const { uri, fileName } = pendingUpload;
    const key = `${Date.now()}-${fileName}`;

    try {
      setUploading(true);

      const res = await fetch(uri);
      const arrayBuffer = await res.arrayBuffer();

      const up = await supabase.storage.from(BUCKET).upload(key, arrayBuffer, {
        contentType: "application/pdf",
        upsert: false,
      });
      if (up.error) throw up.error;

      const ins = await supabase.from("documents").insert([
        {
          title,
          file_name: fileName,
          path: key,
          owner_auth_uid: uid,
          category,
          subcategory: subcategory === NO_SUBCATEGORY ? null : subcategory,
        },
      ]);
      if (ins.error) throw ins.error;

      Alert.alert("Uploaded", title);
      setPendingUpload(null);
      setModalOpen(false);
      setStep("title");
      await refresh();
    } catch (e: any) {
      Alert.alert("Upload failed", e?.message || String(e));
    } finally {
      setUploading(false);
    }
  };

  const openDoc = async (path: string) => {
    setWebLoading(true);

    const { data, error } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(path, 600);

    if (error || !data?.signedUrl) {
      return Alert.alert("Open failed", error?.message || "No URL");
    }

    const viewerUrl = `https://drive.google.com/viewerng/viewer?embedded=true&url=${encodeURIComponent(
      data.signedUrl,
    )}`;

    setOpenUrl(viewerUrl);
  };

  const closeDoc = () => setOpenUrl(null);

  const deleteDoc = (doc: Doc) => {
    if (!isAdmin) return;

    Alert.alert("Delete document?", doc.title, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          const rm = await supabase.storage.from(BUCKET).remove([doc.path]);
          if (rm.error)
            return Alert.alert("Storage delete failed", rm.error.message);

          const del = await supabase.from("documents").delete().eq("id", doc.id);
          if (del.error)
            return Alert.alert("Row delete failed", del.error.message);

          await refresh();
        },
      },
    ]);
  };

  if (!unlocked) {
    return (
      <View style={styles.screen}>
        <PageHeader title="Documents" />

        <Text style={{ marginTop: 12, fontWeight: "800" }}>Enter password</Text>

        <TextInput
          value={pass}
          onChangeText={setPass}
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
          placeholder="Password"
          style={styles.passInput}
        />

        <View style={{ marginTop: 12 }}>
          <Button
            title="Unlock"
            onPress={async () => {
              if (pass === DOCS_PASS) {
                setUnlocked(true);
                await AsyncStorage.setItem(PASS_KEY, "1");
              } else {
                Alert.alert("Wrong password");
              }
            }}
          />
        </View>
      </View>
    );
  }

  const DocRow = ({ item }: { item: Doc }) => (
    <View style={styles.rowWrap}>
      <Pressable onPress={() => openDoc(item.path)} style={styles.row}>
        <Text style={styles.rowTitle} numberOfLines={2}>
          {item.title}
        </Text>
      </Pressable>

      {isAdmin && (
        <Pressable
          onPress={() => deleteDoc(item)}
          hitSlop={12}
          style={styles.deleteBtn}
        >
          <Text style={styles.deleteText}>Delete</Text>
        </Pressable>
      )}
    </View>
  );

  const CategorySection = ({
    groups,
  }: {
    groups: {
      category: string;
      subgroups: { subcategory: string; docs: Doc[] }[];
    }[];
  }) => (
    <View>
      {groups.map((g) => {
        const hasAny = g.subgroups.some((sg) => sg.docs.length);
        if (!hasAny) return null;

        return (
          <View key={g.category} style={{ marginBottom: 16 }}>
            <Text style={styles.categoryTitle}>{g.category}</Text>

            {g.subgroups.map((sg) => {
              if (!sg.docs.length) return null;

              const showSub =
                sg.subcategory && sg.subcategory !== NO_SUBCATEGORY;

              const wrapStyle = showSub
                ? { marginBottom: 12, marginLeft: 12 }
                : { marginBottom: 12 };

              return (
                <View key={`${g.category}__${sg.subcategory}`} style={wrapStyle}>
                  {showSub && (
                    <Text style={styles.subcategoryTitle}>{sg.subcategory}</Text>
                  )}

                  <FlatList
                    data={sg.docs}
                    keyExtractor={(d) => d.id}
                    renderItem={({ item }) => <DocRow item={item} />}
                    ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
                    scrollEnabled={false}
                  />
                </View>
              );
            })}
          </View>
        );
      })}
    </View>
  );

  const subsForSelected = CATEGORY_TREE[selectedCategory] || [NO_SUBCATEGORY];

  return (
    <View style={styles.screen}>
      <PageHeader title="Documents" />

      {isAdmin && (
        <View style={{ marginTop: 10 }}>
          <Button
            title={uploading ? "Uploading..." : "Upload PDF"}
            onPress={startUploadFlow}
            disabled={uploading}
          />
        </View>
      )}

      {loadingDocs ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" />
          <Text style={styles.muted}>Loading…</Text>
        </View>
      ) : (
        <ScrollView
          style={{ marginTop: 14 }}
          contentContainerStyle={{ paddingBottom: 24 }}
        >
          {docs.length === 0 ? (
            <Text style={styles.empty}>No documents yet.</Text>
          ) : (
            <CategorySection groups={grouped} />
          )}
        </ScrollView>
      )}

      <Modal
        visible={modalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setModalOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.categoryModal}>
            <Text style={styles.modalH}>
              {step === "title"
                ? "Document title"
                : step === "category"
                  ? "Select category"
                  : "Select subcategory"}
            </Text>

            {step === "title" ? (
              <>
                <TextInput
                  value={docTitle}
                  onChangeText={setDocTitle}
                  placeholder="Enter title"
                  style={styles.titleInput}
                />
                <Text style={styles.smallNote}>
                  This is what users will see (not the filename).
                </Text>
              </>
            ) : (
              <ScrollView style={{ maxHeight: 320 }}>
                {step === "category" ? (
                  CATEGORIES.map((c) => {
                    const active = c === selectedCategory;
                    return (
                      <Pressable
                        key={c}
                        onPress={() => {
                          setSelectedCategory(c);
                          const subs = CATEGORY_TREE[c] || [NO_SUBCATEGORY];
                          setSelectedSubcategory(subs[0] || NO_SUBCATEGORY);
                        }}
                        style={[styles.catRow, active && styles.catRowActive]}
                      >
                        <Text
                          style={[styles.catText, active && styles.catTextActive]}
                        >
                          {c}
                        </Text>
                      </Pressable>
                    );
                  })
                ) : (
                  subsForSelected.map((s) => {
                    const active = s === selectedSubcategory;
                    return (
                      <Pressable
                        key={s}
                        onPress={() => setSelectedSubcategory(s)}
                        style={[styles.catRow, active && styles.catRowActive]}
                      >
                        <Text
                          style={[styles.catText, active && styles.catTextActive]}
                        >
                          {s}
                        </Text>
                      </Pressable>
                    );
                  })
                )}
              </ScrollView>
            )}

            <View style={{ height: 10 }} />

            <View style={{ flexDirection: "row", gap: 10 }}>
              <View style={{ flex: 1 }}>
                <Button
                  title={step === "title" ? "Cancel" : "Back"}
                  onPress={() => {
                    if (step === "subcategory") return setStep("category");
                    if (step === "category") return setStep("title");

                    setPendingUpload(null);
                    setModalOpen(false);
                    setStep("title");
                  }}
                  disabled={uploading}
                />
              </View>

              <View style={{ flex: 1 }}>
                <Button
                  title={
                    uploading
                      ? "Uploading..."
                      : step === "title"
                        ? "Continue"
                        : step === "category"
                          ? "Continue"
                          : "Upload"
                  }
                  onPress={() => {
                    if (!pendingUpload) return;

                    if (step === "title") {
                      if (!docTitle.trim()) {
                        return Alert.alert(
                          "Title required",
                          "Enter a document title.",
                        );
                      }
                      setStep("category");
                      return;
                    }

                    if (step === "category") {
                      setStep("subcategory");
                      return;
                    }

                    doUploadPdf(selectedCategory, selectedSubcategory);
                  }}
                  disabled={uploading || !pendingUpload}
                />
              </View>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={!!openUrl} animationType="slide" onRequestClose={closeDoc}>
        <View style={styles.modalHeader}>
          <Pressable onPress={closeDoc} style={styles.closeBtn}>
            <Text style={styles.closeText}>Close</Text>
          </Pressable>
          <Text style={styles.modalTitle} numberOfLines={1}>
            Document
          </Text>
          <View style={{ width: 64 }} />
        </View>

        {webLoading && (
          <View style={styles.webLoading}>
            <ActivityIndicator size="large" />
            <Text style={styles.muted}>Loading…</Text>
          </View>
        )}

        {!!openUrl && (
          <View style={{ flex: 1, paddingBottom: Platform.OS === "ios" ? 30 : 0 }}>
            <WebView
              source={{ uri: openUrl }}
              onLoadStart={() => setWebLoading(true)}
              onLoadEnd={() => setWebLoading(false)}
              style={{ flex: 1 }}
            />
          </View>
        )}

        {/* FOOTER */}
  <View style={styles.modalFooter}>
    <Text style={styles.footerText}>
    </Text>
  </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: 16 },
modalFooter: {
  paddingVertical: Platform.OS === "ios" ? 34 : 14,
  paddingHorizontal: 16,
  borderTopWidth: StyleSheet.hairlineWidth,
  alignItems: "center",
  justifyContent: "center",
  backgroundColor: "white",
},

footerText: {
  fontWeight: "600",
  opacity: 0.7,
},
  passInput: {
    marginTop: 10,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },

  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  muted: { opacity: 0.7, marginTop: 8 },
  empty: { color: "#6b7280", marginTop: 12 },

  categoryTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: "#374151",
    marginBottom: 8,
    marginTop: 2,
  },

  subcategoryTitle: {
    fontWeight: "800",
    marginBottom: 8,
    fontSize: 20,
    color: "#111827",
  },

  rowWrap: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },

  row: {
    flex: 1,
    backgroundColor: "#84a83a",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  rowTitle: { fontWeight: "900", color: "#fff", fontSize: 16 },

  deleteBtn: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    backgroundColor: "white",
    zIndex: 10,
  },
  deleteText: { fontWeight: "800" },

  modalHeader: {
    paddingTop: Platform.OS === "ios" ? 34 : 14, // +20 on iOS
    paddingBottom: 10,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  closeBtn: { padding: 8, width: 64 },
  closeText: { fontWeight: "700" },
  modalTitle: { fontWeight: "700", maxWidth: "60%" },

  webLoading: {
    position: "absolute",
    zIndex: 10,
    top: 64,
    left: 0,
    right: 0,
    paddingVertical: 16,
    alignItems: "center",
  },

  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  categoryModal: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: "white",
    borderRadius: 14,
    padding: 14,
  },
  modalH: { fontWeight: "900", fontSize: 16, marginBottom: 10 },

  titleInput: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontWeight: "700",
  },
  smallNote: { marginTop: 8, opacity: 0.7 },

  catRow: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    marginBottom: 10,
  },
  catRowActive: { borderColor: "#84a83a" },
  catText: { fontWeight: "800", color: "#111827" },
  catTextActive: { color: "#84a83a" },
});
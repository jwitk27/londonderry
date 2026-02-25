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
    path: string;
    created_at: string;
    is_priority: boolean;
};

const BUCKET = "docs"; // <-- your Storage bucket name
const DOCS_PASS = "TredAvon2026";
const PASS_KEY = "docs_unlocked_v1";

export default function DocumentsScreen() {
    const [docs, setDocs] = useState<Doc[]>([]);
    const [uid, setUid] = useState<string | null>(null);
    const [isAdmin, setIsAdmin] = useState(false);

    const [loadingDocs, setLoadingDocs] = useState(true);
    const [uploading, setUploading] = useState(false);

    // page lock
    const [unlocked, setUnlocked] = useState(false);
    const [pass, setPass] = useState("");

    // viewer
    const [openUrl, setOpenUrl] = useState<string | null>(null);
    const [webLoading, setWebLoading] = useState(true);

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
            .select("id,title,path,created_at,is_priority")
            .order("created_at", { ascending: false });

        setLoadingDocs(false);

        if (error) {
            Alert.alert("Load error", error.message);
            setDocs([]);
            return;
        }

        setDocs((data as Doc[]) || []);
    };

    const general = useMemo(() => docs.filter((d) => !d.is_priority), [docs]);
    const priority = useMemo(() => docs.filter((d) => d.is_priority), [docs]);

    const askPriority = () =>
        new Promise<boolean>((resolve) => {
            Alert.alert(
                "Priority document?",
                "Put this in the Priority list?",
                [
                    {
                        text: "No",
                        style: "cancel",
                        onPress: () => resolve(false),
                    },
                    { text: "Yes", onPress: () => resolve(true) },
                ],
            );
        });

    const uploadPdf = async () => {
        if (!uid) return Alert.alert("Not logged in");
        if (!isAdmin) return Alert.alert("Admins only");
        if (uploading) return;

        const pick = await DocumentPicker.getDocumentAsync({
            copyToCacheDirectory: true,
            type: ["application/pdf"],
        });

        if (pick.canceled || !pick.assets?.length) return;

        const f = pick.assets[0];
        const origName = f.name || `document-${Date.now()}.pdf`;
        if (!origName.toLowerCase().endsWith(".pdf")) {
            return Alert.alert("PDF only", "Please select a .pdf file.");
        }

        const is_priority = await askPriority();
        const key = `${Date.now()}-${origName}`; // bucket root

        try {
            setUploading(true);

            const res = await fetch(f.uri);
            const arrayBuffer = await res.arrayBuffer();

            const up = await supabase.storage
                .from(BUCKET)
                .upload(key, arrayBuffer, {
                    contentType: "application/pdf",
                    upsert: false,
                });
            if (up.error) throw up.error;

            const ins = await supabase.from("documents").insert([
                {
                    title: origName,
                    path: key,
                    owner_auth_uid: uid, // ok if column exists
                    is_priority,
                },
            ]);
            if (ins.error) throw ins.error;

            Alert.alert("Uploaded", origName);
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

        // inline viewer (prevents download behavior)
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
                    const rm = await supabase.storage
                        .from(BUCKET)
                        .remove([doc.path]);
                    if (rm.error)
                        return Alert.alert(
                            "Storage delete failed",
                            rm.error.message,
                        );

                    const del = await supabase
                        .from("documents")
                        .delete()
                        .eq("id", doc.id);
                    if (del.error)
                        return Alert.alert(
                            "Row delete failed",
                            del.error.message,
                        );

                    await refresh();
                },
            },
        ]);
    };

    // --------- LOCK SCREEN ----------
    if (!unlocked) {
        return (
            <View style={styles.screen}>
                <PageHeader title="Documents" />

                <Text style={{ marginTop: 12, fontWeight: "800" }}>
                    Enter password
                </Text>

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
                                await AsyncStorage.setItem(PASS_KEY, "1"); // stays unlocked on this device
                            } else {
                                Alert.alert("Wrong password");
                            }
                        }}
                    />
                </View>
            </View>
        );
    }

    const DocRow = ({
        item,
        priorityStyle,
    }: {
        item: Doc;
        priorityStyle?: boolean;
    }) => (
        <View style={styles.rowWrap}>
            <Pressable
                onPress={() => openDoc(item.path)}
                style={priorityStyle ? styles.rowPriority : styles.row}
            >
                <Text
                    style={
                        priorityStyle
                            ? styles.rowTitlePriority
                            : styles.rowTitle
                    }
                    numberOfLines={2}
                >
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

    return (
        <View style={styles.screen}>
            <PageHeader title="Documents" />

            {isAdmin && (
                <View style={{ marginTop: 10 }}>
                    <Button
                        title={uploading ? "Uploading..." : "Upload PDF"}
                        onPress={uploadPdf}
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
                    {/* NON-PRIORITY FIRST */}
                    {general.length === 0 ? (
                        <Text style={styles.empty}>No documents yet.</Text>
                    ) : (
                        <FlatList
                            data={general}
                            keyExtractor={(d) => d.id}
                            renderItem={({ item }) => <DocRow item={item} />}
                            ItemSeparatorComponent={() => (
                                <View style={{ height: 10 }} />
                            )}
                            scrollEnabled={false}
                        />
                    )}

                    {/* PRIORITY BELOW */}
                    {priority.length > 0 && (
                        <>
                            <View style={{ height: 18 }} />
                            <Text style={styles.priorityTitle}>
                                PRIORITY LIST
                            </Text>
                            <FlatList
                                data={priority}
                                keyExtractor={(d) => d.id}
                                renderItem={({ item }) => (
                                    <DocRow item={item} priorityStyle />
                                )}
                                ItemSeparatorComponent={() => (
                                    <View style={{ height: 10 }} />
                                )}
                                scrollEnabled={false}
                            />
                        </>
                    )}
                </ScrollView>
            )}

            <Modal
                visible={!!openUrl}
                animationType="slide"
                onRequestClose={closeDoc}
            >
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
                    <WebView
                        source={{ uri: openUrl }}
                        onLoadStart={() => setWebLoading(true)}
                        onLoadEnd={() => setWebLoading(false)}
                        style={{ flex: 1 }}
                    />
                )}
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    screen: { flex: 1, padding: 16 },

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

    priorityTitle: {
        color: "#5c7bbfff",
        fontWeight: "900",
        textDecorationLine: "underline",
        marginBottom: 10,
        fontSize: 20,
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

    // priority: blue text, no background
    rowPriority: {
        flex: 1,
        backgroundColor: "transparent",
        paddingVertical: 8,
        paddingHorizontal: 0,
    },
    rowTitlePriority: { color: "#5c7bbfff", fontWeight: "700", fontSize: 16 },

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
        paddingTop: 14,
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
});

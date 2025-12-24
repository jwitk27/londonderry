import { StyleSheet } from "react-native";

export const ui = {
  colors: {
    text: "#111827",
    muted: "#6b7280",
    border: "#cbd5e1",
    card: "#f1f5f9",
    pinnedCard: "#fce7f3",
    pinnedText: "#be123c",
    white: "#fff",
    fabBg: "#111827",
  },
  r: { card: 12, pill: 999, sheet: 16, input: 10 },
  s: { screen: 16, cardPad: 14, gap: 12 },
};

export const styles = StyleSheet.create({
  screen: { flex: 1, padding: ui.s.screen },

  headerTitle: { fontSize: 22, fontWeight: "800", color: ui.colors.text },
  headerSub: { marginTop: 4, color: ui.colors.muted },

  list: { marginTop: 12 },

  cardBase: {
    borderRadius: ui.r.card,
    padding: ui.s.cardPad,
    marginBottom: ui.s.gap,
    borderWidth: 1,
  },
  cardNormal: {
    backgroundColor: ui.colors.card,
    borderColor: ui.colors.border,
  },
  cardPinned: {
    backgroundColor: ui.colors.pinnedCard,
    borderColor: "rgba(0,0,0,0)",
  },

  topRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },

  important: { fontSize: 12, fontWeight: "800", color: ui.colors.pinnedText, marginBottom: 6 },

  title: { fontSize: 22, fontWeight: "900", color: ui.colors.text },
  date: { fontSize: 14, letterSpacing: 1, color: ui.colors.muted, fontWeight: "700" },

  body: { marginTop: 6, fontSize: 16, color: "#374151" },

  // admin pin button (top-right)
  pinBtn: {
    marginLeft: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: ui.r.pill,
    borderWidth: 1,
    borderColor: ui.colors.border,
    backgroundColor: "rgba(255,255,255,0.6)",
  },
  pinBtnText: { fontWeight: "800", color: ui.colors.text },

  fab: {
    position: "absolute",
    right: ui.s.screen,
    bottom: 24,
    backgroundColor: ui.colors.fabBg,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: ui.r.pill,
  },
  fabText: { color: ui.colors.white, fontWeight: "800" },

  // form sheet (same as before, kept minimal)
  modalWrap: { flex: 1, justifyContent: "flex-end" },
  sheet: {
    padding: ui.s.screen,
    borderTopLeftRadius: ui.r.sheet,
    borderTopRightRadius: ui.r.sheet,
    backgroundColor: "rgba(0,0,0,0.35)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  sheetTitle: { fontSize: 18, fontWeight: "800", marginBottom: 8, color: ui.colors.white },
  input: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.20)",
    borderRadius: ui.r.input,
    padding: 10,
    marginBottom: 8,
    backgroundColor: "rgba(255,255,255,0.12)",
    color: ui.colors.white,
  },
  inputMultiline: { minHeight: 90 },
  actions: { flexDirection: "row", justifyContent: "flex-end", gap: 8, marginTop: 12 },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  rightCol: {
    width: 110,           // fixed width = consistent placement
    alignItems: "flex-end",
    justifyContent: "flex-start",
    gap: 8,
  },
});

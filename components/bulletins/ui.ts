import { StyleSheet } from "react-native";

export const ui = {
  colors: {
    text: "#333",
    textMuted: "#1f1f1fff",
    border: "#414141ff",
    cardBg: "rgba(179, 179, 185, 0.31)",
    pinned: "#a31618ff",
    fabBg: "#111827",
    white: "#fff",
  },
  spacing: {
    screen: 16,
    card: 14,
    gap: 8,
  },
  radius: {
    card: 12,
    input: 8,
    sheet: 16,
    pill: 999,
  },
};

export const styles = StyleSheet.create({
  screen: {
    flex: 1,
    padding: ui.spacing.screen,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: ui.colors.text,
  },
  headerSub: {
    marginTop: 4,
    color: ui.colors.textMuted,
  },

  list: { marginTop: 12 },

  card: {
    padding: ui.spacing.card,
    borderRadius: ui.radius.card,
    borderWidth: 1,
    borderColor: ui.colors.border,
    backgroundColor: ui.colors.cardBg,
    marginBottom: ui.spacing.gap,
  },
  pinned: {
    fontSize: 12,
    fontWeight: "700",
    color: ui.colors.pinned,
    marginBottom: 6,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: ui.colors.text,
  },
  body: {
    marginTop: 6,
    color: ui.colors.text,
  },
  meta: {
    marginTop: 6,
    fontSize: 12,
    color: ui.colors.textMuted,
  },

  fab: {
    position: "absolute",
    right: ui.spacing.screen,
    bottom: 24,
    backgroundColor: ui.colors.fabBg,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: ui.radius.pill,
  },
  fabText: {
    color: ui.colors.white,
    fontWeight: "700",
  },

  modalWrap: {
    flex: 1,
    justifyContent: "flex-end",
  },
  sheet: {
    padding: ui.spacing.screen,
    borderTopLeftRadius: ui.radius.sheet,
    borderTopRightRadius: ui.radius.sheet,
    backgroundColor: "rgba(0,0,0,0.35)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
    color: ui.colors.white,
  },
  input: {
    borderWidth: 1,
    borderColor: ui.colors.border,
    borderRadius: ui.radius.input,
    padding: 10,
    marginBottom: 8,
    backgroundColor: "rgba(255,255,255,0.12)",
    color: ui.colors.white,
  },
  inputMultiline: {
    minHeight: 90,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
    marginTop: 12,
  },
});

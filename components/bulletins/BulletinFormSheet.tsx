import { Button, Modal, Text, TextInput, View } from "react-native";
import { styles, ui } from "./ui";

export default function BulletinFormSheet({
  visible,
  title,
  body,
  onChangeTitle,
  onChangeBody,
  onCancel,
  onCreate,
}: {
  visible: boolean;
  title: string;
  body: string;
  onChangeTitle: (v: string) => void;
  onChangeBody: (v: string) => void;
  onCancel: () => void;
  onCreate: () => void;
}) {
  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalWrap}>
        <View style={styles.sheet}>
          <Text style={styles.sheetTitle}>Create bulletin</Text>

          <TextInput
            placeholder="Title"
            placeholderTextColor={ui.colors.textMuted}
            value={title}
            onChangeText={onChangeTitle}
            style={styles.input}
          />

          <TextInput
            placeholder="Body (optional)"
            placeholderTextColor={ui.colors.textMuted}
            value={body}
            onChangeText={onChangeBody}
            multiline
            style={[styles.input, styles.inputMultiline]}
            textAlignVertical="top"
          />

          <View style={styles.actions}>
            <Button title="Cancel" onPress={onCancel} />
            <Button title="Create" onPress={onCreate} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

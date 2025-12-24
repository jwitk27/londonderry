import BulletinFab from "@/components/bulletins/BulletinFab";
import BulletinFormSheet from "@/components/bulletins/BulletinFormSheet";
import BulletinHeader from "@/components/bulletins/BulletinHeader";
import BulletinList from "@/components/bulletins/BulletinList";
import { styles } from "@/components/bulletins/ui";
import { useBulletins } from "@/components/bulletins/useBulletins";
import WeatherWidget from "@/components/weather/WeatherWidget";
import { View } from "react-native";

export default function HomeScreen() {
  const b = useBulletins();

  return (
    <View style={styles.screen}>
      <BulletinHeader title="HOME" sub={b.userLabel} />

      <BulletinList
        bulletins={b.bulletins}
        loading={b.loading}
        isAdmin={b.isAdmin}
        onTogglePin={b.togglePin}
        footer={<WeatherWidget />}
      />

      {b.isAdmin && <BulletinFab onPress={b.openForm} />}

      <BulletinFormSheet
        visible={b.showForm}
        title={b.title}
        body={b.body}
        onChangeTitle={b.setTitle}
        onChangeBody={b.setBody}
        onCancel={b.closeForm}
        onCreate={b.createBulletin}
      />
    </View>
  );
}

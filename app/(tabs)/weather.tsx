import PageHeader from "@/components/ui/PageHeader";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

// TODO: set your campus coords
const LAT = 38.769808887283496;
const LON = -76.08855332076789;

const wxMap: Record<number, { text: string; icon: any }> = {
  0: { text: "Clear", icon: "weather-sunny" },
  1: { text: "Mainly clear", icon: "weather-sunny" },
  2: { text: "Partly cloudy", icon: "weather-partly-cloudy" },
  3: { text: "Overcast", icon: "weather-cloudy" },
  45: { text: "Fog", icon: "weather-fog" },
  48: { text: "Rime fog", icon: "weather-fog" },
  51: { text: "Drizzle (light)", icon: "weather-rainy" },
  53: { text: "Drizzle", icon: "weather-rainy" },
  55: { text: "Drizzle (heavy)", icon: "weather-pouring" },
  61: { text: "Rain (light)", icon: "weather-rainy" },
  63: { text: "Rain", icon: "weather-rainy" },
  65: { text: "Rain (heavy)", icon: "weather-pouring" },
  71: { text: "Snow", icon: "weather-snowy" },
  75: { text: "Snow (heavy)", icon: "weather-snowy-heavy" },
  80: { text: "Showers", icon: "weather-pouring" },
  95: { text: "Thunderstorm", icon: "weather-lightning" },
  96: { text: "T-storm + hail", icon: "weather-hail" },
  99: { text: "T-storm + hail", icon: "weather-hail" },
};

const fmtHour = (iso: string) =>
  new Date(iso).toLocaleTimeString([], { hour: "numeric" });

const fmtDay = (iso: string) =>
  new Date(iso).toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" });

export default function WeatherScreen() {
  const [wx, setWx] = useState<any>(null);
  const [place, setPlace] = useState<string>("");
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const wUrl =
          `https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LON}` +
          `&current=temperature_2m,weather_code,wind_speed_10m,relative_humidity_2m` +
          `&hourly=temperature_2m,weather_code,precipitation_probability` +
          `&daily=temperature_2m_max,temperature_2m_min,weather_code,precipitation_probability_max` +
          `&temperature_unit=fahrenheit&windspeed_unit=mph&precipitation_unit=inch&timezone=auto`;

        const gUrl =
          `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${LAT}&longitude=${LON}&localityLanguage=en`;

        const [wRes, gRes] = await Promise.all([fetch(wUrl), fetch(gUrl)]);
        if (!wRes.ok) throw new Error(`Weather HTTP ${wRes.status}`);
        if (!gRes.ok) throw new Error(`Geocode HTTP ${gRes.status}`);

        const w = await wRes.json();
        const g = await gRes.json();

        const us = g.countryCode === "US";
        const town = g.locality || g.city || "";
        const st =
          (g.principalSubdivisionCode?.startsWith("US-")
            ? g.principalSubdivisionCode.replace("US-", "")
            : "") ||
          g.principalSubdivision ||
          "";
        const label = us
          ? [town, st].filter(Boolean).join(", ")
          : g.city || g.locality || g.countryName || "Unknown";

        setPlace(label || "Unknown");
        setWx(w);
      } catch (e: any) {
        setErr(e?.message || "Failed to fetch weather");
      }
    })();
  }, []);

  const next12 = useMemo(() => {
    if (!wx?.hourly) return [];
    const hourly = wx.hourly;
    return hourly.time.slice(0, 12).map((t: string, i: number) => ({
      t,
      temp: Math.round(hourly.temperature_2m[i]),
      code: hourly.weather_code[i],
      pop: hourly.precipitation_probability?.[i] ?? null,
    }));
  }, [wx]);

  if (err) {
    return (
      <View style={styles.container}>
        <View style={styles.card}>
          <Text style={styles.title}>Weather</Text>
          <Text style={styles.subText}>Weather error: {err}</Text>
        </View>
      </View>
    );
  }

  if (!wx) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  const cur = wx.current;
  const daily = wx.daily;

  const curMeta = wxMap[cur.weather_code] || { text: "—", icon: "weather-cloudy" };
  const hi = Math.round(daily.temperature_2m_max?.[0] ?? cur.temperature_2m);
  const lo = Math.round(daily.temperature_2m_min?.[0] ?? cur.temperature_2m);

  return (
      <View style={styles.container}>
        <PageHeader title="WEATHER" sub={place || ""} />
        {/* Current card */}
        <View style={styles.card}>
          <Text style={styles.place}>{place || "Location"}</Text>

          <View style={styles.currentRow}>
            <Text style={styles.temp}>{Math.round(cur.temperature_2m)}°</Text>

            <View style={styles.currentRight}>
              <MaterialCommunityIcons name={curMeta.icon} size={28} color="#111827" />
              <Text style={styles.curText}>{curMeta.text}</Text>
              <Text style={styles.hlText}>
                H:{hi}°  L:{lo}°
              </Text>
            </View>
          </View>

          <Text style={styles.subText}>
            Wind {Math.round(cur.wind_speed_10m)} mph · Humidity {cur.relative_humidity_2m}%
          </Text>
        </View>

        {/* Hourly */}
        <Text style={styles.sectionTitle}>Next 12 hours</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
          {next12.map((h) => {
            const meta = wxMap[h.code] || { text: "—", icon: "weather-cloudy" };
            return (
              <View key={h.t} style={styles.hourCard}>
                <Text style={styles.hourTime}>{fmtHour(h.t)}</Text>
                <MaterialCommunityIcons name={meta.icon} size={22} color="#111827" />
                <Text style={styles.hourTemp}>{h.temp}°</Text>
              </View>
            );
          })}
        </ScrollView>

        {/* 7-day */}
        <Text style={styles.sectionTitle}>7-day forecast</Text>
        <View style={styles.card}>
          <FlatList
            data={daily.time}
            keyExtractor={(d: string) => d}
            scrollEnabled={false}
            ItemSeparatorComponent={() => <View style={styles.sep} />}
            renderItem={({ item, index }) => {
              const meta = wxMap[daily.weather_code[index]] || { text: "—", icon: "weather-cloudy" };
              return (
                <View style={styles.dayRow}>
                  <Text style={styles.dayLeft}>{fmtDay(item)}</Text>

                  <View style={styles.dayMid}>
                    <MaterialCommunityIcons name={meta.icon} size={20} color="#111827" />
                    <Text style={styles.dayText} numberOfLines={1}>
                      {meta.text}
                    </Text>
                  </View>

                  <Text style={styles.dayRight}>
                    {Math.round(daily.temperature_2m_min[index])}° / {Math.round(daily.temperature_2m_max[index])}°
                  </Text>
                </View>
              );
            }}
          />
        </View>
      </View>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1 },
  container: { flex: 1, padding: 16 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  card: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 14,
    padding: 16,
  },

  title: { fontSize: 18, fontWeight: "800", color: "#111827", marginBottom: 6 },

  place: { fontSize: 16, fontWeight: "800", color: "#111827", marginBottom: 10 },

  currentRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  temp: { fontSize: 44, fontWeight: "900", color: "#111827" },

  currentRight: { alignItems: "flex-end", gap: 2 },
  curText: { fontSize: 14, fontWeight: "800", color: "#111827" },
  hlText: { fontSize: 13, fontWeight: "800", color: "#111827" },

  subText: { marginTop: 10, fontSize: 14, color: "#6b7280" },

  sectionTitle: { marginTop: 14, marginBottom: 8, fontSize: 14, fontWeight: "900", color: "#111827" },

  hourCard: {
    width: 84,
    height: 92,
    paddingVertical: 10,
    paddingHorizontal: 10,
    marginRight: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#fff",
    alignItems: "center",
  },
  hourTime: { fontSize: 12, color: "#6b7280", fontWeight: "800", marginBottom: 6 },
  hourTemp: { fontSize: 16, fontWeight: "900", color: "#111827", marginTop: 6 },
  hourPop: { fontSize: 12, color: "#6b7280", fontWeight: "700", marginTop: 2 },

  sep: { height: 1, backgroundColor: "#e5e7eb", marginVertical: 7 },

  dayRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  dayLeft: { width: 130, fontWeight: "800", color: "#111827" },
  dayMid: { flex: 1, flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 8 },
  dayText: { flex: 1, color: "#6b7280", fontWeight: "700" },
  dayRight: { width: 110, textAlign: "right", fontWeight: "800", color: "#111827" },
});

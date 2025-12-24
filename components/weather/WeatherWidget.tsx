import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

// same coords you already use
const LAT = 38.769808887283496;
const LON = -76.08855332076789;

const wxMap: Record<number, { text: string; icon: any }> = {
  0: { text: "Clear", icon: "weather-sunny" },
  1: { text: "Mainly clear", icon: "weather-sunny" },
  2: { text: "Partly cloudy", icon: "weather-partly-cloudy" },
  3: { text: "Overcast", icon: "weather-cloudy" },
  45: { text: "Fog", icon: "weather-fog" },
  48: { text: "Fog", icon: "weather-fog" },
  51: { text: "Drizzle", icon: "weather-rainy" },
  53: { text: "Drizzle", icon: "weather-rainy" },
  55: { text: "Heavy drizzle", icon: "weather-pouring" },
  61: { text: "Light rain", icon: "weather-rainy" },
  63: { text: "Rain", icon: "weather-rainy" },
  65: { text: "Heavy rain", icon: "weather-pouring" },
  71: { text: "Snow", icon: "weather-snowy" },
  75: { text: "Heavy snow", icon: "weather-snowy-heavy" },
  80: { text: "Showers", icon: "weather-pouring" },
  95: { text: "Thunder", icon: "weather-lightning" },
  96: { text: "Hail", icon: "weather-hail" },
  99: { text: "Hail", icon: "weather-hail" },
};

type Wx = {
  place: string;
  temp: number;
  code: number;
  wind: number;
  hi: number;
  lo: number;
};

export default function WeatherWidget() {
  const [wx, setWx] = useState<Wx | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const wUrl =
          `https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LON}` +
          `&current=temperature_2m,weather_code,wind_speed_10m` +
          `&daily=temperature_2m_max,temperature_2m_min` +
          `&temperature_unit=fahrenheit&windspeed_unit=mph&timezone=auto`;

        const gUrl =
          `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${LAT}&longitude=${LON}` +
          `&localityLanguage=en`;

        const [wRes, gRes] = await Promise.all([fetch(wUrl), fetch(gUrl)]);
        if (!wRes.ok) throw new Error(`Weather HTTP ${wRes.status}`);
        if (!gRes.ok) throw new Error(`Geocode HTTP ${gRes.status}`);

        const w = await wRes.json();
        const g = await gRes.json();

        const town = g.locality || g.city || "";
        const st =
          (g.principalSubdivisionCode?.startsWith("US-")
            ? g.principalSubdivisionCode.replace("US-", "")
            : "") || g.principalSubdivision || "";
        const place = [town, st].filter(Boolean).join(", ") || "Location";

        setWx({
          place,
          temp: Math.round(w.current.temperature_2m),
          code: w.current.weather_code,
          wind: Math.round(w.current.wind_speed_10m),
          hi: Math.round(w.daily.temperature_2m_max?.[0]),
          lo: Math.round(w.daily.temperature_2m_min?.[0]),
        });
      } catch (e: any) {
        setErr(e.message || "Failed to load weather");
      }
    })();
  }, []);

  const meta = useMemo(() => wxMap[wx?.code ?? 3] ?? wxMap[3], [wx?.code]);

  if (err) return null; // keep home clean
  if (!wx) return <ActivityIndicator style={{ marginTop: 12 }} />;

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <Text style={styles.place}>{wx.place}</Text>
        <MaterialCommunityIcons
          name={meta.icon}
          size={24}
          color="rgba(255,255,255,0.95)"
        />
      </View>

      <View style={styles.mainRow}>
        <Text style={styles.temp}>{wx.temp}°</Text>

        <View style={styles.right}>
          <Text style={styles.desc}>{meta.text}</Text>
          <Text style={styles.sub}>
            Wind {wx.wind} mph
          </Text>
          <Text style={styles.sub}>
            H:{wx.hi}°  L:{wx.lo}°
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: 12,
    borderRadius: 14,
    padding: 16,
    backgroundColor: "rgba(59, 130, 246, 0.55)", // blue-ish like screenshot
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  place: {
    color: "rgba(255,255,255,0.95)",
    fontSize: 18,
    fontWeight: "700",
  },
  mainRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  temp: {
    fontSize: 64,
    lineHeight: 64,
    fontWeight: "300",
    color: "rgba(255,255,255,0.98)",
    marginRight: 14,
  },
  right: {
    flex: 1,
    alignItems: "flex-end",
  },
  desc: {
    color: "rgba(255,255,255,0.95)",
    fontSize: 18,
    fontWeight: "700",
  },
  sub: {
    marginTop: 2,
    color: "rgba(255,255,255,0.9)",
    fontSize: 14,
  },
});

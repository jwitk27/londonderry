import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, ScrollView, Text, View } from "react-native";

// TODO: set your campus coords
const LAT = 38.769808887283496;
const LON = -76.08855332076789;

// Map weather codes → text + icon names
const wxMap: Record<number, { text: string; icon: string }> = {
  0: { text: "Clear", icon: "weather-sunny" },
  1: { text: "Mainly clear", icon: "weather-sunny" },
  2: { text: "Partly cloudy", icon: "weather-partly-cloudy" },
  3: { text: "Overcast", icon: "weather-cloudy" },
  45: { text: "Fog", icon: "weather-fog" },
  48: { text: "Rime fog", icon: "weather-fog" },
  51: { text: "Drizzle light", icon: "weather-rainy" },
  53: { text: "Drizzle", icon: "weather-rainy" },
  55: { text: "Drizzle heavy", icon: "weather-pouring" },
  61: { text: "Rain light", icon: "weather-rainy" },
  63: { text: "Rain", icon: "weather-rainy" },
  65: { text: "Rain heavy", icon: "weather-pouring" },
  71: { text: "Snow", icon: "weather-snowy" },
  75: { text: "Snow heavy", icon: "weather-snowy-heavy" },
  80: { text: "Showers", icon: "weather-pouring" },
  95: { text: "Thunderstorm", icon: "weather-lightning" },
  96: { text: "Thunderstorm hail", icon: "weather-hail" },
  99: { text: "Thunderstorm hail+", icon: "weather-hail" },
};

export default function WeatherScreen() {
  const [wx, setWx] = useState<any>(null);
  const [place, setPlace] = useState<string>("");
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        // Weather
        const wUrl =
          `https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LON}` +
          `&current=temperature_2m,weather_code,wind_speed_10m,relative_humidity_2m` +
          `&hourly=temperature_2m,weather_code,precipitation_probability` +
          `&daily=temperature_2m_max,temperature_2m_min,weather_code,precipitation_probability_max` +
          `&temperature_unit=fahrenheit&windspeed_unit=mph&precipitation_unit=inch&timezone=auto`;

        // Location
        const gUrl = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${LAT}&longitude=${LON}&localityLanguage=en`;

        const [wRes, gRes] = await Promise.all([fetch(wUrl), fetch(gUrl)]);
        if (!wRes.ok) throw new Error(`Weather HTTP ${wRes.status}`);
        if (!gRes.ok) throw new Error(`Geocode HTTP ${gRes.status}`);

        const w = await wRes.json();
        const g = await gRes.json();

        // Location string
        const us = g.countryCode === "US";
        const town = g.locality || g.city || "";
        const st =
          (g.principalSubdivisionCode?.startsWith("US-")
            ? g.principalSubdivisionCode.replace("US-", "")
            : "") || g.principalSubdivision || "";
        const label = us ? [town, st].filter(Boolean).join(", ") : g.city || g.locality || g.countryName || "Unknown";

        setPlace(label || "Unknown");
        setWx(w);
      } catch (e: any) {
        setErr(e.message || "Failed to fetch weather");
      }
    })();
  }, []);

  if (err) {
    return (
      <View style={{ flex:1, justifyContent:"center", alignItems:"center", padding:16 }}>
        <Text>Weather error: {err}</Text>
      </View>
    );
  }
  if (!wx) return <ActivityIndicator style={{ marginTop: 40 }} />;

  const cur = wx.current;
  const hourly = wx.hourly;
  const daily = wx.daily;

  const next12 = hourly.time.slice(0, 12).map((t: string, i: number) => ({
    t,
    temp: Math.round(hourly.temperature_2m[i]),
    code: hourly.weather_code[i],
    pop: hourly.precipitation_probability?.[i] ?? null,
  }));

  return (
    <View style={{ flex:1, padding:16 }}>
      <Text style={{ fontSize:18, color:"#6b7280" }}>{place || "Location"}</Text>

      {/* Current */}
      <View style={{ marginTop:6, marginBottom:12, flexDirection:"row", alignItems:"center" }}>
        <MaterialCommunityIcons name={wxMap[cur.weather_code]?.icon || "weather-cloudy"} size={48} color="#2563eb" style={{ marginRight:12 }} />
        <View>
          <Text style={{ fontSize:38, fontWeight:"800" }}>{Math.round(cur.temperature_2m)}°F</Text>
          <Text style={{ fontSize:16 }}>
            {wxMap[cur.weather_code]?.text || "—"} · Humidity {cur.relative_humidity_2m}% · Wind {Math.round(cur.wind_speed_10m)} mph
          </Text>
        </View>
      </View>

      {/* Hourly */}
      <Text style={{ fontWeight:"700", marginBottom:8 }}>Next 12 hours</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom:16 }}>
        {next12.map((h: any) => (
          <View key={h.t} style={{ width:80, padding:8, alignItems:"center", borderWidth:1, borderColor:"#eee", borderRadius:12, marginRight:8 }}>
            <Text style={{ fontSize:12, color:"#6b7280" }}>{new Date(h.t).toLocaleTimeString([], { hour: "numeric" })}</Text>
            <MaterialCommunityIcons name={wxMap[h.code]?.icon || "weather-cloudy"} size={28} color="#2563eb" />
            <Text style={{ fontSize:16, fontWeight:"700" }}>{h.temp}°</Text>
            {h.pop != null && <Text style={{ fontSize:12, color:"#2563eb" }}>{h.pop}%</Text>}
          </View>
        ))}
      </ScrollView>

      {/* 7-day */}
      <Text style={{ fontWeight:"700", marginBottom:8 }}>7-day forecast</Text>
      <FlatList
        data={daily.time}
        keyExtractor={(d: string) => d}
        renderItem={({ item, index }) => (
          <View style={{ flexDirection:"row", justifyContent:"space-between", paddingVertical:10, borderBottomWidth:1, borderColor:"#eee", alignItems:"center" }}>
            <Text style={{ width:120 }}>
              {new Date(item).toLocaleDateString([], { weekday:"short", month:"short", day:"numeric" })}
            </Text>
            <MaterialCommunityIcons
              name={wxMap[daily.weather_code[index]]?.icon || "weather-cloudy"}
              size={24}
              color="#2563eb"
              style={{ marginHorizontal:8 }}
            />
            <Text style={{ flex:1, color:"#6b7280" }}>{wxMap[daily.weather_code[index]]?.text || ""}</Text>
            <Text style={{ width:100, textAlign:"right", fontWeight:"600" }}>
              {Math.round(daily.temperature_2m_min[index])}° / {Math.round(daily.temperature_2m_max[index])}°
            </Text>
          </View>
        )}
      />
    </View>
  );
}

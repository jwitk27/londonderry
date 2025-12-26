import React from "react";
import { Text, View } from "react-native";

export default function PageHeader({
  title,
  sub,
}: {
  title: string;
  sub?: string;
}) {
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={{ textTransform: "uppercase", fontSize: 14, fontWeight: "900", color: "#878787ff", borderBottomWidth: 1, borderBottomColor: "#878787ff", paddingTop: 20 }}>
        {title}
      </Text>
      {!!sub && (
        <Text style={{ marginTop: 4, color: "#6b7280", fontWeight: "700" }}>
          {sub}
        </Text>
      )}
    </View>
  );
}

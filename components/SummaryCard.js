import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { BlurView } from "expo-blur";
import { useAppTheme } from "../hooks/useAppTheme";

export default function SummaryCard({ label, value, tone = "default" }) {
  const { theme } = useAppTheme();
  const color =
    tone === "profit" ? theme.colors.profit : tone === "loss" ? theme.colors.loss : theme.colors.primary;

  return (
    <BlurView intensity={28} tint={theme.isDark ? "dark" : "light"} style={[styles.card, { borderColor: theme.colors.border, backgroundColor: theme.colors.card }]}>
      <Text style={[styles.label, { color: theme.colors.muted, fontFamily: theme.fonts.regular }]}>{label}</Text>
      <Text style={[styles.value, { color, fontFamily: theme.fonts.bold }]}>{value}</Text>
    </BlurView>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    flex: 1,
    minWidth: 120,
    overflow: "hidden"
  },
  label: {
    fontSize: 12
  },
  value: {
    marginTop: 6,
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 0.2
  }
});

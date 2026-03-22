import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useAppTheme } from "../hooks/useAppTheme";

export default function SummaryCard({ label, value, tone = "default" }) {
  const { theme } = useAppTheme();
  const color =
    tone === "profit" ? theme.colors.profit : tone === "loss" ? theme.colors.loss : theme.colors.primary;
  const safeValue = value ?? "-";

  return (
    <View style={[styles.card, { borderColor: theme.colors.border, backgroundColor: theme.colors.card }]}>
      <LinearGradient
        colors={
          theme.isDark
            ? ["rgba(255,255,255,0.08)", "rgba(255,255,255,0.02)"]
            : ["rgba(255,255,255,0.95)", "rgba(255,255,255,0.55)"]
        }
        style={styles.gradient}
      >
        <Text
          numberOfLines={1}
          ellipsizeMode="tail"
          style={[styles.label, { color: theme.colors.muted, fontFamily: theme.fonts.regular }]}
        >
          {label}
        </Text>
        <Text style={[styles.value, { color, fontFamily: theme.fonts.bold }]}>{safeValue}</Text>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    borderWidth: 1,
    overflow: "hidden"
  },
  gradient: {
    padding: 12,
    minHeight: 90,
    justifyContent: "flex-start",
    gap: 6
  },
  label: {
    fontSize: 11,
    letterSpacing: 0.4,
    textTransform: "uppercase"
  },
  value: {
    marginTop: 8,
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 0.3
  }
});

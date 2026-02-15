import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAppTheme } from "../hooks/useAppTheme";
import { money } from "../theme";

export default function TradeCard({ trade, onDelete, onEdit }) {
  const { theme } = useAppTheme();
  const isProfit = trade.finalAmount >= 0;
  return (
    <View style={[styles.card, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
      <View style={styles.row}>
        <Text style={[styles.instrument, { color: theme.colors.text, fontFamily: theme.fonts.bold }]}>
          {trade.instrument}
        </Text>
        <Text style={[styles.pnl, { color: isProfit ? theme.colors.profit : theme.colors.loss, fontFamily: theme.fonts.bold }]}>
          {money(trade.finalAmount)}
        </Text>
      </View>
      <Text style={[styles.meta, { color: theme.colors.muted, fontFamily: theme.fonts.regular }]}>
        {trade.optionType} | Strike {trade.strikePrice} | Charges {money(trade.charges)}
      </Text>
      <View style={styles.row}>
        <Text style={[styles.date, { color: theme.colors.muted, fontFamily: theme.fonts.regular }]}>
          {new Date(trade.tradeDate).toISOString().slice(0, 10)}
        </Text>
        <View style={styles.actions}>
          {onEdit ? (
            <Pressable onPress={() => onEdit(trade)} style={styles.editAction}>
              <Ionicons name="create-outline" size={14} color={theme.colors.primary} />
              <Text style={[styles.delete, { color: theme.colors.primary, fontFamily: theme.fonts.medium }]}>Edit</Text>
            </Pressable>
          ) : null}
          <Pressable onPress={() => onDelete(trade._id)} style={styles.deleteAction}>
            <Ionicons name="trash-outline" size={14} color={theme.colors.loss} />
            <Text style={[styles.delete, { color: theme.colors.loss, fontFamily: theme.fonts.medium }]}>Delete</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginBottom: 10
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  instrument: {
    fontSize: 16,
    fontWeight: "700"
  },
  pnl: {
    fontSize: 15,
    fontWeight: "700"
  },
  meta: {
    marginTop: 6,
    fontSize: 12
  },
  date: {
    marginTop: 8,
    fontSize: 12
  },
  actions: {
    flexDirection: "row",
    gap: 8
  },
  editAction: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 6
  },
  deleteAction: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 6
  },
  delete: {
    fontWeight: "600"
  }
});

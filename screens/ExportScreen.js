import React, { useEffect, useState } from "react";
import { Pressable, Share, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import api from "../services/api";
import { useAppTheme } from "../hooks/useAppTheme";
import { useDialog } from "../hooks/useDialog";
import { parseApiError } from "../utils/errors";
import { money } from "../theme";

export default function ExportScreen() {
  const { theme } = useAppTheme();
  const dialog = useDialog();
  const [monthly, setMonthly] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get("/trades/monthly-summary");
        setMonthly(res.data);
      } catch (err) {
        dialog.show("Report error", parseApiError(err, "Could not load monthly report"));
      }
    };
    load();
  }, []);

  const exportCsv = async () => {
    try {
      const res = await api.get("/export/trades", { responseType: "text" });
      await Share.share({
        title: "Trades CSV",
        message: res.data
      });
    } catch (err) {
      dialog.show("Export error", parseApiError(err, "Could not export CSV"));
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.bg }]}>
      <Text style={[styles.title, { color: theme.colors.text, fontFamily: theme.fonts.bold }]}>Monthly Report</Text>
      {monthly.map((m) => (
        <View key={m._id} style={[styles.card, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
          <View style={styles.row}>
            <Text style={[styles.month, { color: theme.colors.text, fontFamily: theme.fonts.bold }]}>{m._id}</Text>
            <Text style={[styles.pnl, { color: m.netPnl >= 0 ? theme.colors.profit : theme.colors.loss, fontFamily: theme.fonts.bold }]}>
              {money(m.netPnl)}
            </Text>
          </View>
          <Text style={[styles.meta, { color: theme.colors.muted, fontFamily: theme.fonts.regular }]}>Trades: {m.tradesCount}</Text>
          <Text style={[styles.meta, { color: theme.colors.muted, fontFamily: theme.fonts.regular }]}>Gross: {money(m.grossAmount)}</Text>
          <Text style={[styles.meta, { color: theme.colors.muted, fontFamily: theme.fonts.regular }]}>Charges: {money(m.totalCharges)}</Text>
        </View>
      ))}

      <Pressable style={[styles.btn, { backgroundColor: theme.colors.primary }]} onPress={exportCsv}>
        <Ionicons name="share-social-outline" size={16} color="#fff" />
        <Text style={[styles.btnText, { fontFamily: theme.fonts.bold }]}>Share CSV</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 12
  },
  title: {
    fontSize: 21,
    marginBottom: 10
  },
  card: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  meta: {
    marginTop: 2
  },
  btn: {
    marginTop: 12,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 6,
    paddingVertical: 12
  },
  btnText: {
    color: "#fff"
  }
});

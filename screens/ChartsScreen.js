import React, { useEffect, useState } from "react";
import { Dimensions, ScrollView, StyleSheet, Text, View } from "react-native";
import { LineChart } from "react-native-chart-kit";
import api from "../services/api";
import { useAppTheme } from "../hooks/useAppTheme";
import { useDialog } from "../hooks/useDialog";
import { parseApiError } from "../utils/errors";
import { money } from "../theme";

const screenWidth = Dimensions.get("window").width - 24;

export default function ChartsScreen() {
  const { theme } = useAppTheme();
  const dialog = useDialog();
  const [daily, setDaily] = useState([]);
  const [monthly, setMonthly] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const [d, m] = await Promise.all([api.get("/charts/daily"), api.get("/charts/monthly")]);
        setDaily(d.data);
        setMonthly(m.data);
      } catch (err) {
        dialog.show("Chart error", parseApiError(err, "Failed to load chart data"));
      }
    };
    load();
  }, []);

  const chartConfig = {
    backgroundGradientFrom: theme.colors.cardSolid,
    backgroundGradientTo: theme.colors.cardSolid,
    color: () => theme.colors.primary,
    labelColor: () => theme.colors.muted,
    decimalPlaces: 2,
    propsForDots: { r: "4", strokeWidth: "1", stroke: theme.colors.primaryDark }
  };

  const dailyData = {
    labels: daily.slice(-7).map((x) => x._id.slice(5)),
    datasets: [{ data: (daily.slice(-7).map((x) => Number(x.total.toFixed(2))) || [0]).map((v) => (Number.isFinite(v) ? v : 0)) }]
  };
  const monthlyData = {
    labels: monthly.slice(-6).map((x) => x._id),
    datasets: [{ data: (monthly.slice(-6).map((x) => Number(x.total.toFixed(2))) || [0]).map((v) => (Number.isFinite(v) ? v : 0)) }]
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.bg }]}>
      <Text style={[styles.title, { color: theme.colors.text, fontFamily: theme.fonts.bold }]}>Last 7 Days Net P/L</Text>
      {daily.length ? (
        <LineChart width={screenWidth} height={220} data={dailyData} chartConfig={chartConfig} bezier style={styles.chart} />
      ) : (
        <Text style={[styles.empty, { color: theme.colors.muted, fontFamily: theme.fonts.regular }]}>No daily data</Text>
      )}

      <Text style={[styles.title, { color: theme.colors.text, fontFamily: theme.fonts.bold }]}>Last 6 Months Net P/L</Text>
      {monthly.length ? (
        <LineChart width={screenWidth} height={220} data={monthlyData} chartConfig={chartConfig} style={styles.chart} />
      ) : (
        <Text style={[styles.empty, { color: theme.colors.muted, fontFamily: theme.fonts.regular }]}>No monthly data</Text>
      )}

      <View style={[styles.table, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
        <Text style={[styles.subtitle, { color: theme.colors.text, fontFamily: theme.fonts.bold }]}>Monthly Totals</Text>
        {monthly.map((m) => (
          <View key={m._id} style={styles.row}>
            <Text style={[styles.rowLabel, { color: theme.colors.muted, fontFamily: theme.fonts.regular }]}>{m._id}</Text>
            <Text style={[styles.rowValue, { color: m.total >= 0 ? theme.colors.profit : theme.colors.loss, fontFamily: theme.fonts.bold }]}>
              {money(m.total)}
            </Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 12
  },
  title: {
    fontSize: 17,
    marginBottom: 8
  },
  chart: {
    borderRadius: 14,
    marginBottom: 16
  },
  empty: {
    marginBottom: 16
  },
  table: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12
  },
  subtitle: {
    marginBottom: 8
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4
  }
});

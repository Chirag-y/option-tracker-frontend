import React, { useEffect, useMemo, useState } from "react";
import { Dimensions, ScrollView, StyleSheet, Text, View } from "react-native";
import { LineChart } from "react-native-chart-kit";
import api from "../services/api";
import { useAppTheme } from "../hooks/useAppTheme";
import { useDialog } from "../hooks/useDialog";
import { parseApiError } from "../utils/errors";
import { formatMonthYear } from "../utils/date";
import { money } from "../theme";

const screenWidth = Dimensions.get("window").width - 24;
const toDateKey = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const addDays = (date, days) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

const startOfWeek = (date) => {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const offset = (start.getDay() + 6) % 7;
  start.setDate(start.getDate() - offset);
  return start;
};

const startOfMonth = (date) => {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  start.setHours(0, 0, 0, 0);
  return start;
};

const sumRange = (map, start, end) => {
  let total = 0;
  const cursor = new Date(start);
  while (cursor <= end) {
    total += Number(map.get(toDateKey(cursor)) || 0);
    cursor.setDate(cursor.getDate() + 1);
  }
  return total;
};

const ComparisonBar = ({ theme, title, currentLabel, lastLabel, current, last }) => {
  const max = Math.max(Math.abs(current), Math.abs(last), 1);
  const currentPct = Math.max(4, (Math.abs(current) / max) * 100);
  const lastPct = Math.max(4, (Math.abs(last) / max) * 100);

  return (
    <View style={styles.compareBlock}>
      <View style={styles.compareBlockHeader}>
        <Text style={[styles.compareBlockTitle, { color: theme.colors.text, fontFamily: theme.fonts.bold }]}>{title}</Text>
        <Text style={[styles.compareBlockScale, { color: theme.colors.muted, fontFamily: theme.fonts.regular }]}>0 / max</Text>
      </View>
      <View style={styles.compareRow}>
        <Text style={[styles.compareLabel, { color: theme.colors.muted, fontFamily: theme.fonts.regular }]}>{currentLabel}</Text>
        <View style={[styles.barTrack, { backgroundColor: theme.colors.cardSolid, borderColor: theme.colors.border }]}>
          <View style={[styles.barFill, { width: `${currentPct}%`, backgroundColor: theme.colors.profit }]} />
        </View>
        <Text style={[styles.compareValue, { color: theme.colors.text, fontFamily: theme.fonts.bold }]}>{money(current)}</Text>
      </View>
      <View style={styles.compareRow}>
        <Text style={[styles.compareLabel, { color: theme.colors.muted, fontFamily: theme.fonts.regular }]}>{lastLabel}</Text>
        <View style={[styles.barTrack, { backgroundColor: theme.colors.cardSolid, borderColor: theme.colors.border }]}>
          <View style={[styles.barFill, { width: `${lastPct}%`, backgroundColor: theme.colors.loss }]} />
        </View>
        <Text style={[styles.compareValue, { color: theme.colors.text, fontFamily: theme.fonts.bold }]}>{money(last)}</Text>
      </View>
    </View>
  );
};

const ComparisonSection = ({ theme, week, month }) => (
  <View style={[styles.compareSection, { borderColor: theme.colors.border }]}>
    <View style={styles.compareHeader}>
      <Text style={[styles.compareTitle, { color: theme.colors.text, fontFamily: theme.fonts.bold }]}>Compare</Text>
      <Text style={[styles.compareHint, { color: theme.colors.muted, fontFamily: theme.fonts.regular }]}>Current vs Last</Text>
    </View>
    <View style={styles.legendRow}>
      <View style={styles.legendItem}>
        <View style={[styles.legendDot, { backgroundColor: theme.colors.profit }]} />
        <Text style={[styles.legendText, { color: theme.colors.muted, fontFamily: theme.fonts.regular }]}>Current</Text>
      </View>
      <View style={styles.legendItem}>
        <View style={[styles.legendDot, { backgroundColor: theme.colors.loss }]} />
        <Text style={[styles.legendText, { color: theme.colors.muted, fontFamily: theme.fonts.regular }]}>Last</Text>
      </View>
    </View>
    <ComparisonBar
      theme={theme}
      title="Week"
      currentLabel="Current Week"
      lastLabel="Last Week"
      current={week.current}
      last={week.last}
    />
    <ComparisonBar
      theme={theme}
      title="Month"
      currentLabel="Current Month"
      lastLabel="Last Month"
      current={month.current}
      last={month.last}
    />
  </View>
);

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

  const dailyData = useMemo(() => {
    const rows = daily.slice(-7);
    return {
      labels: rows.map((x) => x._id.slice(5)),
      datasets: [
        {
          data: rows.map((x) => (Number.isFinite(Number(x.total)) ? Number(Number(x.total).toFixed(2)) : 0))
        }
      ]
    };
  }, [daily]);

  const monthlyData = useMemo(() => {
    const rows = monthly.slice(-6);
    return {
      labels: rows.map((x) => formatMonthYear(x._id)),
      datasets: [
        {
          data: rows.map((x) => (Number.isFinite(Number(x.total)) ? Number(Number(x.total).toFixed(2)) : 0))
        }
      ]
    };
  }, [monthly]);

  const comparison = useMemo(() => {
    const dailyMap = new Map(daily.map((row) => [row._id, Number(row.total) || 0]));
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const currentWeekStart = startOfWeek(today);
    const currentWeekEnd = today;
    const lastWeekStart = addDays(currentWeekStart, -7);
    const lastWeekEnd = addDays(currentWeekEnd, -7);

    const currentMonthStart = startOfMonth(today);
    const currentMonthEnd = today;
    const lastMonthStart = startOfMonth(addDays(currentMonthStart, -1));
    const lastMonthDayCount = Math.min(
      today.getDate(),
      new Date(today.getFullYear(), today.getMonth(), 0).getDate()
    );
    const lastMonthEnd = new Date(today.getFullYear(), today.getMonth() - 1, lastMonthDayCount);
    lastMonthEnd.setHours(0, 0, 0, 0);

    return {
      week: {
        current: sumRange(dailyMap, currentWeekStart, currentWeekEnd),
        last: sumRange(dailyMap, lastWeekStart, lastWeekEnd)
      },
      month: {
        current: sumRange(dailyMap, currentMonthStart, currentMonthEnd),
        last: sumRange(dailyMap, lastMonthStart, lastMonthEnd)
      }
    };
  }, [daily]);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.bg }]}
      contentContainerStyle={styles.content}
    >
      <View style={[styles.compareCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
        <ComparisonSection theme={theme} week={comparison.week} month={comparison.month} />
      </View>

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
            <Text style={[styles.rowLabel, { color: theme.colors.muted, fontFamily: theme.fonts.regular }]}>{formatMonthYear(m._id)}</Text>
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
  content: {
    paddingBottom: 28
  },
  compareCard: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    marginBottom: 16
  },
  compareSection: {
    gap: 12
  },
  compareHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4
  },
  compareTitle: {
    fontSize: 17
  },
  compareHint: {
    fontSize: 12
  },
  compareBlock: {
    gap: 10
  },
  compareBlockHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  compareBlockTitle: {
    fontSize: 15
  },
  compareBlockScale: {
    fontSize: 11
  },
  compareRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10
  },
  compareLabel: {
    width: 90,
    fontSize: 11
  },
  compareValue: {
    width: 76,
    fontSize: 12,
    textAlign: "right"
  },
  barTrack: {
    flex: 1,
    height: 14,
    borderRadius: 999,
    borderWidth: 1,
    overflow: "hidden"
  },
  barFill: {
    height: "100%",
    borderRadius: 999
  },
  legendRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 18,
    marginTop: 6
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6
  },
  legendDot: {
    width: 9,
    height: 9,
    borderRadius: 99
  },
  legendText: {
    fontSize: 12
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

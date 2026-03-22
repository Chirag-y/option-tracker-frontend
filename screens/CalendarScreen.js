import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import { Calendar } from "react-native-calendars";
import api from "../services/api";
import { useAppTheme } from "../hooks/useAppTheme";
import { useDialog } from "../hooks/useDialog";
import { parseApiError } from "../utils/errors";
import { formatDisplayDate } from "../utils/date";
import { money } from "../theme";
import FilterSelect from "../components/FilterSelect";

export default function CalendarScreen() {
  const { theme } = useAppTheme();
  const dialog = useDialog();
  const [loading, setLoading] = useState(true);
  const [calendarData, setCalendarData] = useState([]);
  const [calendarFilter, setCalendarFilter] = useState("CURRENT_MONTH");
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const now = new Date();
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  });

  const monthKey = useMemo(() => {
    const year = visibleMonth.getUTCFullYear();
    const month = String(visibleMonth.getUTCMonth() + 1).padStart(2, "0");
    return `${year}-${month}`;
  }, [visibleMonth]);
  const calendarCurrent = useMemo(() => `${monthKey}-01`, [monthKey]);

  const CALENDAR_FILTER_OPTIONS = [
    { value: "CURRENT_MONTH", label: "Current Month" },
    { value: "ALL", label: "All Trades" }
  ];

  const fetchCalendar = useCallback(
    async ({ period = calendarFilter, month = monthKey } = {}) => {
      setLoading(true);
      try {
        const params = { period };
        if (period === "CURRENT_MONTH") {
          params.month = month;
        }
        const res = await api.get("/calendar", { params });
        setCalendarData(res.data || []);
      } catch (err) {
        dialog.show("Calendar error", parseApiError(err, "Could not load calendar data"));
      } finally {
        setLoading(false);
      }
    },
    [calendarFilter, dialog, monthKey]
  );

  useEffect(() => {
    fetchCalendar();
  }, [fetchCalendar]);

  const sortedCalendarData = [...calendarData].sort((a, b) => b._id.localeCompare(a._id));
  const totalTradedDays = sortedCalendarData.length;

  const mostProfitableDay = useMemo(() => {
    if (!sortedCalendarData.length) return null;
    return sortedCalendarData.reduce((best, current) =>
      Number(current.total) > Number(best.total) ? current : best
    );
  }, [sortedCalendarData]);

  const biggestLossDay = useMemo(() => {
    if (!sortedCalendarData.length) return null;
    return sortedCalendarData.reduce((worst, current) =>
      Number(current.total) < Number(worst.total) ? current : worst
    );
  }, [sortedCalendarData]);

  const markedDates = sortedCalendarData.reduce((acc, row) => {
    const positive = row.total >= 0;
    acc[row._id] = {
      selected: true,
      selectedColor: positive ? "rgba(23,138,95,0.2)" : "rgba(199,63,63,0.22)",
      selectedTextColor: positive ? theme.colors.profit : theme.colors.loss
    };
    return acc;
  }, {});

  return (
    <View style={[styles.screen, { backgroundColor: theme.colors.bg }]}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={[styles.calendarCard, { backgroundColor: theme.colors.cardSolid, borderColor: theme.colors.border }]}>
          <Calendar
            current={calendarCurrent}
            onMonthChange={(day) => {
              const nextMonth = new Date(Date.UTC(day.year, day.month - 1, 1));
              setVisibleMonth(nextMonth);
              const nextKey = `${day.year}-${String(day.month).padStart(2, "0")}`;
              void fetchCalendar({ month: nextKey });
            }}
            markedDates={markedDates}
            theme={{
              calendarBackground: theme.colors.cardSolid,
              dayTextColor: theme.colors.text,
              monthTextColor: theme.colors.text,
              arrowColor: theme.colors.primary,
              textDisabledColor: theme.colors.muted,
              todayTextColor: theme.colors.primary
            }}
          />
        </View>

        <View style={styles.spacerLarge} />

        <View style={[styles.sectionCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text, fontFamily: theme.fonts.bold }]}>Trade Filter Options</Text>
          <Text style={[styles.sectionSubtitle, { color: theme.colors.muted, fontFamily: theme.fonts.regular }]}>
            Narrow the trade view by period or switch to the full trade history.
          </Text>
          <View style={styles.filterControl}>
            <FilterSelect
              label="View"
              value={calendarFilter}
              options={CALENDAR_FILTER_OPTIONS}
              onSelect={setCalendarFilter}
            />
          </View>
        </View>

        <View style={styles.spacerMedium} />

        <View style={[styles.metricCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
          <Text style={[styles.metricLabel, { color: theme.colors.muted, fontFamily: theme.fonts.regular }]}>Total Traded Days</Text>
          <Text style={[styles.metricValue, { color: theme.colors.text, fontFamily: theme.fonts.bold }]}>{totalTradedDays}</Text>
        </View>

        <View style={[styles.metricCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
          <Text style={[styles.metricLabel, { color: theme.colors.muted, fontFamily: theme.fonts.regular }]}>Most Profitable Day</Text>
          <Text style={[styles.metricValue, { color: theme.colors.profit, fontFamily: theme.fonts.bold }]}>
            {mostProfitableDay ? `${formatDisplayDate(mostProfitableDay._id)} - ${money(mostProfitableDay.total)}` : "No data"}
          </Text>
        </View>

        <View style={[styles.metricCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
          <Text style={[styles.metricLabel, { color: theme.colors.muted, fontFamily: theme.fonts.regular }]}>Biggest Loss Day</Text>
          <Text style={[styles.metricValue, { color: theme.colors.loss, fontFamily: theme.fonts.bold }]}>
            {biggestLossDay ? `${formatDisplayDate(biggestLossDay._id)} - ${money(biggestLossDay.total)}` : "No data"}
          </Text>
        </View>

        <View style={styles.summaryHeader}>
          <Text style={[styles.title, { color: theme.colors.text, fontFamily: theme.fonts.bold }]}>Daily Summary</Text>
          <Text style={[styles.summaryHint, { color: theme.colors.muted, fontFamily: theme.fonts.regular }]}>
            {sortedCalendarData.length} day{sortedCalendarData.length === 1 ? "" : "s"}
          </Text>
        </View>

        {sortedCalendarData.length ? (
          sortedCalendarData.map((d) => (
            <View key={d._id} style={[styles.row, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
              <Text style={[styles.date, { color: theme.colors.text, fontFamily: theme.fonts.medium }]}>{formatDisplayDate(d._id)}</Text>
              <Text style={[styles.value, { color: d.total >= 0 ? theme.colors.profit : theme.colors.loss, fontFamily: theme.fonts.bold }]}>
                {money(d.total)}
              </Text>
            </View>
          ))
        ) : (
          <View style={[styles.emptyState, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
            <Text style={[styles.emptyTitle, { color: theme.colors.text, fontFamily: theme.fonts.medium }]}>No trade data for this view</Text>
            <Text style={[styles.emptyText, { color: theme.colors.muted, fontFamily: theme.fonts.regular }]}>
              Switch the filter or move to another month to see daily totals.
            </Text>
          </View>
        )}
      </ScrollView>

      {loading ? (
        <View style={[styles.fullScreenLoader, { backgroundColor: theme.colors.overlay }]}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1
  },
  container: {
    flex: 1,
    padding: 12
  },
  content: {
    paddingBottom: 24
  },
  fullScreenLoader: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 20,
    elevation: 20
  },
  title: {
    fontSize: 18
  },
  summaryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
    marginBottom: 8
  },
  summaryHint: {
    fontSize: 12
  },
  calendarCard: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 4
  },
  sectionCard: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 12
  },
  sectionTitle: {
    fontSize: 16
  },
  sectionSubtitle: {
    marginTop: 4,
    marginBottom: 10,
    fontSize: 13,
    lineHeight: 18
  },
  filterControl: {
    width: "100%"
  },
  metricCard: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 8
  },
  metricLabel: {
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 0.4
  },
  metricValue: {
    marginTop: 4,
    fontSize: 15
  },
  spacerLarge: {
    height: 16
  },
  spacerMedium: {
    height: 12
  },
  emptyState: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 14
  },
  emptyTitle: {
    fontSize: 15,
    marginBottom: 4
  },
  emptyText: {
    fontSize: 13,
    lineHeight: 18
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderRadius: 10,
    borderWidth: 1,
    padding: 10,
    marginBottom: 8
  },
  date: {
    fontSize: 16
  },
  value: {
    letterSpacing: 0.2
  }
});

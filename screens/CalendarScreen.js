import React, { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import { Calendar } from "react-native-calendars";
import api from "../services/api";
import { useAppTheme } from "../hooks/useAppTheme";
import { useDialog } from "../hooks/useDialog";
import { parseApiError } from "../utils/errors";
import { money } from "../theme";

export default function CalendarScreen() {
  const { theme } = useAppTheme();
  const dialog = useDialog();
  const [loading, setLoading] = useState(true);
  const [calendarData, setCalendarData] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get("/calendar");
        setCalendarData(res.data);
      } catch (err) {
        dialog.show("Calendar error", parseApiError(err, "Could not load calendar data"));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <View style={[styles.loader, { backgroundColor: theme.colors.bg }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  const markedDates = calendarData.reduce((acc, row) => {
    const positive = row.total >= 0;
    acc[row._id] = {
      selected: true,
      selectedColor: positive ? "rgba(23,138,95,0.2)" : "rgba(199,63,63,0.22)",
      selectedTextColor: positive ? theme.colors.profit : theme.colors.loss
    };
    return acc;
  }, {});

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.bg }]}>
      <Calendar
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
      <Text style={[styles.title, { color: theme.colors.text, fontFamily: theme.fonts.bold }]}>Daily Summary</Text>
      {calendarData.map((d) => (
        <View key={d._id} style={[styles.row, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
          <Text style={[styles.date, { color: theme.colors.text, fontFamily: theme.fonts.medium }]}>{d._id}</Text>
          <Text style={[styles.value, { color: d.total >= 0 ? theme.colors.profit : theme.colors.loss, fontFamily: theme.fonts.bold }]}>
            {money(d.total)}
          </Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 12
  },
  loader: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center"
  },
  title: {
    marginTop: 14,
    marginBottom: 8,
    fontSize: 18
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderRadius: 10,
    borderWidth: 1,
    padding: 10,
    marginBottom: 8
  },
  value: {
    letterSpacing: 0.2
  }
});

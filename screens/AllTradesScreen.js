import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Modal, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Calendar } from "react-native-calendars";
import { BlurView } from "expo-blur";
import api from "../services/api";
import { useAppTheme } from "../hooks/useAppTheme";
import { useDialog } from "../hooks/useDialog";
import { parseApiError } from "../utils/errors";
import TradeCard from "../components/TradeCard";
import FilterSelect from "../components/FilterSelect";
import { subscribeToRealtimeEvents } from "../hooks/notificationCenter";
import { formatDisplayDate } from "../utils/date";
import { money } from "../theme";

const resultOptions = [
  { value: "ALL", label: "All Results" },
  { value: "PROFIT", label: "Profit" },
  { value: "LOSS", label: "Loss" }
];
const instrumentOptions = [
  { value: "ALL", label: "All Instruments" },
  { value: "NIFTY", label: "Nifty" },
  { value: "SENSEX", label: "Sensex" },
  { value: "CRUDEOIL", label: "Crudeoil" },
  { value: "BANKNIFTY", label: "Banknifty" },
  { value: "COMMODITY", label: "Commodity" },
  { value: "STOCK_OPTION", label: "Stock Option" },
  { value: "OTHER_INDICES", label: "Other Indices" }
];
const periodOptions = [
  { value: "THIS_MONTH", label: "This Month" },
  { value: "THIS_YEAR", label: "This Year" },
  { value: "PAST_MONTH", label: "Past Month" },
  { value: "CUSTOM", label: "Custom Range" }
];

export default function AllTradesScreen() {
  const { theme } = useAppTheme();
  const dialog = useDialog();
  const [trades, setTrades] = useState([]);
  const [filters, setFilters] = useState({
    resultType: "ALL",
    instrument: "ALL",
    period: "THIS_MONTH",
    startDate: "",
    endDate: ""
  });
  const [refreshing, setRefreshing] = useState(false);
  const [editingTrade, setEditingTrade] = useState(null);
  const [editErrors, setEditErrors] = useState({});
  const [savingEdit, setSavingEdit] = useState(false);
  const [datePicker, setDatePicker] = useState({ visible: false, key: "startDate", target: "filter" });

  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      const params = {
        resultType: filters.resultType,
        instrument: filters.instrument,
        period: filters.period
      };
      if (filters.period === "CUSTOM") {
        params.startDate = filters.startDate;
        params.endDate = filters.endDate;
      }
      const res = await api.get("/trades", { params });
      setTrades(res.data);
    } catch (err) {
      dialog.show("Trades error", parseApiError(err, "Failed to load trades"));
    } finally {
      setRefreshing(false);
    }
  }, [filters, dialog]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  useEffect(() => {
    const unsubscribe = subscribeToRealtimeEvents(() => load());
    return unsubscribe;
  }, [load]);

  const onDelete = async (id) => {
    try {
      await api.delete(`/trades/${id}`);
      await load();
    } catch (err) {
      dialog.show("Delete error", parseApiError(err, "Delete failed"));
    }
  };

  const validateEdit = () => {
    const next = {};
    if (!String(editingTrade?.instrument || "").trim()) next.instrument = "Instrument is required";
    if (!editingTrade?.resultType) next.resultType = "Result is required";
    if (String(editingTrade?.amount ?? "").trim() === "") next.amount = "Amount is required";
    if (String(editingTrade?.charges ?? "").trim() === "") next.charges = "Charges are required";
    if (!String(editingTrade?.tradeDate || "").trim()) next.tradeDate = "Trade date is required";

    const amount = Number(editingTrade?.amount);
    const charges = Number(editingTrade?.charges);
    if (!next.amount && (!Number.isFinite(amount) || amount < 0)) {
      next.amount = "Amount must be a valid non-negative number";
    }
    if (!next.charges && (!Number.isFinite(charges) || charges < 0)) {
      next.charges = "Charges must be a valid non-negative number";
    }
    return next;
  };

  const onSaveEdit = async () => {
    const nextErrors = validateEdit();
    setEditErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    try {
      setSavingEdit(true);
      await api.patch(`/trades/${editingTrade._id}`, {
        instrument: editingTrade.instrument,
        optionType: editingTrade.optionType,
        strikePrice: Number(editingTrade.strikePrice || 0),
        resultType: editingTrade.resultType,
        amount: Number(editingTrade.amount || 0),
        charges: Number(editingTrade.charges || 0),
        tradeDate: editingTrade.tradeDate
      });
      setEditingTrade(null);
      setEditErrors({});
      await load();
      dialog.show("Saved", "Trade updated successfully.");
    } catch (err) {
      dialog.show("Edit error", parseApiError(err, "Failed to update trade"));
    } finally {
      setSavingEdit(false);
    }
  };

  const estimatedFinal = useMemo(() => {
    if (!editingTrade) return 0;
    const amount = Number(editingTrade.amount || 0);
    const charges = Number(editingTrade.charges || 0);
    return editingTrade.resultType === "PROFIT" ? amount - charges : -(amount + charges);
  }, [editingTrade]);

  const filteredTotalResult = useMemo(
    () => trades.reduce((sum, trade) => sum + Number(trade.finalAmount || 0), 0),
    [trades]
  );
  const filteredTotalCharges = useMemo(
    () => trades.reduce((sum, trade) => sum + Number(trade.charges || 0), 0),
    [trades]
  );

  return (
    <>
      <ScrollView
        style={[styles.container, { backgroundColor: theme.colors.bg }]}
        contentContainerStyle={[styles.content, { paddingBottom: 110 }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} tintColor={theme.colors.primary} />}
      >

        <View style={[styles.card, { borderColor: theme.colors.border, backgroundColor: theme.colors.card }]}>
          <View style={styles.filterRow}>
            <View style={[styles.filterItem, styles.filterItemLast]}>
              <FilterSelect
                label="Result"
                value={filters.resultType}
                options={resultOptions}
                onSelect={(value) => setFilters((p) => ({ ...p, resultType: value }))}
                placeholder="Select result"
              />
            </View>
            <View style={[styles.filterItem, styles.filterItemLast]}>
              <FilterSelect
                label="Instrument"
                value={filters.instrument}
                options={instrumentOptions}
                onSelect={(value) => setFilters((p) => ({ ...p, instrument: value }))}
                placeholder="All instruments"
              />
            </View>
          </View>
          <View style={styles.filterRow}>
            <View style={[styles.filterItem, styles.filterItemLast]}>
              <FilterSelect
                label="Date Range"
                value={filters.period}
                options={periodOptions}
                onSelect={(value) => setFilters((p) => ({ ...p, period: value }))}
                placeholder="This month"
              />
            </View>
          </View>

          {filters.period === "CUSTOM" ? (
            <>
              <Text style={[styles.label, { color: theme.colors.text, fontFamily: theme.fonts.medium }]}>Start Date</Text>
              <Pressable style={[styles.input, { borderColor: theme.colors.border, backgroundColor: theme.colors.cardSolid }]} onPress={() => setDatePicker({ visible: true, key: "startDate", target: "filter" })}>
                <Text style={{ color: theme.colors.text, fontFamily: theme.fonts.regular }}>
                  {filters.startDate ? formatDisplayDate(filters.startDate) : "Select date"}
                </Text>
              </Pressable>
              <Text style={[styles.label, { color: theme.colors.text, fontFamily: theme.fonts.medium }]}>End Date</Text>
              <Pressable style={[styles.input, { borderColor: theme.colors.border, backgroundColor: theme.colors.cardSolid }]} onPress={() => setDatePicker({ visible: true, key: "endDate", target: "filter" })}>
                <Text style={{ color: theme.colors.text, fontFamily: theme.fonts.regular }}>
                  {filters.endDate ? formatDisplayDate(filters.endDate) : "Select date"}
                </Text>
              </Pressable>
            </>
          ) : null}
        </View>

        {trades.map((trade) => (
          <TradeCard
            key={trade._id}
            trade={trade}
            onDelete={onDelete}
            onEdit={(t) => {
              setEditingTrade({ ...t, tradeDate: new Date(t.tradeDate).toISOString().slice(0, 10) });
              setEditErrors({});
            }}
          />
        ))}
      </ScrollView>

      <View style={[styles.bottomBar, { borderColor: theme.colors.border, backgroundColor: theme.colors.cardSolid }]}>
        <View style={styles.bottomMetric}>
          <Text style={[styles.bottomLabel, { color: theme.colors.muted, fontFamily: theme.fonts.regular }]}>Trades</Text>
          <Text style={[styles.bottomValue, { color: theme.colors.text, fontFamily: theme.fonts.bold }]}>{trades.length}</Text>
        </View>
        <View style={[styles.bottomMetric]}>
          <Text style={[styles.bottomLabel, { color: theme.colors.muted, fontFamily: theme.fonts.regular }]}>Result</Text>
          <Text
            style={[
              styles.bottomValue,
              { color: filteredTotalResult >= 0 ? theme.colors.profit : theme.colors.loss, fontFamily: theme.fonts.bold }
            ]}
          >
            {money(filteredTotalResult)}
          </Text>
        </View>
        <View style={styles.bottomMetric}>
          <Text style={[styles.bottomLabel, { color: theme.colors.muted, fontFamily: theme.fonts.regular }]}>Charges</Text>
          <Text style={[styles.bottomValue, { color: theme.colors.loss, fontFamily: theme.fonts.bold }]}>
            {money(filteredTotalCharges)}
          </Text>
        </View>
      </View>

      <Modal transparent visible={datePicker.visible} onRequestClose={() => setDatePicker({ visible: false, key: "startDate", target: "filter" })}>
        <View style={[styles.modalOverlay, { backgroundColor: theme.colors.overlay }]}>
          <View style={[styles.modalCard, { borderColor: theme.colors.border, backgroundColor: theme.colors.cardSolid }]}>
            <Calendar
              current={datePicker.target === "edit" && editingTrade?.tradeDate ? editingTrade.tradeDate : undefined}
              markedDates={
                datePicker.target === "edit" && editingTrade?.tradeDate
                  ? {
                      [editingTrade.tradeDate]: {
                        selected: true,
                        selectedColor: theme.colors.primary
                      }
                    }
                  : undefined
              }
              onDayPress={(day) => {
                if (datePicker.target === "filter") {
                  setFilters((p) => ({ ...p, [datePicker.key]: day.dateString }));
                } else if (datePicker.target === "edit") {
                  setEditingTrade((p) => ({ ...p, tradeDate: day.dateString }));
                  setEditErrors((prev) => {
                    const next = { ...prev };
                    delete next.tradeDate;
                    return next;
                  });
                }
                setDatePicker({ visible: false, key: "startDate", target: "filter" });
              }}
              theme={{
                calendarBackground: theme.colors.cardSolid,
                dayTextColor: theme.colors.text,
                monthTextColor: theme.colors.text,
                arrowColor: theme.colors.primary,
                textDisabledColor: theme.colors.muted,
                todayTextColor: theme.colors.primary
              }}
            />
            <Pressable style={[styles.modalBtn, { borderColor: theme.colors.border }]} onPress={() => setDatePicker({ visible: false, key: "startDate", target: "filter" })}>
              <Text style={{ color: theme.colors.text, fontFamily: theme.fonts.medium }}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal transparent visible={!!editingTrade} onRequestClose={() => setEditingTrade(null)}>
        <View style={[styles.modalOverlay, { backgroundColor: theme.colors.overlay }]}>
          <BlurView intensity={32} tint={theme.isDark ? "dark" : "light"} style={[styles.modalCard, { borderColor: theme.colors.border, backgroundColor: theme.colors.card }]}>
            <Text style={[styles.title, { color: theme.colors.text, fontFamily: theme.fonts.bold, fontSize: 17 }]}>Edit Trade</Text>

            <Text style={[styles.label, { color: theme.colors.text, fontFamily: theme.fonts.medium }]}>Instrument</Text>
            <TextInput
              style={[styles.input, { borderColor: editErrors.instrument ? theme.colors.loss : theme.colors.border, color: theme.colors.text, backgroundColor: theme.colors.cardSolid }]}
              value={editingTrade?.instrument || ""}
              onChangeText={(v) => {
                setEditingTrade((p) => ({ ...p, instrument: v }));
                setEditErrors((prev) => ({ ...prev, instrument: undefined }));
              }}
            />
            {!!editErrors.instrument && <Text style={[styles.errorText, { color: theme.colors.loss, fontFamily: theme.fonts.regular }]}>{editErrors.instrument}</Text>}

            <Text style={[styles.label, { color: theme.colors.text, fontFamily: theme.fonts.medium }]}>Result</Text>
            <View style={styles.row}>
              {["PROFIT", "LOSS"].map((r) => (
                <Pressable
                  key={r}
                  style={[styles.pill, { borderColor: editErrors.resultType ? theme.colors.loss : theme.colors.border, backgroundColor: theme.colors.cardSolid }, editingTrade?.resultType === r && { borderColor: theme.colors.primary }]}
                  onPress={() => {
                    setEditingTrade((p) => ({ ...p, resultType: r }));
                    setEditErrors((prev) => ({ ...prev, resultType: undefined }));
                  }}
                >
                  <Text style={{ color: theme.colors.text, fontFamily: theme.fonts.medium }}>{r}</Text>
                </Pressable>
              ))}
            </View>
            {!!editErrors.resultType && <Text style={[styles.errorText, { color: theme.colors.loss, fontFamily: theme.fonts.regular }]}>{editErrors.resultType}</Text>}

            <Text style={[styles.label, { color: theme.colors.text, fontFamily: theme.fonts.medium }]}>Amount</Text>
            <TextInput
              style={[styles.input, { borderColor: editErrors.amount ? theme.colors.loss : theme.colors.border, color: theme.colors.text, backgroundColor: theme.colors.cardSolid }]}
              keyboardType="numeric"
              value={String(editingTrade?.amount ?? "")}
              onChangeText={(v) => {
                setEditingTrade((p) => ({ ...p, amount: v }));
                setEditErrors((prev) => ({ ...prev, amount: undefined }));
              }}
            />
            {!!editErrors.amount && <Text style={[styles.errorText, { color: theme.colors.loss, fontFamily: theme.fonts.regular }]}>{editErrors.amount}</Text>}

            <Text style={[styles.label, { color: theme.colors.text, fontFamily: theme.fonts.medium }]}>Charges</Text>
            <TextInput
              style={[styles.input, { borderColor: editErrors.charges ? theme.colors.loss : theme.colors.border, color: theme.colors.text, backgroundColor: theme.colors.cardSolid }]}
              keyboardType="numeric"
              value={String(editingTrade?.charges ?? "")}
              onChangeText={(v) => {
                setEditingTrade((p) => ({ ...p, charges: v }));
                setEditErrors((prev) => ({ ...prev, charges: undefined }));
              }}
            />
            {!!editErrors.charges && <Text style={[styles.errorText, { color: theme.colors.loss, fontFamily: theme.fonts.regular }]}>{editErrors.charges}</Text>}

            <Text style={[styles.label, { color: theme.colors.text, fontFamily: theme.fonts.medium }]}>Trade Date</Text>
            <Pressable
              style={[styles.input, { borderColor: editErrors.tradeDate ? theme.colors.loss : theme.colors.border, backgroundColor: theme.colors.cardSolid }]}
              onPress={() => setDatePicker({ visible: true, key: "tradeDate", target: "edit" })}
            >
              <Text style={{ color: theme.colors.text, fontFamily: theme.fonts.regular }}>
                {editingTrade?.tradeDate ? formatDisplayDate(editingTrade.tradeDate) : "Select date"}
              </Text>
            </Pressable>
            {!!editErrors.tradeDate && <Text style={[styles.errorText, { color: theme.colors.loss, fontFamily: theme.fonts.regular }]}>{editErrors.tradeDate}</Text>}

            <View style={[styles.previewCard, { borderColor: theme.colors.border, backgroundColor: theme.colors.cardSolid }]}>
              <Text style={{ color: theme.colors.muted, fontFamily: theme.fonts.regular }}>Estimated Final</Text>
              <Text style={{ color: estimatedFinal >= 0 ? theme.colors.profit : theme.colors.loss, fontFamily: theme.fonts.bold }}>
                Rs {Number(estimatedFinal || 0).toFixed(2)}
              </Text>
            </View>

            <View style={styles.modalActions}>
              <Pressable
                disabled={savingEdit}
                style={[
                  styles.modalAction,
                  { borderColor: theme.colors.border, backgroundColor: theme.colors.cardSolid },
                  savingEdit && styles.modalActionDisabled
                ]}
                onPress={() => setEditingTrade(null)}
              >
                <Text style={{ color: theme.colors.text, fontFamily: theme.fonts.medium }}>Cancel</Text>
              </Pressable>
              <Pressable
                disabled={savingEdit}
                style={[
                  styles.modalAction,
                  { borderColor: theme.colors.primary, backgroundColor: theme.colors.primary },
                  savingEdit && styles.modalActionDisabled
                ]}
                onPress={onSaveEdit}
              >
                {savingEdit ? (
                  <View style={styles.savingRow}>
                    <ActivityIndicator size="small" color="#fff" />
                    <Text style={{ color: "#fff", fontFamily: theme.fonts.bold }}>Saving</Text>
                  </View>
                ) : (
                  <Text style={{ color: "#fff", fontFamily: theme.fonts.bold }}>Save</Text>
                )}
              </Pressable>
            </View>
          </BlurView>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 12, paddingBottom: 24 },
  title: { fontSize: 21, marginBottom: 10 },
  filterRow: {
    flexDirection: "row",
    marginBottom: 10,
    gap: 8
  },
  filterItem: {
    flex: 1,
    marginRight: 8
  },
  filterItemLast: {
    marginRight: 0
  },
  card: { borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 10 },
  label: { marginTop: 8, marginBottom: 4 },
  errorText: { marginTop: -2, marginBottom: 6, fontSize: 12 },
  row: { flexDirection: "row", gap: 8 },
  modalActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 6
  },
  modalAction: {
    flex: 1,
    minHeight: 46,
    borderWidth: 1,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12
  },
  modalActionDisabled: {
    opacity: 0.7
  },
  savingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 10 },
  previewCard: { borderWidth: 1, borderRadius: 10, padding: 10, marginVertical: 8 },
  modalOverlay: { flex: 1, justifyContent: "center", padding: 16 },
  modalCard: { borderWidth: 1, borderRadius: 14, padding: 12, overflow: "hidden" },
  modalBtn: { marginTop: 10, borderWidth: 1, borderRadius: 10, alignItems: "center", paddingVertical: 10 },
  bottomBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    borderWidth: 1,
    borderRadius: 0,
    paddingVertical: 10,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8
  },
  bottomMetric: {
    flex: 1,
    alignItems: "flex-start"
  },
  bottomLabel: {
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 0.4,
    textAlign: "left",
    width: "100%"
  },
  bottomValue: {
    marginTop: 4,
    fontSize: 15,
    textAlign: "left",
    width: "100%"
  }
});

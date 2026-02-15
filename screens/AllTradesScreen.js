import React, { useCallback, useMemo, useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Calendar } from "react-native-calendars";
import { BlurView } from "expo-blur";
import api from "../services/api";
import { useAppTheme } from "../hooks/useAppTheme";
import { useDialog } from "../hooks/useDialog";
import { parseApiError } from "../utils/errors";
import TradeCard from "../components/TradeCard";

const resultOptions = ["ALL", "PROFIT", "LOSS"];
const instrumentOptions = ["ALL", "NIFTY", "SENSEX", "CRUDE", "NATURAL GAS", "OTHER"];
const periodOptions = ["THIS_MONTH", "THIS_YEAR", "PAST_MONTH", "CUSTOM"];

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
  const [editingTrade, setEditingTrade] = useState(null);
  const [editErrors, setEditErrors] = useState({});
  const [datePicker, setDatePicker] = useState({ visible: false, key: "startDate", target: "filter" });

  const load = async () => {
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
    }
  };

  useFocusEffect(
    useCallback(() => {
      load();
    }, [filters.resultType, filters.instrument, filters.period, filters.startDate, filters.endDate])
  );

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
    }
  };

  const estimatedFinal = useMemo(() => {
    if (!editingTrade) return 0;
    const amount = Number(editingTrade.amount || 0);
    const charges = Number(editingTrade.charges || 0);
    return editingTrade.resultType === "PROFIT" ? amount - charges : -(amount + charges);
  }, [editingTrade]);

  return (
    <>
      <ScrollView style={[styles.container, { backgroundColor: theme.colors.bg }]} contentContainerStyle={styles.content}>
        <Text style={[styles.title, { color: theme.colors.text, fontFamily: theme.fonts.bold }]}>All Trades</Text>

        <View style={[styles.card, { borderColor: theme.colors.border, backgroundColor: theme.colors.card }]}>
          <Text style={[styles.label, { color: theme.colors.text, fontFamily: theme.fonts.medium }]}>Result</Text>
          <View style={styles.rowWrap}>
            {resultOptions.map((opt) => (
              <Pressable
                key={opt}
                style={[styles.pillWrap, { borderColor: theme.colors.border, backgroundColor: theme.colors.cardSolid }, filters.resultType === opt && { borderColor: theme.colors.primary }]}
                onPress={() => setFilters((p) => ({ ...p, resultType: opt }))}
              >
                <Text style={{ color: theme.colors.text, fontFamily: theme.fonts.medium, fontSize: 12 }}>{opt}</Text>
              </Pressable>
            ))}
          </View>

          <Text style={[styles.label, { color: theme.colors.text, fontFamily: theme.fonts.medium }]}>Instrument</Text>
          <View style={styles.rowWrap}>
            {instrumentOptions.map((opt) => (
              <Pressable
                key={opt}
                style={[styles.pillWrap, { borderColor: theme.colors.border, backgroundColor: theme.colors.cardSolid }, filters.instrument === opt && { borderColor: theme.colors.primary }]}
                onPress={() => setFilters((p) => ({ ...p, instrument: opt }))}
              >
                <Text style={{ color: theme.colors.text, fontFamily: theme.fonts.medium, fontSize: 12 }}>{opt}</Text>
              </Pressable>
            ))}
          </View>

          <Text style={[styles.label, { color: theme.colors.text, fontFamily: theme.fonts.medium }]}>Date Range</Text>
          <View style={styles.rowWrap}>
            {periodOptions.map((opt) => (
              <Pressable
                key={opt}
                style={[styles.pillWrap, { borderColor: theme.colors.border, backgroundColor: theme.colors.cardSolid }, filters.period === opt && { borderColor: theme.colors.primary }]}
                onPress={() => setFilters((p) => ({ ...p, period: opt }))}
              >
                <Text style={{ color: theme.colors.text, fontFamily: theme.fonts.medium, fontSize: 12 }}>{opt}</Text>
              </Pressable>
            ))}
          </View>

          {filters.period === "CUSTOM" ? (
            <>
              <Text style={[styles.label, { color: theme.colors.text, fontFamily: theme.fonts.medium }]}>Start Date</Text>
              <Pressable style={[styles.input, { borderColor: theme.colors.border, backgroundColor: theme.colors.cardSolid }]} onPress={() => setDatePicker({ visible: true, key: "startDate", target: "filter" })}>
                <Text style={{ color: theme.colors.text, fontFamily: theme.fonts.regular }}>{filters.startDate || "Select date"}</Text>
              </Pressable>
              <Text style={[styles.label, { color: theme.colors.text, fontFamily: theme.fonts.medium }]}>End Date</Text>
              <Pressable style={[styles.input, { borderColor: theme.colors.border, backgroundColor: theme.colors.cardSolid }]} onPress={() => setDatePicker({ visible: true, key: "endDate", target: "filter" })}>
                <Text style={{ color: theme.colors.text, fontFamily: theme.fonts.regular }}>{filters.endDate || "Select date"}</Text>
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

      <Modal transparent visible={datePicker.visible} onRequestClose={() => setDatePicker({ visible: false, key: "startDate", target: "filter" })}>
        <View style={[styles.modalOverlay, { backgroundColor: theme.colors.overlay }]}>
          <View style={[styles.modalCard, { borderColor: theme.colors.border, backgroundColor: theme.colors.cardSolid }]}>
            <Calendar
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
              <Text style={{ color: theme.colors.text, fontFamily: theme.fonts.regular }}>{editingTrade?.tradeDate || "Select date"}</Text>
            </Pressable>
            {!!editErrors.tradeDate && <Text style={[styles.errorText, { color: theme.colors.loss, fontFamily: theme.fonts.regular }]}>{editErrors.tradeDate}</Text>}

            <View style={[styles.previewCard, { borderColor: theme.colors.border, backgroundColor: theme.colors.cardSolid }]}>
              <Text style={{ color: theme.colors.muted, fontFamily: theme.fonts.regular }}>Estimated Final</Text>
              <Text style={{ color: estimatedFinal >= 0 ? theme.colors.profit : theme.colors.loss, fontFamily: theme.fonts.bold }}>
                Rs {Number(estimatedFinal || 0).toFixed(2)}
              </Text>
            </View>

            <View style={styles.row}>
              <Pressable style={[styles.pill, { borderColor: theme.colors.border, backgroundColor: theme.colors.cardSolid }]} onPress={() => setEditingTrade(null)}>
                <Text style={{ color: theme.colors.text, fontFamily: theme.fonts.medium }}>Cancel</Text>
              </Pressable>
              <Pressable style={[styles.pill, { borderColor: theme.colors.primary, backgroundColor: theme.colors.primary }]} onPress={onSaveEdit}>
                <Text style={{ color: "#fff", fontFamily: theme.fonts.bold }}>Save</Text>
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
  card: { borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 10 },
  label: { marginTop: 8, marginBottom: 4 },
  errorText: { marginTop: -2, marginBottom: 6, fontSize: 12 },
  row: { flexDirection: "row", gap: 8 },
  rowWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  pill: { flex: 1, borderWidth: 1, borderRadius: 999, alignItems: "center", paddingVertical: 8 },
  pillWrap: { borderWidth: 1, borderRadius: 999, alignItems: "center", paddingVertical: 8, paddingHorizontal: 10 },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 10 },
  previewCard: { borderWidth: 1, borderRadius: 10, padding: 10, marginVertical: 8 },
  modalOverlay: { flex: 1, justifyContent: "center", padding: 16 },
  modalCard: { borderWidth: 1, borderRadius: 14, padding: 12, overflow: "hidden" },
  modalBtn: { marginTop: 10, borderWidth: 1, borderRadius: 10, alignItems: "center", paddingVertical: 10 }
});

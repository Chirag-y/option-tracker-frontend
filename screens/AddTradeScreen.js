import React, { useMemo, useRef, useState } from "react";
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Calendar } from "react-native-calendars";
import { BlurView } from "expo-blur";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import api from "../services/api";
import { useAppTheme } from "../hooks/useAppTheme";
import { useDialog } from "../hooks/useDialog";
import { parseApiError } from "../utils/errors";

function Input({ theme, label, icon, inputRef, error, ...props }) {
  return (
    <>
      <Text style={[styles.label, { color: theme.colors.text, fontFamily: theme.fonts.medium }]}>{label}</Text>
      <View
        style={[
          styles.inputWrap,
          {
            borderColor: error ? theme.colors.loss : theme.colors.border,
            backgroundColor: theme.colors.cardSolid
          }
        ]}
      >
        <Ionicons name={icon} size={15} color={theme.colors.muted} />
        <TextInput
          ref={inputRef}
          style={[styles.input, { color: theme.colors.text, fontFamily: theme.fonts.regular }]}
          placeholderTextColor={theme.colors.muted}
          {...props}
        />
      </View>
      {!!error && <Text style={[styles.errorText, { color: theme.colors.loss, fontFamily: theme.fonts.regular }]}>{error}</Text>}
    </>
  );
}

const getInitialForm = () => ({
  instrument: "NIFTY",
  optionType: "CALL",
  strikePrice: "",
  resultType: "PROFIT",
  amount: "",
  charges: "",
  tradeDate: new Date().toISOString().slice(0, 10)
});

export default function AddTradeScreen({ navigation }) {
  const { theme } = useAppTheme();
  const dialog = useDialog();
  const instrumentInputRef = useRef(null);
  const [form, setForm] = useState(getInitialForm);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [dateModalVisible, setDateModalVisible] = useState(false);
  const [successModalVisible, setSuccessModalVisible] = useState(false);

  const setField = (key, value) => {
    setForm((p) => ({ ...p, [key]: value }));
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const validateForm = () => {
    const nextErrors = {};
    if (!String(form.instrument || "").trim()) {
      nextErrors.instrument = "Instrument is required";
    }
    if (!form.resultType) {
      nextErrors.resultType = "Result is required";
    }
    if (String(form.amount || "").trim() === "") {
      nextErrors.amount = "Amount is required";
    } else {
      const amountNumber = Number(form.amount);
      if (!Number.isFinite(amountNumber) || amountNumber < 0) {
        nextErrors.amount = "Amount must be a valid non-negative number";
      }
    }
    if (String(form.charges || "").trim() === "") {
      nextErrors.charges = "Charges are required";
    } else {
      const chargesNumber = Number(form.charges);
      if (!Number.isFinite(chargesNumber) || chargesNumber < 0) {
        nextErrors.charges = "Charges must be a valid non-negative number";
      }
    }
    if (!String(form.tradeDate || "").trim()) {
      nextErrors.tradeDate = "Trade date is required";
    }
    return nextErrors;
  };

  const estimatedFinal = useMemo(() => {
    const amount = Number(form.amount || 0);
    const charges = Number(form.charges || 0);
    return form.resultType === "PROFIT" ? amount - charges : -(amount + charges);
  }, [form.amount, form.charges, form.resultType]);

  const submit = async () => {
    try {
      const nextErrors = validateForm();
      setErrors(nextErrors);
      if (Object.keys(nextErrors).length > 0) {
        return;
      }

      const amountNumber = Number(form.amount);
      const chargesNumber = Number(form.charges);

      setLoading(true);
      await api.post("/trades", {
        ...form,
        instrument: String(form.instrument).trim(),
        strikePrice: Number(form.strikePrice || 0),
        amount: amountNumber,
        charges: chargesNumber
      });
      setSuccessModalVisible(true);
    } catch (err) {
      dialog.show("Trade error", parseApiError(err, "Failed to add trade"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <KeyboardAwareScrollView
        style={[styles.container, { backgroundColor: theme.colors.bg }]}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        enableOnAndroid
        enableAutomaticScroll
        extraHeight={120}
        extraScrollHeight={100}
      >
        <Input
          theme={theme}
          label="Instrument"
          icon="stats-chart-outline"
          placeholder="NIFTY"
          value={form.instrument}
          onChangeText={(v) => setField("instrument", v)}
          inputRef={instrumentInputRef}
          error={errors.instrument}
        />

        <Text style={[styles.label, { color: theme.colors.text, fontFamily: theme.fonts.medium }]}>Option Type</Text>
        <View style={styles.row}>
          <Pressable style={[styles.pill, { borderColor: theme.colors.border, backgroundColor: theme.colors.cardSolid }, form.optionType === "CALL" && { borderColor: theme.colors.primary, backgroundColor: theme.colors.card }]} onPress={() => setField("optionType", "CALL")}>
            <Text style={[styles.pillText, { color: theme.colors.text, fontFamily: theme.fonts.medium }]}>CALL</Text>
          </Pressable>
          <Pressable style={[styles.pill, { borderColor: theme.colors.border, backgroundColor: theme.colors.cardSolid }, form.optionType === "PUT" && { borderColor: theme.colors.primary, backgroundColor: theme.colors.card }]} onPress={() => setField("optionType", "PUT")}>
            <Text style={[styles.pillText, { color: theme.colors.text, fontFamily: theme.fonts.medium }]}>PUT</Text>
          </Pressable>
        </View>

        <Text style={[styles.label, { color: theme.colors.text, fontFamily: theme.fonts.medium }]}>Result</Text>
        <View style={styles.row}>
          <Pressable style={[styles.pill, { borderColor: errors.resultType ? theme.colors.loss : theme.colors.border, backgroundColor: theme.colors.cardSolid }, form.resultType === "PROFIT" && { borderColor: theme.colors.profit }]} onPress={() => setField("resultType", "PROFIT")}>
            <Text style={[styles.pillText, { color: theme.colors.profit, fontFamily: theme.fonts.medium }]}>PROFIT</Text>
          </Pressable>
          <Pressable style={[styles.pill, { borderColor: errors.resultType ? theme.colors.loss : theme.colors.border, backgroundColor: theme.colors.cardSolid }, form.resultType === "LOSS" && { borderColor: theme.colors.loss }]} onPress={() => setField("resultType", "LOSS")}>
            <Text style={[styles.pillText, { color: theme.colors.loss, fontFamily: theme.fonts.medium }]}>LOSS</Text>
          </Pressable>
        </View>
        {!!errors.resultType && <Text style={[styles.errorText, { color: theme.colors.loss, fontFamily: theme.fonts.regular }]}>{errors.resultType}</Text>}

        <Input theme={theme} label="Strike Price" icon="radio-button-on-outline" keyboardType="numeric" value={form.strikePrice} onChangeText={(v) => setField("strikePrice", v)} />
        <Input theme={theme} label="Amount" icon="cash-outline" keyboardType="numeric" value={form.amount} onChangeText={(v) => setField("amount", v)} error={errors.amount} />
        <Input theme={theme} label="Charges" icon="receipt-outline" keyboardType="numeric" value={form.charges} onChangeText={(v) => setField("charges", v)} error={errors.charges} />

        <Text style={[styles.label, { color: theme.colors.text, fontFamily: theme.fonts.medium }]}>Trade Date</Text>
        <Pressable
          style={[styles.inputWrap, styles.dateField, { borderColor: errors.tradeDate ? theme.colors.loss : theme.colors.border, backgroundColor: theme.colors.cardSolid }]}
          onPress={() => setDateModalVisible(true)}
        >
          <Ionicons name="calendar-outline" size={15} color={theme.colors.muted} />
          <Text style={[styles.dateText, { color: theme.colors.text, fontFamily: theme.fonts.regular }]}>{form.tradeDate}</Text>
          <Ionicons name="chevron-down-outline" size={16} color={theme.colors.muted} />
        </Pressable>
        {!!errors.tradeDate && <Text style={[styles.errorText, { color: theme.colors.loss, fontFamily: theme.fonts.regular }]}>{errors.tradeDate}</Text>}

        <View style={[styles.previewCard, { borderColor: theme.colors.border, backgroundColor: theme.colors.card }]}>
          <Text style={{ color: theme.colors.muted, fontFamily: theme.fonts.regular }}>Estimated Final</Text>
          <Text style={{ color: estimatedFinal >= 0 ? theme.colors.profit : theme.colors.loss, fontFamily: theme.fonts.bold }}>
            Rs {Number(estimatedFinal || 0).toFixed(2)}
          </Text>
        </View>

        <Pressable style={[styles.btn, { backgroundColor: theme.colors.primary }]} onPress={submit} disabled={loading}>
          <Text style={[styles.btnText, { fontFamily: theme.fonts.bold }]}>{loading ? "Saving..." : "Save Trade"}</Text>
        </Pressable>
      </KeyboardAwareScrollView>

      <Modal visible={dateModalVisible} transparent animationType="fade" onRequestClose={() => setDateModalVisible(false)}>
        <View style={[styles.modalOverlay, { backgroundColor: theme.colors.overlay }]}>
          <View style={[styles.modalCard, { backgroundColor: theme.colors.cardSolid, borderColor: theme.colors.border }]}>
            <Text style={[styles.modalTitle, { color: theme.colors.text, fontFamily: theme.fonts.bold }]}>Select Trade Date</Text>
            <Calendar
              current={form.tradeDate}
              markedDates={{
                [form.tradeDate]: {
                  selected: true,
                  selectedColor: theme.colors.primary
                }
              }}
              onDayPress={(day) => {
                setField("tradeDate", day.dateString);
                setDateModalVisible(false);
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
            <Pressable style={[styles.modalCloseBtn, { borderColor: theme.colors.border }]} onPress={() => setDateModalVisible(false)}>
              <Text style={{ color: theme.colors.text, fontFamily: theme.fonts.medium }}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal visible={successModalVisible} transparent animationType="fade" onRequestClose={() => setSuccessModalVisible(false)}>
        <View style={[styles.modalOverlay, { backgroundColor: theme.colors.overlay }]}>
          <BlurView
            intensity={32}
            tint={theme.isDark ? "dark" : "light"}
            style={[styles.successCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
          >
            <Ionicons name="checkmark-circle-outline" size={36} color={theme.colors.primary} />
            <Text style={[styles.successTitle, { color: theme.colors.text, fontFamily: theme.fonts.bold }]}>Trade Added</Text>
            <Text style={[styles.successText, { color: theme.colors.muted, fontFamily: theme.fonts.regular }]}>
              What do you want to do next?
            </Text>
            <View style={styles.successActions}>
              <Pressable
                style={[styles.ghostBtn, { borderColor: theme.colors.border, backgroundColor: theme.colors.cardSolid }]}
                onPress={() => {
                  setSuccessModalVisible(false);
                  setForm(getInitialForm());
                  setErrors({});
                  setTimeout(() => instrumentInputRef.current?.focus(), 120);
                }}
              >
                <Text style={{ color: theme.colors.text, fontFamily: theme.fonts.medium }}>Add More</Text>
              </Pressable>
              <Pressable
                style={[styles.primaryBtn, { backgroundColor: theme.colors.primary }]}
                onPress={() => {
                  setSuccessModalVisible(false);
                  navigation.goBack();
                }}
              >
                <Text style={{ color: "#fff", fontFamily: theme.fonts.bold }}>Done</Text>
              </Pressable>
            </View>
          </BlurView>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  content: {
    padding: 16,
    paddingBottom: 96
  },
  label: {
    marginBottom: 5
  },
  errorText: {
    fontSize: 12,
    marginTop: -6,
    marginBottom: 8
  },
  inputWrap: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    minHeight: 46
  },
  input: {
    flex: 1,
    paddingVertical: 12
  },
  dateField: {
    justifyContent: "space-between"
  },
  dateText: {
    flex: 1,
    marginLeft: 8
  },
  row: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 10
  },
  pill: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: 11,
    alignItems: "center"
  },
  pillText: {
    fontSize: 13
  },
  previewCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8
  },
  btn: {
    marginTop: 8,
    borderRadius: 12,
    alignItems: "center",
    paddingVertical: 13
  },
  btnText: {
    color: "#fff",
    fontSize: 15
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    padding: 18
  },
  modalCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 12
  },
  modalTitle: {
    fontSize: 16,
    marginBottom: 8
  },
  modalCloseBtn: {
    marginTop: 10,
    borderWidth: 1,
    borderRadius: 10,
    alignItems: "center",
    paddingVertical: 10
  },
  successCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    alignItems: "center",
    overflow: "hidden"
  },
  successTitle: {
    marginTop: 8,
    fontSize: 19
  },
  successText: {
    marginTop: 4,
    marginBottom: 14
  },
  successActions: {
    width: "100%",
    flexDirection: "row",
    gap: 10
  },
  ghostBtn: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    alignItems: "center",
    paddingVertical: 11
  },
  primaryBtn: {
    flex: 1,
    borderRadius: 10,
    alignItems: "center",
    paddingVertical: 11
  }
});

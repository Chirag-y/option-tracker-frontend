import React, { useMemo, useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { useAppTheme } from "../hooks/useAppTheme";

export default function FilterSelect({
  label,
  value,
  options,
  onSelect,
  placeholder,
  helper,
  icon
}) {
  const { theme } = useAppTheme();
  const [visible, setVisible] = useState(false);
  const selected = useMemo(() => options.find((item) => item.value === value), [options, value]);

  return (
    <>
      {!!label && <Text style={[styles.label, { color: theme.colors.text, fontFamily: theme.fonts.medium }]}>{label}</Text>}
      <Pressable
        style={[
          styles.field,
          { borderColor: theme.colors.border, backgroundColor: theme.colors.cardSolid }
        ]}
        onPress={() => setVisible(true)}
      >
        {icon ? <Ionicons name={icon} size={16} color={theme.colors.muted} style={{ marginRight: 6 }} /> : null}
        <Text style={[styles.value, { color: theme.colors.text, fontFamily: theme.fonts.regular }]}>
          {selected?.label || placeholder || "Select"}
        </Text>
        <Ionicons name="chevron-down-outline" size={16} color={theme.colors.muted} />
      </Pressable>
      {!!helper && <Text style={[styles.helper, { color: theme.colors.muted, fontFamily: theme.fonts.regular }]}>{helper}</Text>}

      <Modal transparent visible={visible} animationType="fade" onRequestClose={() => setVisible(false)}>
        <View style={[styles.modalOverlay, { backgroundColor: theme.colors.overlay }]}>
          <BlurView intensity={32} tint={theme.isDark ? "dark" : "light"} style={[styles.modalCard, { borderColor: theme.colors.border, backgroundColor: theme.colors.cardSolid }]}>
            <Text style={[styles.modalTitle, { color: theme.colors.text, fontFamily: theme.fonts.bold }]}>{label || "Choose"}</Text>
            <ScrollView style={{ maxHeight: 280 }}>
              {options.map((opt) => (
                <Pressable
                  key={opt.value}
                  style={({ pressed }) => [
                    styles.option,
                    { backgroundColor: pressed ? theme.colors.card : theme.colors.cardSolid },
                    selected?.value === opt.value && { borderColor: theme.colors.primary, borderWidth: 1 }
                  ]}
                  onPress={() => {
                    onSelect(opt.value);
                    setVisible(false);
                  }}
                >
                  <Text style={{ color: theme.colors.text, fontFamily: theme.fonts.medium }}>{opt.label}</Text>
                </Pressable>
              ))}
            </ScrollView>
            <Pressable style={[styles.cancelBtn, { borderColor: theme.colors.border }]} onPress={() => setVisible(false)}>
              <Text style={{ color: theme.colors.text, fontFamily: theme.fonts.medium }}>Cancel</Text>
            </Pressable>
          </BlurView>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  label: {
    marginBottom: 4,
    fontSize: 13
  },
  field: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 4,
    marginBottom: 6
  },
  value: {
    flex: 1,
    fontSize: 14
  },
  helper: {
    fontSize: 11,
    marginBottom: 6
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    padding: 20
  },
  modalCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16
  },
  modalTitle: {
    fontSize: 18,
    marginBottom: 12
  },
  option: {
    borderWidth: 1,
    borderColor: "transparent",
    borderRadius: 12,
    padding: 12,
    marginBottom: 8
  },
  cancelBtn: {
    marginTop: 10,
    borderWidth: 1,
    borderRadius: 10,
    alignItems: "center",
    paddingVertical: 10
  }
});

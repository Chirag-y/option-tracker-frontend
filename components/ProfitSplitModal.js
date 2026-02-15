import React from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { BlurView } from "expo-blur";
import { useAppTheme } from "../hooks/useAppTheme";
import { money } from "../theme";

export default function ProfitSplitModal({ visible, onClose, users }) {
  const { theme } = useAppTheme();
  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <View style={[styles.overlay, { backgroundColor: theme.colors.overlay }]}>
        <BlurView
          intensity={38}
          tint={theme.isDark ? "dark" : "light"}
          style={[styles.sheet, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
        >
          <Text style={[styles.title, { color: theme.colors.text, fontFamily: theme.fonts.bold }]}>
            Team Split Snapshot
          </Text>
          {users.map((u) => (
            <View key={u._id} style={styles.row}>
              <View>
                <Text style={[styles.name, { color: theme.colors.text, fontFamily: theme.fonts.medium }]}>{u.name}</Text>
                <Text style={[styles.value, { color: theme.colors.muted, fontFamily: theme.fonts.regular }]}>
                  Invested: {money(u.investedAmount)}
                </Text>
                <Text
                  style={[
                    styles.value,
                    {
                      color: Number(u.currentBalance) - Number(u.investedAmount) >= 0 ? theme.colors.profit : theme.colors.loss,
                      fontFamily: theme.fonts.regular
                    }
                  ]}
                >
                  P/L: {money(Number(u.currentBalance) - Number(u.investedAmount))}
                </Text>
              </View>
              <Text style={[styles.value, { color: theme.colors.primary, fontFamily: theme.fonts.bold }]}>
                {u.sharePercentage}% | Final {money(u.currentBalance)}
              </Text>
            </View>
          ))}
          <Pressable style={[styles.btn, { backgroundColor: theme.colors.primary }]} onPress={onClose}>
            <Text style={[styles.btnText, { fontFamily: theme.fonts.bold }]}>Close</Text>
          </Pressable>
        </BlurView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
    padding: 20
  },
  sheet: {
    width: "100%",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    overflow: "hidden"
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6
  },
  name: {
  },
  value: {
  },
  btn: {
    marginTop: 12,
    borderRadius: 10,
    alignItems: "center",
    paddingVertical: 10
  },
  btnText: {
    color: "#fff",
    fontWeight: "700"
  }
});

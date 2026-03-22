import React, { useContext, useEffect, useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Calendar } from "react-native-calendars";
import api from "../services/api";
import { AuthContext } from "../context/AuthContext";
import { useAppTheme } from "../hooks/useAppTheme";
import { useDialog } from "../hooks/useDialog";
import { parseApiError } from "../utils/errors";
import { formatDisplayDate } from "../utils/date";

export default function ProfileScreen() {
  const { theme } = useAppTheme();
  const dialog = useDialog();
  const { user, refreshMe } = useContext(AuthContext);
  const [name, setName] = useState("");
  const [investedAmount, setInvestedAmount] = useState("");
  const [sharePercentage, setSharePercentage] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawDate, setWithdrawDate] = useState(new Date().toISOString().slice(0, 10));
  const [withdrawals, setWithdrawals] = useState([]);
  const [dateModal, setDateModal] = useState(false);

  useEffect(() => {
    setName(user?.name || "");
    setInvestedAmount(String(user?.investedAmount ?? 0));
    setSharePercentage(String(user?.sharePercentage ?? 0));
  }, [user?.name, user?.investedAmount, user?.sharePercentage]);

  const loadWithdrawals = async () => {
    try {
      const res = await api.get("/users/me/withdrawals");
      setWithdrawals(res.data || []);
    } catch (err) {
      dialog.show("Withdrawal error", parseApiError(err, "Failed to load withdrawals"));
    }
  };

  useEffect(() => {
    loadWithdrawals();
  }, []);

  const updateProfile = async () => {
    try {
      const data = await api.patch("/users/me", {
        name: String(name || "").trim(),
        investedAmount: Number(investedAmount || 0),
        sharePercentage: Number(sharePercentage || 0)
      });
      // console.log({data})
      await refreshMe();
      dialog.show("Saved", "Profile updated");
    } catch (err) {
      console.log({err});
      dialog.show("Profile error", parseApiError(err, "Failed to update profile"));
    }
  };

  const updatePassword = async () => {
    try {
      await api.patch("/users/me/password", {
        currentPassword,
        newPassword
      });
      setCurrentPassword("");
      setNewPassword("");
      dialog.show("Saved", "Password updated");
    } catch (err) {
      dialog.show("Password error", parseApiError(err, "Failed to update password"));
    }
  };

  const addWithdrawal = async () => {
    try {
      await api.post("/users/me/withdrawals", {
        amount: Number(withdrawAmount || 0),
        withdrawalDate: withdrawDate
      });
      setWithdrawAmount("");
      setWithdrawDate(new Date().toISOString().slice(0, 10));
      await refreshMe();
      await loadWithdrawals();
      dialog.show("Saved", "Withdrawal added and balance adjusted.");
    } catch (err) {
      dialog.show("Withdrawal error", parseApiError(err, "Failed to add withdrawal"));
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.bg }]} contentContainerStyle={styles.content}>
      <View style={[styles.card, { borderColor: theme.colors.border, backgroundColor: theme.colors.card }]}>
        <Text style={[styles.title, { color: theme.colors.text, fontFamily: theme.fonts.bold }]}>Profile</Text>
        <Text style={{ color: theme.colors.muted, fontFamily: theme.fonts.regular }}>{user?.email}</Text>
        <Text style={{ color: theme.colors.muted, fontFamily: theme.fonts.regular }}>Team: {user?.teamCode}</Text>

        <Text style={[styles.label, { color: theme.colors.text, fontFamily: theme.fonts.medium }]}>Name</Text>
        <TextInput style={[styles.input, { borderColor: theme.colors.border, color: theme.colors.text, backgroundColor: theme.colors.cardSolid }]} value={name} onChangeText={setName} />

        <Text style={[styles.label, { color: theme.colors.text, fontFamily: theme.fonts.medium }]}>Invested Amount</Text>
        <TextInput style={[styles.input, { borderColor: theme.colors.border, color: theme.colors.text, backgroundColor: theme.colors.cardSolid }]} keyboardType="numeric" value={investedAmount} onChangeText={setInvestedAmount} />

        <Text style={[styles.label, { color: theme.colors.text, fontFamily: theme.fonts.medium }]}>Share %</Text>
        <TextInput style={[styles.input, { borderColor: theme.colors.border, color: theme.colors.text, backgroundColor: theme.colors.cardSolid }]} keyboardType="numeric" value={sharePercentage} onChangeText={setSharePercentage} />

        <Pressable style={[styles.btn, { backgroundColor: theme.colors.primary }]} onPress={updateProfile}>
          <Text style={{ color: "#fff", fontFamily: theme.fonts.bold }}>Update Profile</Text>
        </Pressable>
      </View>

      <View style={[styles.card, { borderColor: theme.colors.border, backgroundColor: theme.colors.card }]}>
        <Text style={[styles.title, { color: theme.colors.text, fontFamily: theme.fonts.bold }]}>Password</Text>
        <Text style={[styles.label, { color: theme.colors.text, fontFamily: theme.fonts.medium }]}>Current Password</Text>
        <TextInput style={[styles.input, { borderColor: theme.colors.border, color: theme.colors.text, backgroundColor: theme.colors.cardSolid }]} secureTextEntry value={currentPassword} onChangeText={setCurrentPassword} />
        <Text style={[styles.label, { color: theme.colors.text, fontFamily: theme.fonts.medium }]}>New Password</Text>
        <TextInput style={[styles.input, { borderColor: theme.colors.border, color: theme.colors.text, backgroundColor: theme.colors.cardSolid }]} secureTextEntry value={newPassword} onChangeText={setNewPassword} />
        <Pressable style={[styles.btn, { backgroundColor: theme.colors.primary }]} onPress={updatePassword}>
          <Text style={{ color: "#fff", fontFamily: theme.fonts.bold }}>Update Password</Text>
        </Pressable>
      </View>

      <View style={[styles.card, { borderColor: theme.colors.border, backgroundColor: theme.colors.card }]}>
        <Text style={[styles.title, { color: theme.colors.text, fontFamily: theme.fonts.bold }]}>Withdrawals</Text>
        <Text style={[styles.label, { color: theme.colors.text, fontFamily: theme.fonts.medium }]}>Amount</Text>
        <TextInput style={[styles.input, { borderColor: theme.colors.border, color: theme.colors.text, backgroundColor: theme.colors.cardSolid }]} keyboardType="numeric" value={withdrawAmount} onChangeText={setWithdrawAmount} />
        <Text style={[styles.label, { color: theme.colors.text, fontFamily: theme.fonts.medium }]}>Date</Text>
        <Pressable style={[styles.input, { borderColor: theme.colors.border, backgroundColor: theme.colors.cardSolid }]} onPress={() => setDateModal(true)}>
          <Text style={{ color: theme.colors.text, fontFamily: theme.fonts.regular }}>{formatDisplayDate(withdrawDate)}</Text>
        </Pressable>
        <Pressable style={[styles.btn, { backgroundColor: theme.colors.primary }]} onPress={addWithdrawal}>
          <Text style={{ color: "#fff", fontFamily: theme.fonts.bold }}>Add Withdrawal</Text>
        </Pressable>

        {withdrawals.map((w) => (
          <View key={w._id} style={[styles.withdrawItem, { borderColor: theme.colors.border }]}>
            <Text style={{ color: theme.colors.text, fontFamily: theme.fonts.medium }}>
              Rs {Number(w.amount || 0).toFixed(2)}
            </Text>
            <Text style={{ color: theme.colors.muted, fontFamily: theme.fonts.regular }}>
              {formatDisplayDate(w.withdrawalDate)}
            </Text>
          </View>
        ))}
      </View>

      <Modal transparent visible={dateModal} onRequestClose={() => setDateModal(false)}>
        <View style={[styles.modalOverlay, { backgroundColor: theme.colors.overlay }]}>
          <View style={[styles.modalCard, { borderColor: theme.colors.border, backgroundColor: theme.colors.cardSolid }]}>
            <Calendar
              onDayPress={(d) => {
                setWithdrawDate(d.dateString);
                setDateModal(false);
              }}
            />
            <Pressable style={[styles.btn, { backgroundColor: theme.colors.primary }]} onPress={() => setDateModal(false)}>
              <Text style={{ color: "#fff", fontFamily: theme.fonts.bold }}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  content: {
    padding: 12,
    paddingBottom: 24
  },
  card: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10
  },
  title: {
    fontSize: 18,
    marginBottom: 2
  },
  label: {
    marginTop: 8,
    marginBottom: 4
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 10
  },
  btn: {
    marginTop: 10,
    borderRadius: 10,
    alignItems: "center",
    paddingVertical: 10
  },
  withdrawItem: {
    marginTop: 8,
    borderWidth: 1,
    borderRadius: 10,
    padding: 10
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    padding: 16
  },
  modalCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 10
  }
});

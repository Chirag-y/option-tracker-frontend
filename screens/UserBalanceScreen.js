import React, { useContext, useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  RefreshControl
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import api from "../services/api";
import { AuthContext } from "../context/AuthContext";
import { useAppTheme } from "../hooks/useAppTheme";
import { useDialog } from "../hooks/useDialog";
import { parseApiError } from "../utils/errors";
import { formatDisplayDate } from "../utils/date";
import { money } from "../theme";

function Input({ theme, icon, ...props }) {
  return (
    <View style={[styles.inputWrap, { borderColor: theme.colors.border, backgroundColor: theme.colors.cardSolid }]}>
      <Ionicons name={icon} size={15} color={theme.colors.muted} />
      <TextInput
        style={[styles.input, { color: theme.colors.text, fontFamily: theme.fonts.regular }]}
        placeholderTextColor={theme.colors.muted}
        {...props}
      />
    </View>
  );
}

export default function UserBalanceScreen() {
  const { theme } = useAppTheme();
  const dialog = useDialog();
  const { user, refreshMe } = useContext(AuthContext);
  const [users, setUsers] = useState([]);
  const [teamWithdrawals, setTeamWithdrawals] = useState([]);
  const [share, setShare] = useState("");
  const [invested, setInvested] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const res = await api.get("/users/balances");
      const wdRes = await api.get("/users/team-withdrawals");
      setUsers(res.data);
      setTeamWithdrawals(wdRes.data || []);
      const me = res.data.find((u) => u._id === user?.id || u.email === user?.email);
      if (me) {
        setShare(String(me.sharePercentage));
        setInvested(String(me.investedAmount));
      }
    } catch (err) {
      dialog.show("Users error", parseApiError(err, "Failed to load users"));
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  useEffect(() => {
    load();
  }, [user?.id, user?.email]);

  const saveMySplit = async () => {
    try {
      const data = await api.patch("/users/me", {
        sharePercentage: Number(share || 0),
        investedAmount: Number(invested || 0)
      });
      await refreshMe();
      await load();
      // console.log({ data });
      dialog.show("Saved", "Your split settings are updated");
    } catch (err) {
      console.log({ err });
      dialog.show("Update error", parseApiError(err, "Update failed"));
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.colors.bg }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={[theme.colors.primary]}
          tintColor={theme.colors.primary}
        />
      }>
        <Text style={[styles.title, { color: theme.colors.text, fontFamily: theme.fonts.bold }]}>Team Balances</Text>
        {users.map((u) => (
          <View style={[styles.userCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]} key={u._id}>
            <Text style={[styles.name, { color: theme.colors.text, fontFamily: theme.fonts.bold }]}>{u.name}</Text>
            <Text style={[styles.meta, { color: theme.colors.muted, fontFamily: theme.fonts.regular }]}>{u.email}</Text>
            <Text style={[styles.meta, { color: theme.colors.muted, fontFamily: theme.fonts.regular }]}>
              Share {u.sharePercentage}%
            </Text>
            <Text style={[styles.meta, { color: theme.colors.muted, fontFamily: theme.fonts.regular }]}>
              Invested: {money(u.investedAmount)}
            </Text>
            <Text style={[styles.meta, { color: Number(u.currentBalance) - Number(u.investedAmount) >= 0 ? theme.colors.profit : theme.colors.loss, fontFamily: theme.fonts.medium }]}>
              P/L: {money(Number(u.currentBalance) - Number(u.investedAmount))}
            </Text>
            <Text style={[styles.balance, { color: theme.colors.primary, fontFamily: theme.fonts.bold }]}>
              Final: {money(u.currentBalance)}
            </Text>
          </View>
        ))}

        <Text style={[styles.title, { color: theme.colors.text, fontFamily: theme.fonts.bold }]}>Update My Allocation</Text>
        <Input theme={theme} icon="pie-chart-outline" placeholder="My Share %" value={share} onChangeText={setShare} keyboardType="numeric" />
        <Input theme={theme} icon="wallet-outline" placeholder="My Invested Amount" value={invested} onChangeText={setInvested} keyboardType="numeric" />
        <Pressable style={[styles.btn, { backgroundColor: theme.colors.primary }]} onPress={saveMySplit}>
          <Text style={[styles.btnText, { fontFamily: theme.fonts.bold }]}>Save Allocation</Text>
        </Pressable>

        <Text style={[styles.title, { color: theme.colors.text, fontFamily: theme.fonts.bold, marginTop: 16 }]}>Team Withdrawals</Text>
        {teamWithdrawals.map((w) => (
          <View key={w._id} style={[styles.userCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
            <Text style={[styles.name, { color: theme.colors.text, fontFamily: theme.fonts.bold }]}>
              {w.userId?.name || "User"} - Rs {Number(w.amount || 0).toFixed(2)}
            </Text>
            <Text style={[styles.meta, { color: theme.colors.muted, fontFamily: theme.fonts.regular }]}>
              {formatDisplayDate(w.withdrawalDate)}
            </Text>
            <Text style={[styles.meta, { color: theme.colors.muted, fontFamily: theme.fonts.regular }]}>
              {w.userId?.email || ""}
            </Text>
          </View>
        ))}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 12
  },
  content: {
    paddingBottom: 24
  },
  title: {
    fontSize: 17,
    marginBottom: 8
  },
  userCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginBottom: 8
  },
  name: {
    fontSize: 16
  },
  meta: {
    marginTop: 2
  },
  balance: {
    marginTop: 4
  },
  inputWrap: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  input: {
    flex: 1,
    paddingVertical: 12
  },
  btn: {
    borderRadius: 12,
    alignItems: "center",
    paddingVertical: 12
  },
  btnText: {
    color: "#fff"
  }
});

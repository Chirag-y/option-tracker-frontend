import React, { useCallback, useContext, useState } from "react";
import { FlatList, Image, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import api from "../services/api";
import { AuthContext } from "../context/AuthContext";
import SummaryCard from "../components/SummaryCard";
import TradeCard from "../components/TradeCard";
import ProfitSplitModal from "../components/ProfitSplitModal";
import { useAppTheme } from "../hooks/useAppTheme";
import { useDialog } from "../hooks/useDialog";
import { parseApiError } from "../utils/errors";
import { money } from "../theme";

export default function DashboardScreen({ navigation }) {
  const { user, logout } = useContext(AuthContext);
  const { theme, mode, setThemeMode, resolvedMode } = useAppTheme();
  const dialog = useDialog();
  const [trades, setTrades] = useState([]);
  const [users, setUsers] = useState([]);
  const [teamStatus, setTeamStatus] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showSplit, setShowSplit] = useState(false);

  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      const [tradeRes, userRes] = await Promise.all([api.get("/trades"), api.get("/users/balances")]);
      const statusRes = await api.get("/users/team-status");
      setTrades(tradeRes.data);
      setUsers(userRes.data);
      setTeamStatus(statusRes.data);
    } catch (err) {
      dialog.show("Dashboard error", parseApiError(err, "Failed to load dashboard"));
    } finally {
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const onDelete = async (id) => {
    try {
      await api.delete(`/trades/${id}`);
      await load();
    } catch (err) {
      dialog.show("Delete error", parseApiError(err, "Delete failed"));
    }
  };

  const totalPnl = trades.reduce((sum, t) => sum + Number(t.finalAmount || 0), 0);
  const totalCharges = trades.reduce((sum, t) => sum + Number(t.charges || 0), 0);
  const monthlyTag = new Date().toISOString().slice(0, 7);
  const monthlyTrades = trades.filter((t) => new Date(t.tradeDate).toISOString().startsWith(monthlyTag));
  const monthlyPnl = monthlyTrades.reduce((sum, t) => sum + Number(t.finalAmount || 0), 0);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.bg }]}>
      <View style={styles.header}>
        <View>
          {/* <Image source={require("../assets/images/app_icon_512x512.png")} style={styles.logo} /> */}
          <Text style={[styles.welcome, { color: theme.colors.text, fontFamily: theme.fonts.bold }]}>
            Hi {user?.name || "Trader"}
          </Text>
          <Text style={[styles.team, { color: theme.colors.muted, fontFamily: theme.fonts.regular }]}>
            Team: {user?.teamCode || "-"}
          </Text>
        </View>
        <View style={styles.headerActions}>
          {/* <Pressable
            onPress={() => setThemeMode("system")}
            style={[
              styles.iconBtn,
              { borderColor: theme.colors.border, backgroundColor: theme.colors.cardSolid },
              mode === "system" && { borderColor: theme.colors.primary, borderWidth: 1.5 }
            ]}
          >
            <Ionicons name="phone-portrait-outline" size={16} color={mode === "system" ? theme.colors.primary : theme.colors.primaryDark} />
          </Pressable> */}
          <Pressable
            onPress={() => setThemeMode("light")}
            style={[
              styles.iconBtn,
              { borderColor: theme.colors.border, backgroundColor: theme.colors.cardSolid },
              mode === "light" && { borderColor: theme.colors.primary, borderWidth: 1.5 }
            ]}
          >
            <Ionicons name="sunny-outline" size={16} color={mode === "light" ? theme.colors.primary : theme.colors.primaryDark} />
          </Pressable>
          <Pressable
            onPress={() => setThemeMode("dark")}
            style={[
              styles.iconBtn,
              { borderColor: theme.colors.border, backgroundColor: theme.colors.cardSolid },
              mode === "dark" && { borderColor: theme.colors.primary, borderWidth: 1.5 }
            ]}
          >
            <Ionicons name="moon-outline" size={16} color={mode === "dark" ? theme.colors.primary : theme.colors.primaryDark} />
          </Pressable>
          <Pressable onPress={logout} style={[styles.iconBtn, { borderColor: theme.colors.border, backgroundColor: theme.colors.cardSolid }]}>
            <Ionicons name="log-out-outline" size={16} color={theme.colors.loss} />
          </Pressable>
        </View>
      </View>
      {/* <Text style={[styles.modeLabel, { color: theme.colors.muted, fontFamily: theme.fonts.regular }]}>
        Theme: {mode === "system" ? `System (${resolvedMode})` : mode}
      </Text> */}

      {!user?.isTeamApproved ? (
        <BlurView
          intensity={28}
          tint={theme.isDark ? "dark" : "light"}
          style={[styles.lockedCard, { borderColor: theme.colors.border, backgroundColor: theme.colors.card }]}
        >
          <Ionicons name="shield-outline" size={20} color={theme.colors.primary} />
          <Text style={[styles.lockedTitle, { color: theme.colors.text, fontFamily: theme.fonts.bold }]}>
            Team Membership Pending
          </Text>
          <Text style={[styles.lockedText, { color: theme.colors.muted, fontFamily: theme.fonts.regular }]}>
            Your admin verification is complete. Full access will unlock after an approved team member confirms your membership request.
          </Text>
        </BlurView>
      ) : null}

      {!!teamStatus && !teamStatus.canTrade && (
        <View style={[styles.warningBanner, { borderColor: theme.colors.loss, backgroundColor: theme.colors.cardSolid }]}>
          <Ionicons name="alert-circle-outline" size={16} color={theme.colors.loss} />
          <Text style={[styles.warningText, { color: theme.colors.loss, fontFamily: theme.fonts.medium }]}>
            {teamStatus.message}
          </Text>
        </View>
      )}

      <View style={styles.summaryRow}>
        <SummaryCard label="Net P/L" value={money(totalPnl)} tone={totalPnl >= 0 ? "profit" : "loss"} />
        <SummaryCard label="This Month" value={money(monthlyPnl)} tone={monthlyPnl >= 0 ? "profit" : "loss"} />
      </View>
      <View style={styles.summaryRow}>
        <SummaryCard label="Total Charges" value={money(totalCharges)} tone="loss" />
        <SummaryCard label="Trades" value={String(trades.length)} />
      </View>

      <Text style={[styles.listTitle, { color: theme.colors.text, fontFamily: theme.fonts.bold }]}>Recent Trades</Text>
      <FlatList
        data={trades.slice(0, 5)}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) =>
          user?.isTeamApproved ? <TradeCard trade={item} onDelete={onDelete} /> : null
        }
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} tintColor={theme.colors.primary} />}
      />

      <ProfitSplitModal visible={showSplit} onClose={() => setShowSplit(false)} users={users} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 14
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12
  },
  logo: {
    width: 38,
    height: 38,
    borderRadius: 10,
    marginBottom: 6
  },
  headerActions: {
    flexDirection: "row",
    gap: 8
  },
  iconBtn: {
    height: 34,
    width: 34,
    borderWidth: 1,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center"
  },
  welcome: {
    fontSize: 24
  },
  team: {
    marginTop: 2
  },
  modeLabel: {
    marginBottom: 10,
    fontSize: 12
  },
  warningBanner: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    flexDirection: "row",
    gap: 8,
    alignItems: "center"
  },
  warningText: {
    flex: 1,
    fontSize: 12
  },
  summaryRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 10
  },
  lockedCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    overflow: "hidden"
  },
  lockedTitle: {
    marginTop: 6,
    fontSize: 16
  },
  lockedText: {
    marginTop: 4,
    fontSize: 12
  },
  listTitle: {
    marginTop: 8,
    marginBottom: 8,
    fontSize: 18
  }
});

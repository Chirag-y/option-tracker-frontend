import React, { useCallback, useContext, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  FlatList,
  Image,
  LayoutAnimation,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  UIManager,
  View
} from "react-native";
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
import { subscribeToRealtimeEvents } from "../hooks/notificationCenter";
import { parseApiError } from "../utils/errors";
import { money } from "../theme";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function DashboardScreen({ navigation }) {
  const { user, logout } = useContext(AuthContext);
  const { theme, mode, setThemeMode, resolvedMode } = useAppTheme();
  const dialog = useDialog();
  const [trades, setTrades] = useState([]);
  const [users, setUsers] = useState([]);
  const [teamStatus, setTeamStatus] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showSplit, setShowSplit] = useState(false);
  const [results, setResults] = useState({ monthlyChange: 0, totalChange: 0 });
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  const load = useCallback(async () => {
    setRefreshing(true);
    setDashboardLoading(true);
    try {
      const [tradeRes, userRes, statusRes, resultsRes] = await Promise.all([
        api.get("/trades"),
        api.get("/users/balances"),
        api.get("/users/team-status"),
        api.get("/users/me/results")
      ]);
      // console.log({tradeRes, userRes, statusRes, resultsRes})
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setTrades(tradeRes.data);
      setUsers(userRes.data);
      setTeamStatus(statusRes.data);
      setResults(resultsRes.data || { monthlyChange: 0, totalChange: 0 });
      // console.log("summaryTiles", summaryTiles, dashboardLoading);
    } catch (err) {
      console.log({ err, api });
      dialog.show("Dashboard error", parseApiError(err, "Failed to load dashboard"));
    } finally {
      setRefreshing(false);
      setDashboardLoading(false);
    }
  }, [dialog]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  useEffect(() => {
    const unsubscribe = subscribeToRealtimeEvents(() => {
      load();
    });
    return unsubscribe;
  }, [load]);

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 900,
          useNativeDriver: true
        })
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [shimmerAnim]);

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
  const latestTradeDate = trades.length
    ? trades.reduce((latest, trade) => {
        const tradeTime = new Date(trade.tradeDate).getTime();
        return tradeTime > latest ? tradeTime : latest;
      }, 0)
    : null;
  const latestTradeDay = latestTradeDate ? new Date(latestTradeDate).toISOString().slice(0, 10) : null;
  const lastDayTrades = latestTradeDay
    ? trades.filter((t) => new Date(t.tradeDate).toISOString().slice(0, 10) === latestTradeDay)
    : [];
  const lastDayResult = lastDayTrades.reduce((sum, t) => sum + Number(t.finalAmount || 0), 0);
  const userMonthly = Number(results.monthlyChange || 0);
  const userTotal = Number(results.totalChange || 0);
  const summaryTiles = [
    { label: "Net P/L", value: money(totalPnl), tone: totalPnl >= 0 ? "profit" : "loss" },
    { label: "This Month", value: money(monthlyPnl), tone: monthlyPnl >= 0 ? "profit" : "loss" },
    {
      label: "Your Monthly Result",
      value: money(userMonthly),
      tone: userMonthly >= 0 ? "profit" : "loss"
    },
    { label: "Last Day Result", value: money(lastDayResult), tone: lastDayResult >= 0 ? "profit" : "loss" },
    { label: "Overall Result", value: money(userTotal), tone: userTotal >= 0 ? "profit" : "loss" },
    { label: "Total Charges", value: money(totalCharges), tone: "loss" }
  ];
  const skeletonOpacity = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.8]
  });
  const skeletonCards = Array.from({ length: summaryTiles.length }).map((_, index) => (
    <Animated.View
      key={`skeleton-${index}`}
      style={[
        styles.summaryTile,
        styles.summarySkeleton,
        {
          opacity: skeletonOpacity,
          borderColor: theme.colors.border,
          backgroundColor: theme.colors.cardSolid
        }
      ]}
    />
  ));

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
            accessibilityRole="button"
            accessibilityLabel="Switch to light theme"
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
            accessibilityRole="button"
            accessibilityLabel="Switch to dark theme"
            onPress={() => setThemeMode("dark")}
            style={[
              styles.iconBtn,
              { borderColor: theme.colors.border, backgroundColor: theme.colors.cardSolid },
              mode === "dark" && { borderColor: theme.colors.primary, borderWidth: 1.5 }
            ]}
          >
            <Ionicons name="moon-outline" size={16} color={mode === "dark" ? theme.colors.primary : theme.colors.primaryDark} />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Log out"
            onPress={logout}
            style={[styles.iconBtn, { borderColor: theme.colors.border, backgroundColor: theme.colors.cardSolid }]}
          >
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

      <View style={styles.summaryGrid}>
        {dashboardLoading ? (
          skeletonCards
        ) : (
          summaryTiles.map((tile) => { 
            // console.log({tile});
            return(
            <View key={tile.label} style={styles.summaryTile}>
              <SummaryCard label={tile.label} value={tile.value} tone={tile.tone} />
            </View>
          )})
        )}
      </View>

      <Text style={[styles.listTitle, { color: theme.colors.text, fontFamily: theme.fonts.bold }]}>Recent Trades</Text>
      <FlatList
        data={trades.slice(0, 5)}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) =>
          user?.isTeamApproved ? <TradeCard trade={item} onDelete={onDelete} /> : null
        }
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} tintColor={theme.colors.primary} />}
        contentContainerStyle={{ paddingBottom: 220 }}
        ListEmptyComponent={
          dashboardLoading ? (
            <View style={styles.emptyState}>
              <ActivityIndicator color={theme.colors.primary} size="large" />
              <Text style={[styles.emptyText, { color: theme.colors.muted, fontFamily: theme.fonts.regular }]}>
                Loading trades...
              </Text>
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Text style={[styles.emptyText, { color: theme.colors.muted, fontFamily: theme.fonts.regular }]}>
                No recent trades yet.
              </Text>
            </View>
          )
        }
        ListFooterComponent={<View style={{ height: 120 }} />}
      />

      <ProfitSplitModal visible={showSplit} onClose={() => setShowSplit(false)} users={users} />
      {user?.isTeamApproved ? (
        <Pressable
          style={[styles.fab, { backgroundColor: theme.colors.primary }]}
          onPress={() => navigation.navigate("AddTrade")}
        >
          <Ionicons name="add" size={24} color="#fff" />
          <Text style={[styles.fabText, { fontFamily: theme.fonts.bold }]}>Add Trade</Text>
        </Pressable>
      ) : null}
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
    flexDirection: "row"
  },
  iconBtn: {
    height: 34,
    width: 34,
    borderWidth: 1,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8
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
    alignItems: "center"
  },
  warningText: {
    flex: 1,
    fontSize: 12
  },
  summaryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 10
  },
  summaryTile: {
    width: "48%",
    marginBottom: 10
  },
  summarySkeleton: {
    borderRadius: 14,
    borderWidth: 1,
    minHeight: 96
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
  },
  fab: {
    position: "absolute",
    right: 18,
    bottom: 24,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6
  },
  fabText: {
    color: "#fff",
    fontSize: 16,
    marginLeft: 8
  },
  emptyState: {
    marginTop: 24,
    alignItems: "center",
    justifyContent: "center"
  },
  emptyText: {
    marginTop: 8,
    fontSize: 14
  }
});

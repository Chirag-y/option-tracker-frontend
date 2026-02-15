import React, { useCallback, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import api from "../services/api";
import { useAppTheme } from "../hooks/useAppTheme";
import { useDialog } from "../hooks/useDialog";
import { parseApiError } from "../utils/errors";

export default function AdminScreen() {
  const { theme } = useAppTheme();
  const dialog = useDialog();
  const [teams, setTeams] = useState([]);
  const [users, setUsers] = useState([]);

  const load = async () => {
    try {
      const res = await api.get("/admin/overview");
      setTeams(res.data.teams || []);
      setUsers(res.data.users || []);
    } catch (err) {
      dialog.show("Admin error", parseApiError(err, "Failed to load admin data"));
    }
  };

  useFocusEffect(
    useCallback(() => {
      load();
    }, [])
  );

  const toggleVerify = async (u) => {
    try {
      await api.patch(`/admin/users/${u._id}/verify`, { isVerified: !u.isVerified });
      await load();
    } catch (err) {
      dialog.show("Verify error", parseApiError(err, "Failed to update verification"));
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.bg }]} contentContainerStyle={styles.content}>
      <Text style={[styles.title, { color: theme.colors.text, fontFamily: theme.fonts.bold }]}>Teams</Text>
      {teams.map((t) => (
        <View key={t.teamCode} style={[styles.card, { borderColor: theme.colors.border, backgroundColor: theme.colors.card }]}>
          <Text style={{ color: theme.colors.text, fontFamily: theme.fonts.bold }}>{t.teamCode}</Text>
          <Text style={{ color: theme.colors.muted, fontFamily: theme.fonts.regular }}>
            Members: {t.members} | Verified: {t.verified} | Pending: {t.pending}
          </Text>
        </View>
      ))}

      <Text style={[styles.title, { color: theme.colors.text, fontFamily: theme.fonts.bold }]}>Users</Text>
      {users.map((u) => (
        <View key={u._id} style={[styles.card, { borderColor: theme.colors.border, backgroundColor: theme.colors.card }]}>
          <Text style={{ color: theme.colors.text, fontFamily: theme.fonts.bold }}>{u.name}</Text>
          <Text style={{ color: theme.colors.muted, fontFamily: theme.fonts.regular }}>{u.email}</Text>
          <Text style={{ color: theme.colors.muted, fontFamily: theme.fonts.regular }}>Team: {u.teamCode}</Text>
          <Pressable style={[styles.btn, { backgroundColor: u.isVerified ? theme.colors.loss : theme.colors.primary }]} onPress={() => toggleVerify(u)}>
            <Text style={{ color: "#fff", fontFamily: theme.fonts.bold }}>
              {u.isVerified ? "Unverify" : "Verify"}
            </Text>
          </Pressable>
        </View>
      ))}
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
  title: {
    fontSize: 18,
    marginBottom: 8
  },
  card: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8
  },
  btn: {
    marginTop: 8,
    borderRadius: 10,
    alignItems: "center",
    paddingVertical: 10
  }
});

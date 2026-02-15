import React, { useCallback, useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { BlurView } from "expo-blur";
import api from "../services/api";
import { useAppTheme } from "../hooks/useAppTheme";
import { useDialog } from "../hooks/useDialog";
import { parseApiError } from "../utils/errors";

export default function TeamManageScreen() {
  const { theme } = useAppTheme();
  const dialog = useDialog();
  const [teamUsers, setTeamUsers] = useState([]);
  const [pendingMembers, setPendingMembers] = useState([]);
  const [status, setStatus] = useState(null);
  const [edits, setEdits] = useState({});
  const [approvalModal, setApprovalModal] = useState({ visible: false, member: null, action: "APPROVE" });
  const [approvalShare, setApprovalShare] = useState("0");
  const [approvalPolicy, setApprovalPolicy] = useState("FUTURE_ONLY");

  const load = async () => {
    try {
      const res = await api.get("/users/team-manage");
      setTeamUsers(res.data.users);
      setPendingMembers(res.data.pendingMembers || []);
      setStatus(res.data.status);
      const nextEdits = {};
      res.data.users.forEach((u) => {
        nextEdits[u._id] = {
          sharePercentage: String(u.sharePercentage ?? 0)
        };
      });
      setEdits(nextEdits);
    } catch (err) {
      dialog.show("Team manage error", parseApiError(err, "Failed to load team data"));
    }
  };

  useFocusEffect(
    useCallback(() => {
      load();
    }, [])
  );

  const setField = (userId, key, value) => {
    setEdits((prev) => ({
      ...prev,
      [userId]: {
        ...(prev[userId] || {}),
        [key]: value
      }
    }));
  };

  const saveMemberShare = async (user) => {
    try {
      const edit = edits[user._id] || {};
      await api.patch(`/users/team-manage/${user._id}`, {
        sharePercentage: Number(edit.sharePercentage || 0)
      });
      dialog.show("Saved", `${user.name} share updated. Team balances recalculated.`);
      await load();
    } catch (err) {
      dialog.show("Update error", parseApiError(err, "Failed to update member"));
    }
  };

  const openApproval = (member, action) => {
    setApprovalModal({ visible: true, member, action });
    setApprovalShare(String(member.sharePercentage ?? 0));
    setApprovalPolicy(member.pnlMode || "FUTURE_ONLY");
  };

  const processApproval = async () => {
    const member = approvalModal.member;
    if (!member) return;

    try {
      if (approvalModal.action === "REJECT") {
        await api.patch(`/users/team-approval/${member._id}`, { action: "REJECT" });
        setApprovalModal({ visible: false, member: null, action: "APPROVE" });
        await load();
        return;
      }

      const share = Number(approvalShare || 0);
      if (!Number.isFinite(share) || share < 0) {
        dialog.show("Validation", "Share percentage must be a valid non-negative number.");
        return;
      }

      await api.patch(`/users/team-approval/${member._id}`, {
        action: "APPROVE",
        sharePercentage: share,
        pnlMode: approvalPolicy
      });
      setApprovalModal({ visible: false, member: null, action: "APPROVE" });
      await load();
      dialog.show("Approved", "Member approved and team balances recalculated.");
    } catch (err) {
      dialog.show("Approval error", parseApiError(err, "Failed to process team approval"));
    }
  };

  const activeMembers = teamUsers.filter((u) => u.isVerified && u.isTeamApproved);

  return (
    <>
      <ScrollView style={[styles.container, { backgroundColor: theme.colors.bg }]} contentContainerStyle={styles.content}>
        {!!status && !status.canTrade && (
          <View style={[styles.alertCard, { borderColor: theme.colors.loss, backgroundColor: theme.colors.cardSolid }]}>
            <Text style={{ color: theme.colors.loss, fontFamily: theme.fonts.bold }}>Trade Entry Blocked</Text>
            <Text style={{ color: theme.colors.loss, fontFamily: theme.fonts.regular }}>{status.message}</Text>
          </View>
        )}

        <Text style={[styles.sectionTitle, { color: theme.colors.text, fontFamily: theme.fonts.bold }]}>
          Pending Team Membership Requests
        </Text>
        {pendingMembers.length === 0 ? (
          <Text style={{ color: theme.colors.muted, fontFamily: theme.fonts.regular, marginBottom: 10 }}>
            No pending team approvals.
          </Text>
        ) : null}

        {pendingMembers.map((u) => (
          <View key={u._id} style={[styles.card, { borderColor: theme.colors.border, backgroundColor: theme.colors.card }]}>
            <Text style={{ color: theme.colors.text, fontFamily: theme.fonts.bold }}>{u.name}</Text>
            <Text style={{ color: theme.colors.muted, fontFamily: theme.fonts.regular }}>{u.email}</Text>
            <Text style={{ color: theme.colors.muted, fontFamily: theme.fonts.regular }}>Requested Share: {u.sharePercentage}%</Text>
            <View style={styles.row}>
              <Pressable style={[styles.btnHalf, { backgroundColor: theme.colors.primary }]} onPress={() => openApproval(u, "APPROVE")}>
                <Text style={{ color: "#fff", fontFamily: theme.fonts.bold }}>Approve</Text>
              </Pressable>
              <Pressable style={[styles.btnHalf, { backgroundColor: theme.colors.loss }]} onPress={() => openApproval(u, "REJECT")}>
                <Text style={{ color: "#fff", fontFamily: theme.fonts.bold }}>Reject</Text>
              </Pressable>
            </View>
          </View>
        ))}

        <Text style={[styles.sectionTitle, { color: theme.colors.text, fontFamily: theme.fonts.bold }]}>
          Active Member Shares
        </Text>
        <Text style={{ color: theme.colors.muted, fontFamily: theme.fonts.regular, marginBottom: 10 }}>
          Before approving a new member, update existing members so total share remains 100%.
        </Text>

        {activeMembers.map((u) => {
          const edit = edits[u._id] || {};
          return (
            <View key={u._id} style={[styles.card, { borderColor: theme.colors.border, backgroundColor: theme.colors.card }]}>
              <Text style={{ color: theme.colors.text, fontFamily: theme.fonts.bold }}>{u.name}</Text>
              <Text style={{ color: theme.colors.muted, fontFamily: theme.fonts.regular }}>{u.email}</Text>
              <Text style={{ color: theme.colors.muted, fontFamily: theme.fonts.regular }}>
                P/L Policy: {u.pnlMode} (locked at approval)
              </Text>
              <Text style={[styles.label, { color: theme.colors.text, fontFamily: theme.fonts.medium }]}>Share %</Text>
              <TextInput
                style={[styles.input, { borderColor: theme.colors.border, color: theme.colors.text, backgroundColor: theme.colors.cardSolid }]}
                keyboardType="numeric"
                value={edit.sharePercentage}
                onChangeText={(v) => setField(u._id, "sharePercentage", v)}
              />
              <Pressable style={[styles.saveBtn, { backgroundColor: theme.colors.primary }]} onPress={() => saveMemberShare(u)}>
                <Text style={{ color: "#fff", fontFamily: theme.fonts.bold }}>Save Share</Text>
              </Pressable>
            </View>
          );
        })}
      </ScrollView>

      <Modal transparent visible={approvalModal.visible} onRequestClose={() => setApprovalModal({ visible: false, member: null, action: "APPROVE" })}>
        <View style={[styles.modalOverlay, { backgroundColor: theme.colors.overlay }]}>
          <BlurView intensity={30} tint={theme.isDark ? "dark" : "light"} style={[styles.modalCard, { borderColor: theme.colors.border, backgroundColor: theme.colors.card }]}>
            <Text style={{ color: theme.colors.text, fontFamily: theme.fonts.bold, fontSize: 17 }}>
              {approvalModal.action === "APPROVE" ? "Confirm Team Approval" : "Confirm Team Rejection"}
            </Text>

            {approvalModal.member ? (
              <>
                <Text style={{ color: theme.colors.muted, fontFamily: theme.fonts.regular, marginTop: 6 }}>
                  Member: {approvalModal.member.name} ({approvalModal.member.email})
                </Text>
                {approvalModal.action === "APPROVE" ? (
                  <>
                    <Text style={[styles.label, { color: theme.colors.text, fontFamily: theme.fonts.medium }]}>Share % at Approval</Text>
                    <TextInput
                      style={[styles.input, { borderColor: theme.colors.border, color: theme.colors.text, backgroundColor: theme.colors.cardSolid }]}
                      keyboardType="numeric"
                      value={approvalShare}
                      onChangeText={setApprovalShare}
                    />
                    <Text style={[styles.label, { color: theme.colors.text, fontFamily: theme.fonts.medium }]}>P/L Policy at Approval</Text>
                    <View style={styles.row}>
                      <Pressable style={[styles.modeBtn, { borderColor: theme.colors.border, backgroundColor: theme.colors.cardSolid }, approvalPolicy === "FUTURE_ONLY" && { borderColor: theme.colors.primary }]} onPress={() => setApprovalPolicy("FUTURE_ONLY")}>
                        <Text style={{ color: theme.colors.text, fontFamily: theme.fonts.medium, fontSize: 12 }}>FUTURE ONLY</Text>
                      </Pressable>
                      <Pressable style={[styles.modeBtn, { borderColor: theme.colors.border, backgroundColor: theme.colors.cardSolid }, approvalPolicy === "FROM_START" && { borderColor: theme.colors.primary }]} onPress={() => setApprovalPolicy("FROM_START")}>
                        <Text style={{ color: theme.colors.text, fontFamily: theme.fonts.medium, fontSize: 12 }}>FROM START</Text>
                      </Pressable>
                    </View>
                    <Text style={{ color: theme.colors.loss, fontFamily: theme.fonts.regular, marginTop: 8, fontSize: 12 }}>
                      Reminder: Ensure all existing members updated share ratios to total 100% before approval. Otherwise new trade entries will be blocked.
                    </Text>
                  </>
                ) : (
                  <Text style={{ color: theme.colors.loss, fontFamily: theme.fonts.regular, marginTop: 8 }}>
                    This will reject the membership request. The member will not access team features.
                  </Text>
                )}
              </>
            ) : null}

            <View style={[styles.row, { marginTop: 14 }]}>
              <Pressable style={[styles.btnHalf, { backgroundColor: theme.colors.cardSolid, borderColor: theme.colors.border, borderWidth: 1 }]} onPress={() => setApprovalModal({ visible: false, member: null, action: "APPROVE" })}>
                <Text style={{ color: theme.colors.text, fontFamily: theme.fonts.medium }}>Cancel</Text>
              </Pressable>
              <Pressable style={[styles.btnHalf, { backgroundColor: approvalModal.action === "APPROVE" ? theme.colors.primary : theme.colors.loss }]} onPress={processApproval}>
                <Text style={{ color: "#fff", fontFamily: theme.fonts.bold }}>{approvalModal.action === "APPROVE" ? "Confirm Approve" : "Confirm Reject"}</Text>
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
    padding: 12,
    paddingBottom: 24
  },
  sectionTitle: {
    fontSize: 20,
    marginBottom: 6
  },
  alertCard: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    marginBottom: 12
  },
  card: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10
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
  row: {
    flexDirection: "row",
    gap: 8
  },
  modeBtn: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    alignItems: "center",
    paddingVertical: 10
  },
  saveBtn: {
    marginTop: 10,
    borderRadius: 10,
    alignItems: "center",
    paddingVertical: 10
  },
  btnHalf: {
    flex: 1,
    borderRadius: 10,
    alignItems: "center",
    paddingVertical: 10
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    padding: 16
  },
  modalCard: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    overflow: "hidden"
  }
});

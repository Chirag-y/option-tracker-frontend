import React, { createContext, useMemo, useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { BlurView } from "expo-blur";
import { useAppTheme } from "../hooks/useAppTheme";

export const DialogContext = createContext();

export const DialogProvider = ({ children }) => {
  const { theme } = useAppTheme();
  const [dialog, setDialog] = useState({
    visible: false,
    title: "",
    message: "",
    actions: []
  });

  const close = () => setDialog((prev) => ({ ...prev, visible: false }));

  const show = (title, message, actions = null) => {
    const safeActions = actions && actions.length ? actions : [{ label: "OK", onPress: close }];
    setDialog({
      visible: true,
      title,
      message,
      actions: safeActions
    });
  };

  const value = useMemo(
    () => ({
      show,
      close
    }),
    []
  );

  return (
    <DialogContext.Provider value={value}>
      {children}
      <Modal transparent visible={dialog.visible} onRequestClose={close} animationType="fade">
        <View style={[styles.overlay, { backgroundColor: theme.colors.overlay }]}>
          <BlurView
            intensity={34}
            tint={theme.isDark ? "dark" : "light"}
            style={[styles.card, { borderColor: theme.colors.border, backgroundColor: theme.colors.card }]}
          >
            <Text style={[styles.title, { color: theme.colors.text, fontFamily: theme.fonts.bold }]}>
              {dialog.title}
            </Text>
            <Text style={[styles.message, { color: theme.colors.muted, fontFamily: theme.fonts.regular }]}>
              {dialog.message}
            </Text>
            <View style={styles.actions}>
              {dialog.actions.map((action, idx) => (
                <Pressable
                  key={`${action.label}-${idx}`}
                  style={[
                    styles.btn,
                    action.variant === "danger"
                      ? { backgroundColor: theme.colors.loss }
                      : action.variant === "ghost"
                        ? { backgroundColor: theme.colors.cardSolid, borderColor: theme.colors.border, borderWidth: 1 }
                        : { backgroundColor: theme.colors.primary }
                  ]}
                  onPress={() => {
                    close();
                    if (typeof action.onPress === "function") action.onPress();
                  }}
                >
                  <Text
                    style={[
                      styles.btnText,
                      {
                        color: action.variant === "ghost" ? theme.colors.text : "#fff",
                        fontFamily: theme.fonts.bold
                      }
                    ]}
                  >
                    {action.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </BlurView>
        </View>
      </Modal>
    </DialogContext.Provider>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    padding: 18
  },
  card: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    overflow: "hidden"
  },
  title: {
    fontSize: 18
  },
  message: {
    marginTop: 6,
    lineHeight: 20
  },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
    marginTop: 14
  },
  btn: {
    minWidth: 82,
    borderRadius: 10,
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 12
  },
  btnText: {
    fontSize: 13
  }
});

import "react-native-gesture-handler";
import React, { useEffect, useRef } from "react";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { ActivityIndicator, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import {
  useFonts,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold
} from "@expo-google-fonts/manrope";
import AppNavigator from "./navigation/AppNavigator";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { useAppTheme } from "./hooks/useAppTheme";
import { DialogProvider } from "./context/DialogContext";
import Constants from "expo-constants";
import OneSignal from "react-native-onesignal";
import { notifyRealtimeEvent } from "./hooks/notificationCenter";

function Root() {
  const { theme, ready } = useAppTheme();
  const [fontsLoaded] = useFonts({
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold
  });
  const oneSignalInitialized = useRef(false);

  useEffect(() => {
    const appId = Constants?.expoConfig?.extra?.onesignalAppId;
    const canSetAppId = typeof OneSignal?.setAppId === "function";
    if (!appId || oneSignalInitialized.current || !canSetAppId) {
      return;
    }

    oneSignalInitialized.current = true;
    OneSignal.setAppId(appId);
    OneSignal.setNotificationWillShowInForegroundHandler((event) => {
      const notification = event.getNotification();
      event.complete(notification);
      notifyRealtimeEvent({ type: "notification", notification });
    });
    OneSignal.setNotificationOpenedHandler(() => {
      notifyRealtimeEvent({ type: "notification", opened: true });
    });
    OneSignal.promptForPushNotificationsWithUserResponse(() => {});
  }, []);

  const navTheme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      background: theme.colors.bg,
      card: theme.colors.cardSolid,
      text: theme.colors.text,
      border: theme.colors.border,
      primary: theme.colors.primary
    }
  };

  if (!ready || !fontsLoaded) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: theme.colors.bg
        }}
      >
        <ActivityIndicator color={theme.colors.primary} size="large" />
      </View>
    );
  }

  return (
    <>
      <StatusBar style={theme.isDark ? "light" : "dark"} />
      <DialogProvider>
        <AuthProvider>
          <NavigationContainer theme={navTheme}>
            <AppNavigator />
          </NavigationContainer>
        </AuthProvider>
      </DialogProvider>
    </>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <Root />
    </ThemeProvider>
  );
}

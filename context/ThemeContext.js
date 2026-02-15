import React, { createContext, useEffect, useMemo, useState } from "react";
import { Appearance, useColorScheme } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { buildTheme } from "../theme";

const THEME_KEY = "ui_theme_mode";

export const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const osColorScheme = useColorScheme();
  const [systemMode, setSystemMode] = useState(Appearance.getColorScheme() || "light");
  const [mode, setMode] = useState("system");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (osColorScheme === "light" || osColorScheme === "dark") {
      setSystemMode(osColorScheme);
    }
  }, [osColorScheme]);

  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      if (colorScheme === "light" || colorScheme === "dark") {
        setSystemMode(colorScheme);
      }
    });
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    const bootstrap = async () => {
      const saved = await AsyncStorage.getItem(THEME_KEY);
      if (saved === "light" || saved === "dark" || saved === "system") {
        setMode(saved);
      }
      setReady(true);
    };
    bootstrap();
  }, []);

  const setThemeMode = async (nextMode) => {
    setMode(nextMode);
    await AsyncStorage.setItem(THEME_KEY, nextMode);
  };

  const resolvedMode = mode === "system" ? systemMode : mode;
  const theme = useMemo(() => buildTheme(resolvedMode), [resolvedMode]);

  const value = useMemo(
    () => ({
      mode,
      resolvedMode,
      theme,
      ready,
      setThemeMode
    }),
    [mode, resolvedMode, theme, ready]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

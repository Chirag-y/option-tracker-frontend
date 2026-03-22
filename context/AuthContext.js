import React, { createContext, useCallback, useEffect, useMemo, useRef, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api, { setAuthToken } from "../services/api";
import OneSignal from "react-native-onesignal";
import { registerPlayerId, removePlayerId } from "../services/onesignal";

export const AuthContext = createContext();
const normalizeUser = (u) => (u ? { ...u, id: u.id || u._id } : null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [booting, setBooting] = useState(true);
  const playerIdRef = useRef(null);
  const clearStoredPlayerId = useCallback(async () => {
    if (playerIdRef.current) {
      await removePlayerId(playerIdRef.current);
      playerIdRef.current = null;
    }
  }, []);

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const saved = await AsyncStorage.getItem("auth_token");
        if (saved) {
          // console.log({saved});
          setAuthToken(saved);
          setToken(saved);
          const me = await api.get("/auth/me");
          setUser(normalizeUser(me.data));
        }
      } catch (err) {
        await AsyncStorage.removeItem("auth_token");
        setAuthToken(null);
      } finally {
        setBooting(false);
      }
    };
    bootstrap();
  }, []);

  useEffect(() => {
    let active = true;
    const syncPlayer = async () => {
      if (!OneSignal || typeof OneSignal.getDeviceState !== "function") {
        return;
      }
      try {
        const state = await OneSignal.getDeviceState();
        if (!active) return;
        const playerId = state?.userId;
        if (playerId && playerId !== playerIdRef.current) {
          await registerPlayerId(playerId);
          playerIdRef.current = playerId;
        }
      } catch (err) {
        console.warn("OneSignal sync failed", err?.message || err);
      }
    };

      if (user?.id) {
        if (OneSignal && typeof OneSignal.setExternalUserId === "function") {
          OneSignal.setExternalUserId(String(user.id));
        }
        void syncPlayer();
      } else {
        if (OneSignal && typeof OneSignal.removeExternalUserId === "function") {
          OneSignal.removeExternalUserId();
        }
        void clearStoredPlayerId();
    }

    return () => {
      active = false;
    };
  }, [user, clearStoredPlayerId]);

  const login = async ({ email, password, teamCode }) => {
    const response = await api.post("/auth/login", { email, password, teamCode });
    const nextToken = response.data.token;
    setAuthToken(nextToken);
    setToken(nextToken);
    setUser(normalizeUser(response.data.user));
    await AsyncStorage.setItem("auth_token", nextToken);
  };

  const register = async (payload) => {
    await api.post("/auth/register", payload);
  };

  const refreshMe = async () => {
    const me = await api.get("/auth/me");
    setUser(normalizeUser(me.data));
  };

  const logout = async () => {
    if (OneSignal && typeof OneSignal.removeExternalUserId === "function") {
      OneSignal.removeExternalUserId();
    }
    await clearStoredPlayerId();
    setToken(null);
    setUser(null);
    setAuthToken(null);
    await AsyncStorage.removeItem("auth_token");
  };

  const value = useMemo(
    () => ({
      token,
      user,
      booting,
      login,
      register,
      logout,
      refreshMe
    }),
    [token, user, booting]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

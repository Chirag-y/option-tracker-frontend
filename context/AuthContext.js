import React, { createContext, useEffect, useMemo, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api, { setAuthToken } from "../services/api";

export const AuthContext = createContext();
const normalizeUser = (u) => (u ? { ...u, id: u.id || u._id } : null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const saved = await AsyncStorage.getItem("auth_token");
        if (saved) {
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

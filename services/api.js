import axios from "axios";
import { Platform } from "react-native";
import Constants from "expo-constants";

const getBaseUrl = () => {
  const config = Constants?.expoConfig;
  const rawUrl =
    config?.extra?.apiUrl ||
    process.env.EXPO_PUBLIC_API_URL ||
    "http://10.0.2.2:5000/api";

  if (Platform.OS !== "android") {
    return rawUrl;
  }

  try {
    const url = new URL(rawUrl);
    if (url.hostname === "localhost" || url.hostname === "127.0.0.1") {
      url.hostname = "10.0.2.2";
      return url.toString().replace(/\/$/, "");
    }
    return rawUrl;
  } catch (err) {
    return rawUrl;
  }
};

const api = axios.create({
  baseURL: getBaseUrl()
});

export const setAuthToken = (token) => {
  if (token) {
    // console.log({token});
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
};

export default api;

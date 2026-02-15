import axios from "axios";
import Constants from "expo-constants";

const getBaseUrl = () => {
  const config = Constants?.expoConfig;
  return (
    config?.extra?.apiUrl ||
    process.env.EXPO_PUBLIC_API_URL ||
    "http://10.0.2.2:5000/api"
  );
};

const api = axios.create({
  baseURL: getBaseUrl()
});

export const setAuthToken = (token) => {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
};

export default api;

require("dotenv").config();

const baseConfig = require("./app.json");

const apiUrl = process.env.EXPO_PUBLIC_API_URL || "http://10.0.2.2:5000/api";
const onesignalAppId = process.env.EXPO_PUBLIC_ONESIGNAL_APP_ID || process.env.ONESIGNAL_APP_ID || "";
const buildProfile = process.env.EAS_BUILD_PROFILE || process.env.EXPO_ENV || "development";
const onesignalMode = buildProfile === "production" ? "production" : "development";

module.exports = () => {
  const existingPlugins = baseConfig.expo.plugins || [];
  const onesignalPlugin = onesignalAppId
    ? ["onesignal-expo-plugin", { appId: onesignalAppId, mode: onesignalMode }]
    : null;
  const plugins = onesignalPlugin ? [onesignalPlugin, ...existingPlugins] : [...existingPlugins];

  return {
    ...baseConfig,
    expo: {
      ...baseConfig.expo,
      extra: {
        ...baseConfig.expo.extra,
        apiUrl,
        onesignalAppId
      },
      plugins
    }
  };
};

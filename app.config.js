require("dotenv").config();

const baseConfig = require("./app.json");

const apiUrl =
  process.env.EXPO_PUBLIC_API_URL || "https://option-tracker.up.railway.app/api";

module.exports = () => ({
  ...baseConfig,
  expo: {
    ...baseConfig.expo,
    extra: {
      ...baseConfig.expo.extra,
      apiUrl
    }
  }
});

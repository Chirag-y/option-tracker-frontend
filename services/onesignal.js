import api from "./api";

export const registerPlayerId = async (playerId) => {
  if (!playerId) return;
  try {
    await api.post("/users/me/onesignal", { playerId });
  } catch (err) {
    console.warn("Failed to register OneSignal player:", err?.message || err);
  }
};

export const removePlayerId = async (playerId) => {
  try {
    await api.delete("/users/me/onesignal", { data: { playerId } });
  } catch (err) {
    console.warn("Failed to remove OneSignal player:", err?.message || err);
  }
};

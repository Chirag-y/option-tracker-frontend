const listeners = new Set();

export const notifyRealtimeEvent = (payload) => {
  listeners.forEach((listener) => {
    try {
      listener(payload);
    } catch (err) {
      console.warn("Notification listener error", err);
    }
  });
};

export const subscribeToRealtimeEvents = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

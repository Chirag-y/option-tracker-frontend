export const parseApiError = (error, fallback = "Something went wrong. Please try again.") => {
  if (!error) return fallback;
  const message = error?.response?.data?.message || error?.message;
  if (!message) return fallback;
  return String(message);
};

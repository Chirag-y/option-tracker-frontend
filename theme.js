export const PRIMARY = "#40826d";

const lightColors = {
  bg: "#eef4f2",
  card: "rgba(255,255,255,0.72)",
  cardSolid: "#ffffff",
  text: "#102018",
  muted: "#5e6d66",
  border: "rgba(64,130,109,0.22)",
  primary: PRIMARY,
  primaryDark: "#2f6655",
  profit: "#178a5f",
  loss: "#c73f3f",
  accent: "#5aa790",
  overlay: "rgba(15, 28, 23, 0.38)",
  shadow: "rgba(64,130,109,0.26)"
};

const darkColors = {
  bg: "#0e1814",
  card: "rgba(21, 34, 29, 0.72)",
  cardSolid: "#13221c",
  text: "#e5f1ec",
  muted: "#9bb7ae",
  border: "rgba(113,179,157,0.24)",
  primary: "#66a995",
  primaryDark: "#4f8978",
  profit: "#5fd1a8",
  loss: "#ff8f8f",
  accent: "#8dd2bc",
  overlay: "rgba(0, 0, 0, 0.5)",
  shadow: "rgba(0,0,0,0.45)"
};

export const buildTheme = (mode = "light") => {
  const isDark = mode === "dark";
  const colors = isDark ? darkColors : lightColors;

  return {
    mode,
    isDark,
    colors,
    fonts: {
      regular: "Manrope_500Medium",
      medium: "Manrope_600SemiBold",
      bold: "Manrope_700Bold"
    }
  };
};

export const money = (value) => {
  const safe = Number(value || 0);
  return `Rs ${safe.toFixed(2)}`;
};

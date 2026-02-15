import { useContext } from "react";
import { ThemeContext } from "../context/ThemeContext";

export const useAppTheme = () => useContext(ThemeContext);

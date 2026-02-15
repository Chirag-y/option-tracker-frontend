import { useContext } from "react";
import { DialogContext } from "../context/DialogContext";

export const useDialog = () => useContext(DialogContext);

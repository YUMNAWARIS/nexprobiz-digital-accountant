import { createTheme } from "@mui/material";

export type AppThemeMode = "light" | "dark";

export function createAppTheme(mode: AppThemeMode) {
  return createTheme({
    palette: {
      mode,
      background: {
        default: mode === "light" ? "#fafaf9" : "#0a0a0a",
        paper: mode === "light" ? "#ffffff" : "#0f0f10",
      },
      text: {
        primary: mode === "light" ? "#0f172a" : "#ededed",
      },
      primary: { main: "#2563eb" },
    },
    shape: { borderRadius: 12 },
  });
}



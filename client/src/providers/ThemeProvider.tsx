"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { CssBaseline, ThemeProvider as MuiThemeProvider } from "@mui/material";
import { createAppTheme } from "@/providers/createAppTheme";
import { deleteCookie, getCookie, setCookie } from "@/utils/cookies";

type Theme = "light" | "dark";

type ThemeContextValue = {
  theme: Theme;
  hasConsent: boolean;
  toggleTheme: () => void;
  setTheme: (next: Theme) => void;
  acceptCookies: () => void;
  declineCookies: () => void;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

// cookie helpers moved to src/utils/cookies

export const ThemeProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>("light");
  const [hasConsent, setHasConsent] = useState<boolean>(false);

  useEffect(() => {
    const consentCookie = getCookie("cookie_consent");
    const consent = consentCookie === "true";
    setHasConsent(consent);

    if (consent) {
      const saved = typeof window !== "undefined" ? window.localStorage.getItem("theme") : null;
      if (saved === "dark" || saved === "light") {
        setThemeState(saved);
      }
    }
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }

    if (hasConsent && typeof window !== "undefined") {
      try {
        window.localStorage.setItem("theme", theme);
        setCookie("theme", theme, 60 * 60 * 24 * 365);
      } catch {}
    }
  }, [theme, hasConsent]);

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => (prev === "dark" ? "light" : "dark"));
  }, []);

  const acceptCookies = useCallback(() => {
    setHasConsent(true);
    setCookie("cookie_consent", "true", 60 * 60 * 24 * 365);
    // Persist current theme now that we have consent
    if (typeof window !== "undefined") {
      try {
        window.localStorage.setItem("theme", theme);
        setCookie("theme", theme, 60 * 60 * 24 * 365);
      } catch {}
    }
  }, [theme]);

  const declineCookies = useCallback(() => {
    setHasConsent(false);
    setCookie("cookie_consent", "false", 60 * 60 * 24 * 365);
    // Remove persisted data
    if (typeof window !== "undefined") {
      try {
        window.localStorage.removeItem("theme");
      } catch {}
    }
    deleteCookie("theme");
  }, []);

  const value = useMemo<ThemeContextValue>(() => ({
    theme,
    hasConsent,
    toggleTheme,
    setTheme,
    acceptCookies,
    declineCookies,
  }), [theme, hasConsent, toggleTheme, setTheme, acceptCookies, declineCookies]);

  const muiTheme = useMemo(() => createAppTheme(theme), [theme]);

  return (
    <ThemeContext.Provider value={value}>
      <MuiThemeProvider theme={muiTheme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
};

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}



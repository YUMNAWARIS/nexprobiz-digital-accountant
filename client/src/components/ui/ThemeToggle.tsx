"use client";

import React, { useEffect, useState } from "react";
import { useTheme } from "@/providers/ThemeProvider";
import { IconButton } from "@mui/material";
import Brightness4Icon from "@mui/icons-material/Brightness4";
import Brightness7Icon from "@mui/icons-material/Brightness7";

export const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const label = theme === "dark" ? "Switch to light theme" : "Switch to dark theme";
  return (
    <IconButton onClick={toggleTheme} aria-label={label} title={label} size="small" color="inherit">
      {mounted ? (theme === "dark" ? <Brightness7Icon /> : <Brightness4Icon />) : null}
    </IconButton>
  );
};

export default ThemeToggle;



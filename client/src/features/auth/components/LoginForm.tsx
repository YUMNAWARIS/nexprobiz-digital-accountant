"use client";

import React, { useState } from "react";
import { Box, Button, Card, CardContent, IconButton, Stack, TextField, Typography } from "@mui/material";
import Brightness4Icon from "@mui/icons-material/Brightness4";
import Brightness7Icon from "@mui/icons-material/Brightness7";
import Link from "next/link";
import { loginApi } from "@/services/api";
import { setCookie } from "@/utils/cookies";
import { COOKIE_ACCESS_TOKEN, COOKIE_ROLE, COOKIE_BUSINESS_ID, ROUTE_BUSINESS_HOME, ROUTE_MASTER_HOME } from "@/constants";
import { useRouter, useSearchParams } from "next/navigation";
import { useTheme } from "@/providers/ThemeProvider";

export default function LoginForm() {
  const { theme, toggleTheme } = useTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const result = await loginApi({ email, password });
      // Set cookies
      setCookie(COOKIE_ACCESS_TOKEN, result.token, 60 * 60 * 24 * 7);
      setCookie(COOKIE_ROLE, result.user.role, 60 * 60 * 24 * 7);
      if (result.user.business_id) {
        setCookie(COOKIE_BUSINESS_ID, String(result.user.business_id), 60 * 60 * 24 * 7);
      }

      const from = searchParams.get("from");
      if (result.user.role === "master") {
        router.replace(from && from.startsWith("/master") ? from : ROUTE_MASTER_HOME);
      } else if (result.user.business_id) {
        router.replace(from && from.startsWith("/business") ? from : ROUTE_BUSINESS_HOME);
      } else {
        // Fallback: no business and not master, send to login with error
        setError("No portal assigned to this user.");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Login failed. Please try again.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box minHeight="100vh" display="grid" sx={{ placeItems: "center", p: 2 }}>
      <Card sx={{ width: "100%", maxWidth: 480 }} variant="outlined">
        <CardContent>
          <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1.5}>
            <Typography variant="h5" component="h1" fontWeight={600}>Sign in</Typography>
            <IconButton onClick={toggleTheme} aria-label="Toggle theme">
              {theme === "dark" ? <Brightness7Icon /> : <Brightness4Icon />}
            </IconButton>
          </Stack>
          <Typography variant="body2" color="text.secondary" mb={3}>
            Please enter your credentials to continue.
          </Typography>
          <Stack component="form" onSubmit={onSubmit} gap={2}>
            <TextField
              id="email"
              label="Email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              inputMode="email"
              fullWidth
            />
            <TextField
              id="password"
              label="Password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              fullWidth
            />
            {error && (
              <Typography variant="body2" color="error">{error}</Typography>
            )}
            <Button type="submit" variant="contained" size="large" disabled={isLoading} sx={{ mt: 0.5 }}>
              {isLoading ? "Signing in..." : "Sign in"}
            </Button>
          </Stack>
          <Stack direction="row" justifyContent="space-between" mt={3}>
            <Link href="#" className="underline underline-offset-4">Forgot password?</Link>
            <Link href="#" className="underline underline-offset-4">Need help?</Link>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}



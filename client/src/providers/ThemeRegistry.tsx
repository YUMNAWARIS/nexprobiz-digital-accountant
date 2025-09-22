"use client";

import * as React from "react";
import { CacheProvider } from "@emotion/react";
import createCache from "@emotion/cache";

function createEmotionCache() {
  const cache = createCache({ key: "css", prepend: true });
  cache.compat = true;
  return cache;
}

export default function ThemeRegistry({ children }: { children: React.ReactNode }) {
  const cache = React.useMemo(() => createEmotionCache(), []);
  return <CacheProvider value={cache}>{children}</CacheProvider>;
}



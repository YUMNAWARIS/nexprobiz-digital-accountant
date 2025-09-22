"use client";

import React, { useEffect, useState } from "react";
import { useTheme } from "@/providers/ThemeProvider";

const CookieConsent: React.FC = () => {
  const { hasConsent, acceptCookies, declineCookies } = useTheme();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(!hasConsent);
  }, [hasConsent]);

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-1/2 sm:-translate-x-1/2 sm:right-auto sm:w-[560px] z-50 rounded-lg border border-black/[.08] dark:border-white/[.145] bg-white/90 dark:bg-black/80 backdrop-blur-md shadow-lg p-4">
      <div className="text-sm text-black dark:text-white">
        We use cookies to store your theme preference and improve your experience. You can accept or decline.
      </div>
      <div className="mt-3 flex gap-2 justify-end">
        <button
          type="button"
          onClick={declineCookies}
          className="px-3 py-2 text-sm rounded border border-black/[.08] dark:border-white/[.145] hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a]"
        >
          Decline
        </button>
        <button
          type="button"
          onClick={acceptCookies}
          className="px-3 py-2 text-sm rounded bg-black text-white dark:bg-white dark:text-black"
        >
          Accept
        </button>
      </div>
    </div>
  );
};

export default CookieConsent;



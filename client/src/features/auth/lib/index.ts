"use client";

import { deleteCookie } from "@/utils/cookies";
import { COOKIE_ACCESS_TOKEN, COOKIE_BUSINESS_ID, COOKIE_ROLE, ROUTE_LOGIN } from "@/constants";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

export function logoutClient(router?: AppRouterInstance) {
  try {
    deleteCookie(COOKIE_ACCESS_TOKEN);
    deleteCookie(COOKIE_ROLE);
    deleteCookie(COOKIE_BUSINESS_ID);
  } catch {}

  if (typeof window !== "undefined") {
    window.localStorage.removeItem("theme");
  }

  if (router) router.replace(ROUTE_LOGIN);
  else if (typeof window !== "undefined") window.location.replace(ROUTE_LOGIN);
}



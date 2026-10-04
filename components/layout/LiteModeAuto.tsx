"use client";

import { useEffect } from "react";

import { LITE_MODE_COOKIE } from "@/lib/lite-cookie";

type NetworkInformation = {
  saveData?: boolean;
  effectiveType?: string;
};

/**
 * F59 / F96 — when the visitor has no explicit preference yet and the browser
 * reports a data-saver or a slow connection (2G/3G), switch to light mode
 * automatically. An explicit toggle choice (cookie set by the user) always
 * wins and is never overridden.
 */
export function LiteModeAuto() {
  useEffect(() => {
    const hasChoice = document.cookie
      .split("; ")
      .some((row) => row.startsWith(`${LITE_MODE_COOKIE}=`));
    if (hasChoice) return;

    const connection = (navigator as Navigator & { connection?: NetworkInformation })
      .connection;
    const slow =
      connection?.saveData === true ||
      (connection?.effectiveType
        ? ["slow-2g", "2g", "3g"].includes(connection.effectiveType)
        : false);

    if (slow) {
      document.cookie = `${LITE_MODE_COOKIE}=1; path=/; max-age=31536000; samesite=lax`;
      window.location.reload();
    }
  }, []);

  return null;
}

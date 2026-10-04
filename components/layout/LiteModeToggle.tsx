"use client";

import { useEffect, useState } from "react";

import { LITE_MODE_COOKIE } from "@/lib/lite-cookie";
import { useT } from "@/lib/i18n/client";

function readLiteCookie(): boolean {
  return document.cookie.split("; ").includes(`${LITE_MODE_COOKIE}=1`);
}

/**
 * F62 / F96 — manual switch for the light version of the pages. The choice is
 * persisted in a cookie; the page reloads so server components render the
 * lighter variant immediately.
 */
export function LiteModeToggle() {
  const t = useT();
  const [lite, setLite] = useState(false);

  useEffect(() => {
    setLite(readLiteCookie());
  }, []);

  function toggle() {
    const next = !lite;
    document.cookie = `${LITE_MODE_COOKIE}=${next ? "1" : "0"}; path=/; max-age=31536000; samesite=lax`;
    window.location.reload();
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={lite}
      className="hover:text-primary"
      title={t.lite.hint}
    >
      [ {lite ? t.lite.disable : t.lite.enable} ]
    </button>
  );
}

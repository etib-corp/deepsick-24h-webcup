import "server-only";

import { cookies } from "next/headers";

import { LITE_MODE_COOKIE } from "@/lib/lite-cookie";

/**
 * F59 / F62 / F96 — "light mode" cookie.
 *
 * `1` = light mode requested (manual toggle or auto-detection on a slow /
 * data-saver connection), `0` = explicit full-mode choice. Absent = default.
 */
export { LITE_MODE_COOKIE };

export function isLiteMode(): boolean {
  try {
    return cookies().get(LITE_MODE_COOKIE)?.value === "1";
  } catch {
    return false;
  }
}

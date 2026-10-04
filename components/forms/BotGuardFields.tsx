"use client";

import { BOT_TOKEN_FIELD, BOT_TRAP_FIELD } from "@/lib/bot-fields";
import { useT } from "@/lib/i18n/client";

/**
 * F81 — hidden inputs carried by every public form.
 *
 * - the honeypot is off-screen, unreachable by keyboard and ignored by screen
 *   readers and password managers, so only automated fillers touch it;
 * - the signed challenge lets the server prove the form was actually rendered
 *   for this visitor and measure how long it stayed on screen.
 */
export function BotGuardFields({ form, token }: { form: string; token: string }) {
  const t = useT();
  const trapId = `${form}-reference-details`;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute left-[-9999px] top-auto h-px w-px overflow-hidden"
    >
      <label htmlFor={trapId}>{t.botGuard.trapLabel}</label>
      <input
        id={trapId}
        name={BOT_TRAP_FIELD}
        type="text"
        tabIndex={-1}
        autoComplete="off"
        data-lpignore="true"
        data-1p-ignore="true"
        defaultValue=""
      />
      <input type="hidden" name={BOT_TOKEN_FIELD} value={token} readOnly />
    </div>
  );
}

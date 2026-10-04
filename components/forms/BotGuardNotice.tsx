"use client";

import { ShieldCheck } from "lucide-react";

import { useT } from "@/lib/i18n/client";

/**
 * F81 — discreet, user-facing signal that public forms are protected against
 * automated submissions. No puzzle, no extra step: the check is invisible.
 */
export function BotGuardNotice() {
  const t = useT();

  return (
    <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
      <ShieldCheck aria-hidden className="size-3.5 text-info" />
      {t.botGuard.protected}
    </p>
  );
}

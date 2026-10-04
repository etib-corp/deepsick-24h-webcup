"use client";

import { useState } from "react";

import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { setTwoFactorAction } from "@/lib/actions/access";
import { useT } from "@/lib/i18n/client";

/**
 * F53 — two-step verification toggle shown in the citizen account page.
 * Turning it on makes each sign-in require a one-time code after the
 * password (verified server-side in `authorize`).
 */
export function TwoFactorCard({ enabled }: { enabled: boolean }) {
  const t = useT();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function toggle() {
    setPending(true);
    setMessage(null);
    setError(null);
    try {
      const result = await setTwoFactorAction(!enabled);
      if (result.ok) setMessage(result.message);
      else setError(result.message);
    } catch {
      setError(t.citizen.account.twoFactor.failed);
    } finally {
      setPending(false);
    }
  }

  return (
    <Card className="space-y-3 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          {t.citizen.account.twoFactor.title}
        </p>
        <Badge tone={enabled ? "success" : "neutral"}>
          {enabled ? t.citizen.account.twoFactor.stateOn : t.citizen.account.twoFactor.stateOff}
        </Badge>
      </div>
      <p className="text-sm text-muted-foreground">{t.citizen.account.twoFactor.subtitle}</p>
      <p className="text-sm text-muted-foreground">
        {enabled ? t.citizen.account.twoFactor.hintOn : t.citizen.account.twoFactor.hintOff}
      </p>
      {message ? <Alert tone="success">{message}</Alert> : null}
      {error ? <Alert tone="error">{error}</Alert> : null}
      <Button
        type="button"
        variant={enabled ? "secondary" : "primary"}
        disabled={pending}
        onClick={toggle}
      >
        {pending
          ? t.citizen.account.twoFactor.working
          : enabled
            ? t.citizen.account.twoFactor.disable
            : t.citizen.account.twoFactor.enable}
      </Button>
    </Card>
  );
}

"use client";

import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { useT } from "@/lib/i18n/client";

/**
 * Root error boundary — shows localized, generic copy and never the technical
 * error, so a failure cannot leak internals to the visitor.
 */
export default function Error({ reset }: { reset: () => void }) {
  const t = useT();

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col items-start gap-4 p-6">
      <Alert tone="error">{t.errors.unexpected}</Alert>
      <Button onClick={reset}>{t.errors.retry}</Button>
    </div>
  );
}

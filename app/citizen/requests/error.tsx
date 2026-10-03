"use client";

import { useRouter } from "next/navigation";
import { startTransition } from "react";

import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { useT } from "@/lib/i18n/client";

export default function Error({ reset }: { reset: () => void }) {
  const t = useT();
  const router = useRouter();
  return (
    <div className="flex flex-col items-start gap-4">
      <Alert tone="error">{t.citizen.tracking.error}</Alert>
      <Button onClick={() => startTransition(() => {
        router.refresh();
        reset();
      })}>{t.citizen.tracking.retry}</Button>
    </div>
  );
}

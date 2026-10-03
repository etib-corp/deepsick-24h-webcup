"use client";

import { colonyClock } from "@/lib/colony";
import { useT } from "@/lib/i18n/client";

/** The thin colony status strip used across the console screens. */
export function StatusStrip({ status }: { status?: string }) {
  const t = useT();

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-2 font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
      <span>{colonyClock()}</span>
      <span className="flex items-center gap-1.5">
        <span className="inline-block size-1.5 rounded-full bg-[var(--chart-3)]" />
        {status ?? t.common.colonyNominal}
      </span>
    </div>
  );
}

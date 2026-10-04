import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * F90 — on-demand plain-language explanation.
 *
 * Progressive disclosure: the simplified explanation stays folded and the
 * resident opens it only when a passage needs clarifying. Built on native
 * `<details>` so it works without JavaScript, keeps its state locally, and
 * stays keyboard/screen-reader accessible.
 */
export function PlainExplanation({
  title,
  children,
  className,
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <details
      className={cn(
        "group rounded-md border border-border/70 bg-muted/20 px-3 py-2 [&_summary::-webkit-details-marker]:hidden",
        className,
      )}
    >
      <summary className="flex cursor-pointer list-none items-center gap-2 font-mono text-[11px] uppercase tracking-wide text-muted-foreground transition hover:text-foreground">
        <span aria-hidden className="inline-block transition group-open:rotate-90">
          ▸
        </span>
        {title}
      </summary>
      <div className="mt-2 text-sm text-muted-foreground">{children}</div>
    </details>
  );
}

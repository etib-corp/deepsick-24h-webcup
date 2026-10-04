import type { ReactNode } from "react";

import { cn } from "@/lib/ui";

/** Live indicator (green pulse) used in the ops headers. */
export function LiveBadge({ label = "LIVE" }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--chart-3)]/40 bg-[var(--chart-3)]/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--chart-3)]">
      <span className="inline-block size-1.5 animate-pulse rounded-full bg-[var(--chart-3)]" />
      {label}
    </span>
  );
}

/** Uppercase mono section header with an optional right-hand slot. */
export function SectionHeader({
  title,
  badge,
  action,
  className,
}: {
  title: string;
  badge?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-3 flex flex-wrap items-center justify-between gap-3", className)}>
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        <h2 className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
          {title}
        </h2>
        {badge}
      </div>
      {action}
    </div>
  );
}

/**
 * Row used by every live feed / list in the design.
 *
 * Server component with a CSS-only entrance (no client JS / anime.js), and
 * `content-visibility` so long lists skip rendering off-screen rows.
 */
export function FeedRow({
  title,
  meta,
  trailing,
  icon,
  href,
  className,
}: {
  title: string;
  meta?: string;
  trailing?: ReactNode;
  icon?: ReactNode;
  href?: string;
  className?: string;
}) {
  const inner = (
    <div
      className={cn(
        "flex flex-wrap items-center gap-3 rounded-lg border border-border bg-card px-3 py-2.5 transition [content-visibility:auto] [contain-intrinsic-size:auto_3.5rem] motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-1 motion-safe:duration-300",
        href && "hover:border-primary/50",
        className,
      )}
    >
      {icon ? <span className="shrink-0 text-base">{icon}</span> : null}
      <div className="min-w-0 flex-1 basis-48">
        <p className="font-mono text-sm text-foreground">{title}</p>
        {meta ? (
          <p className="mt-0.5 font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
            {meta}
          </p>
        ) : null}
      </div>
      {trailing ? <div className="flex max-w-full flex-wrap gap-2 [&>div]:flex-wrap">{trailing}</div> : null}
    </div>
  );

  return href ? <a href={href}>{inner}</a> : inner;
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { getBreadcrumbs } from "@/lib/breadcrumbs";
import { useT } from "@/lib/i18n/client";
import { cn } from "@/lib/ui";

/** Shared semantic navigation; the current page is text, never a link. */
export function Breadcrumbs({ currentLabel, className }: { currentLabel?: string; className?: string }) {
  const t = useT();
  const items = getBreadcrumbs(usePathname(), t, currentLabel);
  if (items.length < 2) return null;

  return (
    <nav aria-label={t.nav.breadcrumb} className={cn("mb-4", className)}>
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-sm">
        {items.map((item, index) => (
          <li key={item.href} className="flex min-w-0 max-w-full items-baseline gap-2 [overflow-wrap:anywhere]">
            {index > 0 ? <span aria-hidden="true" className="shrink-0 text-muted-foreground">›</span> : null}
            {index === items.length - 1 ? (
              <span aria-current="page" className="min-w-0 text-foreground">{item.label}</span>
            ) : (
              <Link href={item.href} className="min-w-0 text-muted-foreground underline underline-offset-4 hover:text-foreground">{item.label}</Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

import Link from "next/link";

import { buttonClasses } from "@/components/ui/Button";
import { getActiveBroadcasts } from "@/lib/data";
import { getDictionary } from "@/lib/i18n/server";

/**
 * Site-wide banner for active general announcements (D18). Rendered in the
 * public site and every console shell; shows nothing when no broadcast is
 * active or inside its scheduled window.
 */
export async function BroadcastBanner() {
  const t = getDictionary();
  const broadcasts = await getActiveBroadcasts();
  if (broadcasts.length === 0) return null;

  return (
    <div className="space-y-2 border-b border-amber-500/30 bg-amber-500/10">
      {broadcasts.map((broadcast) => {
        const label = broadcast.actionLabel ?? t.broadcast.action;
        const href = broadcast.actionHref;

        return (
          <div
            key={broadcast.id}
            role="region"
            aria-label={t.broadcast.eyebrow}
            className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0">
              <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-amber-600 dark:text-amber-300">
                {t.broadcast.eyebrow}
              </p>
              <p className="mt-0.5 font-mono text-sm font-medium text-foreground">
                {broadcast.title}
              </p>
              <p className="mt-0.5 whitespace-pre-line text-sm text-muted-foreground">
                {broadcast.message}
              </p>
            </div>

            {href ? (
              href.startsWith("/") ? (
                <Link
                  href={href}
                  className={buttonClasses("secondary", "sm", "shrink-0")}
                >
                  {label}
                </Link>
              ) : (
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={buttonClasses("secondary", "sm", "shrink-0")}
                >
                  {label}
                </a>
              )
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

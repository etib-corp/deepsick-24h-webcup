"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { buttonClasses } from "@/components/ui/Button";
import { getPublicBroadcasts, type PublicBroadcast } from "@/lib/actions/broadcasts";
import {
  DISMISSED_BROADCASTS_KEY,
  dismissBroadcast,
  parseDismissedBroadcasts,
  serializeDismissedBroadcasts,
} from "@/lib/broadcast-dismissals";
import { useT } from "@/lib/i18n/client";

/** Refresh only public messages; leave the surrounding page and forms intact. */
export function BroadcastMessages({ initialMessages }: { initialMessages: PublicBroadcast[] }) {
  const t = useT();
  const [messages, setMessages] = useState(initialMessages);
  const [dismissed, setDismissed] = useState<string[]>([]);

  // Restore the messages closed on this device. Runs after hydration:
  // `localStorage` is not available during server rendering, so the first
  // paint always shows the server-rendered list.
  useEffect(() => {
    try {
      setDismissed(parseDismissedBroadcasts(window.localStorage.getItem(DISMISSED_BROADCASTS_KEY)));
    } catch {
      // Storage unavailable (private mode): dismissals stay session-only.
    }
  }, []);

  useEffect(() => {
    let disposed = false;
    let pending = false;
    setMessages(initialMessages);

    async function refresh() {
      if (disposed || pending || document.visibilityState === "hidden") return;
      pending = true;
      try {
        const result = await getPublicBroadcasts();
        if (!disposed && result.ok) {
          setMessages((previous) => JSON.stringify(previous) === JSON.stringify(result.messages) ? previous : result.messages);
        }
      } catch {
        // Keep the last visible message when the connection is temporarily lost.
      } finally {
        pending = false;
      }
    }

    const interval = window.setInterval(refresh, 5000);
    document.addEventListener("visibilitychange", refresh);
    window.addEventListener("focus", refresh);
    return () => {
      disposed = true;
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", refresh);
      window.removeEventListener("focus", refresh);
    };
  }, [initialMessages]);

  /** Closing a message hides it on this device until the Council sends a new one. */
  function dismiss(id: string) {
    const next = dismissBroadcast(dismissed, id);
    setDismissed(next);
    try {
      window.localStorage.setItem(DISMISSED_BROADCASTS_KEY, serializeDismissedBroadcasts(next));
    } catch {
      // Storage unavailable: the message still closes for this session.
    }
  }

  const visible = messages.filter((broadcast) => !dismissed.includes(broadcast.id));

  return (
    <div aria-live="polite" aria-relevant="additions text" className={visible.length > 0 ? "border-b border-amber-500/30 bg-amber-500/10" : undefined}>
      {visible.map((broadcast) => {
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

            <div className="flex shrink-0 items-center gap-3">
              {href ? (
                href.startsWith("/") ? (
                  <Link href={href} className={buttonClasses("secondary", "sm", "shrink-0")}>
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

              <button
                type="button"
                onClick={() => dismiss(broadcast.id)}
                aria-label={t.broadcast.dismiss}
                className="shrink-0 rounded-md border border-border px-2 py-1 text-xs text-muted-foreground transition hover:text-foreground"
              >
                ✕
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

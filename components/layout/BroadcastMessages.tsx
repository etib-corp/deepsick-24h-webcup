"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { buttonClasses } from "@/components/ui/Button";
import { getPublicFeed, type PublicAlert } from "@/lib/actions/feed";
import type { PublicBroadcast } from "@/lib/actions/broadcasts";
import { isAlertSeverity, instructionSteps } from "@/lib/alerts";
import {
  DISMISSED_BROADCASTS_KEY,
  dismissBroadcast,
  parseDismissedBroadcasts,
  serializeDismissedBroadcasts,
} from "@/lib/broadcast-dismissals";
import { format } from "@/lib/i18n/format";
import { useT } from "@/lib/i18n/client";

/**
 * Site-wide banner (F73 / F101).
 *
 * - Live **colony alerts** appear first, in red, with the instructions to
 *   follow — they cannot be dismissed.
 * - High Council **broadcasts** follow, in amber, dismissible per device.
 *
 * One polling round-trip refreshes both (every 5 s, paused when the tab is
 * hidden), so alerts appear without delay everywhere without adding a second
 * polling channel (F95).
 */
export function BroadcastMessages({
  initialMessages,
  initialAlerts,
}: {
  initialMessages: PublicBroadcast[];
  initialAlerts: PublicAlert[];
}) {
  const t = useT();
  const [messages, setMessages] = useState(initialMessages);
  const [alerts, setAlerts] = useState(initialAlerts);
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
    // F95 — the feed is checked every 5 s while it recently changed, then
    // backs off to 30 s once quiet, and pauses entirely in a hidden tab.
    let lastChange = Date.now();
    let timer: number | undefined;

    setMessages(initialMessages);
    setAlerts(initialAlerts);

    function schedule() {
      if (disposed) return;
      if (timer) window.clearTimeout(timer);
      const idleMs = Date.now() - lastChange;
      const delay =
        document.visibilityState === "hidden" ? 30_000 : idleMs < 60_000 ? 5000 : 30_000;
      timer = window.setTimeout(refresh, delay);
    }

    async function refresh() {
      if (disposed) return;
      if (pending) {
        schedule();
        return;
      }
      pending = true;
      try {
        const result = await getPublicFeed();
        if (!disposed && result.ok) {
          setMessages((previous) => {
            const changed = JSON.stringify(previous) !== JSON.stringify(result.messages);
            if (changed) lastChange = Date.now();
            return changed ? result.messages : previous;
          });
          setAlerts((previous) => {
            const changed = JSON.stringify(previous) !== JSON.stringify(result.alerts);
            if (changed) lastChange = Date.now();
            return changed ? result.alerts : previous;
          });
        }
      } catch {
        // Keep the last visible message when the connection is temporarily lost.
      } finally {
        pending = false;
        schedule();
      }
    }

    function onWake() {
      if (disposed) return;
      if (document.visibilityState === "hidden") {
        schedule();
        return;
      }
      // Back on screen (or back on the tab): check immediately, then resume 5 s.
      lastChange = Date.now();
      void refresh();
    }

    schedule();
    document.addEventListener("visibilitychange", onWake);
    window.addEventListener("focus", onWake);
    return () => {
      disposed = true;
      if (timer) window.clearTimeout(timer);
      document.removeEventListener("visibilitychange", onWake);
      window.removeEventListener("focus", onWake);
    };
  }, [initialMessages, initialAlerts]);

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
    <>
      {alerts.length > 0 ? (
        <div
          aria-live="assertive"
          aria-relevant="additions text"
          className="border-b border-destructive/40 bg-destructive/10"
        >
          {alerts.map((alert) => {
            const steps = instructionSteps(alert.instructions);
            return (
              <div
                key={alert.id}
                role="alert"
                aria-label={t.alerts.bannerLabel}
                className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-3 sm:flex-row sm:items-start sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-destructive">
                    🚨 {t.alerts.bannerLabel} ·{" "}
                    {isAlertSeverity(alert.severity)
                      ? t.alerts.severities[alert.severity]
                      : alert.severity}
                  </p>
                  <p className="mt-0.5 font-mono text-sm font-medium text-foreground">
                    {alert.title}
                  </p>
                  <p className="mt-0.5 whitespace-pre-line text-sm text-muted-foreground">
                    {alert.situation}
                  </p>
                  {steps.length > 0 ? (
                    <p className="mt-1 text-xs text-muted-foreground">
                      <span className="font-mono uppercase tracking-wide">
                        {t.alerts.todo} :
                      </span>{" "}
                      {steps.slice(0, 2).join(" · ")}
                      {steps.length > 2 ? " …" : ""}
                    </p>
                  ) : null}
                  <p className="mt-1 font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
                    {alert.sector
                      ? format(t.alerts.sectorChip, { sector: alert.sector })
                      : t.alerts.wholeColony}
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-3">
                  <Link href="/alertes" className={buttonClasses("secondary", "sm", "shrink-0")}>
                    {t.alerts.readMore}
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      ) : null}

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
    </>
  );
}

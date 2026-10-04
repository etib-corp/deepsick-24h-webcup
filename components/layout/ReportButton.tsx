"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { buttonClasses } from "@/components/ui/Button";
import { useT } from "@/lib/i18n/client";
import { homeForRole } from "@/lib/roles";

// The report form is only needed once the modal opens — keep it out of the
// initial bundle of every page (F59/F96).
const ReportForm = dynamic(
  () => import("@/components/colony/ReportForm").then((mod) => mod.ReportForm),
  { ssr: false },
);

/**
 * Global "Signaler" button — always visible, lower right of every page.
 *
 * Opens a modal that lets a signed-in citizen file an incident report directly
 * (the same form as /citizen/report, with its inline confirmation). Visitors
 * are pointed to sign-in; staff are pointed back to their console, where the
 * reports are handled.
 */
export function ReportButton({ role }: { role: string | null }) {
  const t = useT();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // The button lives in the root layout, so it survives navigation: close the
  // modal whenever the route changes.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  function close() {
    setOpen(false);
    triggerRef.current?.focus();
  }

  const isCitizen = role === "CITIZEN";
  const isStaff = role !== null && !isCitizen;

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={open}
        data-tour="quick-report"
        className="fixed bottom-4 right-4 z-40 inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 font-mono text-[11px] uppercase tracking-wide text-primary-foreground shadow-lg ring-1 ring-background/20 transition hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        <span aria-hidden>🚨</span>
        {t.quickReport.button}
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="quick-report-title"
        >
          <button
            type="button"
            aria-label={t.quickReport.close}
            onClick={close}
            className="absolute inset-0 h-full w-full cursor-default bg-background/60 backdrop-blur-sm"
          />
          <div
            ref={panelRef}
            tabIndex={-1}
            className="absolute left-1/2 top-1/2 flex max-h-[88vh] w-[min(34rem,92vw)] -translate-x-1/2 -translate-y-1/2 flex-col rounded-lg border border-border bg-card p-5 shadow-2xl outline-none motion-safe:animate-in motion-safe:fade-in-0 motion-safe:zoom-in-95 motion-safe:duration-200"
          >
            <div className="flex items-center justify-between gap-3">
              <h2
                id="quick-report-title"
                className="font-mono text-sm uppercase tracking-wide text-primary"
              >
                {t.quickReport.title}
              </h2>
              <button
                type="button"
                onClick={close}
                aria-label={t.quickReport.close}
                className="rounded-md border border-border px-2 py-1 text-xs text-muted-foreground transition hover:text-foreground"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 overflow-y-auto pr-1">
              {isCitizen ? (
                <ReportForm />
              ) : (
                <div className="space-y-3 text-sm text-muted-foreground">
                  <p>{isStaff ? t.quickReport.staffText : t.quickReport.visitorText}</p>
                  {isStaff ? (
                    <Link
                      href={homeForRole(role)}
                      onClick={close}
                      className={buttonClasses("secondary", "sm")}
                    >
                      {t.quickReport.openConsole}
                    </Link>
                  ) : (
                    <Link href="/login" onClick={close} className={buttonClasses("primary", "sm")}>
                      {t.quickReport.login}
                    </Link>
                  )}
                  <p className="text-xs">
                    <Link
                      href="/statut"
                      onClick={close}
                      className="text-primary underline-offset-4 hover:underline"
                    >
                      {t.quickReport.emergency}
                    </Link>
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

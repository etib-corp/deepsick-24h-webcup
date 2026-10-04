"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { useT } from "@/lib/i18n/client";
import { cn } from "@/lib/ui";

/**
 * Hideable side menu (public shell).
 *
 * Collects the secondary pages that are not directly reachable from the main
 * navbar (arrivals, guide, projects, transport, appearance, eco, service
 * status). Hidden by default behind a slim edge handle; closes on ✕, backdrop
 * click or Escape, and restores focus to the handle.
 */

const SECTIONS = [
  { titleKey: "explore", items: ["arrivals", "guide", "projects", "transport"] },
  { titleKey: "info", items: ["appearance", "eco", "status"] },
] as const;

const HREFS: Record<(typeof SECTIONS)[number]["items"][number], string> = {
  arrivals: "/arrivants",
  guide: "/guide",
  projects: "/projects",
  transport: "/transport",
  appearance: "/apparence",
  eco: "/eco",
  status: "/statut",
};

export function SideMenu() {
  const t = useT();
  const [open, setOpen] = useState(false);
  const handleRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

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
    handleRef.current?.focus();
  }

  return (
    <>
      <button
        ref={handleRef}
        type="button"
        onClick={() => setOpen(true)}
        aria-expanded={open}
        aria-controls="side-menu-panel"
        aria-label={t.sideMenu.openAria}
        title={t.sideMenu.openAria}
        style={{ writingMode: "vertical-rl" }}
        className={cn(
          "fixed right-0 top-1/2 z-40 -translate-y-1/2 rounded-l-md border border-r-0 border-border bg-card/95 px-1.5 py-3 font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground shadow-lg backdrop-blur transition hover:text-primary",
          open && "pointer-events-none opacity-0",
        )}
      >
        {t.sideMenu.open}
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-50"
          role="dialog"
          aria-modal="true"
          aria-label={t.sideMenu.title}
        >
          <button
            type="button"
            aria-label={t.sideMenu.close}
            onClick={close}
            className="absolute inset-0 h-full w-full cursor-default bg-background/60 backdrop-blur-sm"
          />
          <div
            ref={panelRef}
            id="side-menu-panel"
            tabIndex={-1}
            className="absolute right-0 top-0 flex h-full w-72 max-w-[85vw] flex-col border-l border-border bg-card p-5 shadow-2xl outline-none motion-safe:animate-in motion-safe:slide-in-from-right motion-safe:duration-200"
          >
            <div className="flex items-center justify-between">
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-primary">
                {t.sideMenu.title}
              </p>
              <button
                type="button"
                onClick={close}
                aria-label={t.sideMenu.close}
                className="rounded-md border border-border px-2 py-1 text-xs text-muted-foreground transition hover:text-foreground"
              >
                ✕
              </button>
            </div>

            <nav className="mt-6 flex-1 space-y-6 overflow-y-auto">
              {SECTIONS.map((section) => (
                <div key={section.titleKey}>
                  <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                    {t.sideMenu[section.titleKey]}
                  </p>
                  <ul className="mt-2 space-y-1">
                    {section.items.map((item) => (
                      <li key={item}>
                        <Link
                          href={HREFS[item]}
                          onClick={close}
                          className="flex items-center gap-2 rounded-md px-2 py-2 text-sm text-muted-foreground transition hover:bg-muted hover:text-foreground"
                        >
                          <span aria-hidden className="text-primary/70">
                            /
                          </span>
                          {t.nav[item]}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </nav>

            <p className="mt-4 border-t border-border pt-3 font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
              {t.common.appName}
            </p>
          </div>
        </div>
      ) : null}
    </>
  );
}

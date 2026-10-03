"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { Bell } from "lucide-react";

import { SkipLink } from "@/components/layout/SkipLink";
import { StatusStrip } from "@/components/colony/StatusStrip";
import { LocaleSwitcher } from "@/components/i18n/LocaleSwitcher";
import { ThemePicker } from "@/components/layout/ThemePicker";
import { TourMenu } from "@/components/tour/TourMenu";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { buttonClasses } from "@/components/ui/Button";
import { useT } from "@/lib/i18n/client";
import { cn } from "@/lib/ui";

export type ConsoleNavItem = { href: string; label: string; icon?: string };

/**
 * Shell for the citizen dashboard and the professional consoles. Mirrors the
 * ui-v1 layout: a compact top bar (logo, station, colony pill, bell, theme),
 * the colony status strip, then a horizontal section nav.
 */
export function ConsoleShell({
  station,
  nav,
  children,
  unread = 0,
  bellHref,
  role,
  banner,
}: {
  station: string;
  nav: ConsoleNavItem[];
  children: ReactNode;
  unread?: number;
  bellHref?: string;
  /** Signed-in role — decides which tutorials this space offers. */
  role?: string | null;
  banner?: ReactNode;
}) {
  const t = useT();
  const pathname = usePathname();

  const activeHref = nav
    .filter((item) => pathname === item.href || pathname.startsWith(`${item.href}/`))
    .sort((a, b) => b.href.length - a.href.length)[0]?.href;
  const isActive = (href: string) => href === activeHref;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
        <SkipLink label={t.accessibility.skipToContent} />
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-3 px-4 py-3">
          <Link href={nav[0]?.href ?? "/"} aria-label={station} className="flex items-center gap-2">
            <span className="grid size-8 shrink-0 place-items-center rounded-full border-2 border-primary">
              <span className="size-3 rounded-full bg-primary" />
            </span>
            <span className="hidden font-mono text-[11px] uppercase tracking-[0.2em] text-foreground sm:inline">
              {station}
            </span>
          </Link>

          <span className="ml-auto hidden items-center gap-1.5 rounded-full border border-[var(--chart-3)]/40 bg-[var(--chart-3)]/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--chart-3)] sm:inline-flex">
            <span className="inline-block size-1.5 rounded-full bg-[var(--chart-3)]" />
            {t.common.colonyNominal}
          </span>

          {bellHref ? (
            <Link
              href={bellHref}
              aria-label={t.nav.notifications}
              className={cn(buttonClasses("ghost", "sm"), "relative")}
            >
              <Bell className="size-4" />
              {unread > 0 ? (
                <span className="absolute -right-0.5 -top-0.5 grid min-h-4 min-w-4 place-items-center rounded-full bg-destructive px-0.5 font-mono text-[9px] text-destructive-foreground">
                  {unread > 9 ? "9+" : unread}
                </span>
              ) : null}
            </Link>
          ) : null}

          <TourMenu role={role} />
          <LocaleSwitcher />
          <ThemePicker />

          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/" })}
            className={buttonClasses("ghost", "sm")}
          >
            {t.common.quit}
          </button>
        </div>

        <StatusStrip />
      </header>

      <nav aria-label={t.accessibility.spaceNavigation} className="border-b border-border bg-card/30" data-tour="console-nav">
        <div className="mx-auto flex max-w-5xl gap-1 overflow-x-auto px-4 py-2">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive(item.href) ? "page" : undefined}
              className={cn(
                "flex min-w-0 items-center gap-1.5 rounded-md px-2.5 py-1.5 font-mono text-[11px] uppercase tracking-wide transition",
                isActive(item.href)
                  ? "bg-muted text-primary underline underline-offset-4"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              {item.icon ? <span aria-hidden>{item.icon}</span> : null}
              {item.label}
            </Link>
          ))}
        </div>
      </nav>

      {banner}

      <main
        id="main-content"
        tabIndex={-1}
        data-console
        className="mx-auto max-w-5xl px-4 py-5"
      >
        <Breadcrumbs />
        {children}
      </main>
    </div>
  );
}

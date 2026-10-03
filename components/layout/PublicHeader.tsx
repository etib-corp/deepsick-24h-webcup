"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

import { LocaleSwitcher } from "@/components/i18n/LocaleSwitcher";
import { SkipLink } from "@/components/layout/SkipLink";
import { Logo } from "@/components/layout/Logo";
import { ThemePicker } from "@/components/layout/ThemePicker";
import { buttonClasses } from "@/components/ui/Button";
import { useT } from "@/lib/i18n/client";
import { homeForRole } from "@/lib/roles";
import { cn } from "@/lib/ui";

const LINKS = [
  { href: "/", label: "home" },
  { href: "/services", label: "services" },
  { href: "/announcements", label: "announcements" },
  { href: "/contact", label: "contact" },
  { href: "/guide", label: "guide" },
] as const;

export function PublicHeader({
  user,
}: {
  user: { name?: string | null; role: string } | null;
}) {
  const t = useT();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background backdrop-blur">
      <SkipLink label={t.accessibility.skipToContent} />
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-3">
        <Logo />

        <nav aria-label={t.accessibility.publicNavigation} className="hidden flex-wrap items-center gap-1 md:flex" data-tour="public-nav">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              aria-current={isActive(link.href) ? "page" : undefined}
              href={link.href}
              data-tour={`nav-${link.label}`}
              className={cn(
                "rounded-md px-3 py-2 font-mono text-xs uppercase tracking-wide transition",
                isActive(link.href)
                  ? "bg-muted text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <span aria-hidden className="mr-1 text-primary/70">
                {isActive(link.href) ? ">" : "/"}
              </span>
              {t.nav[link.label]}
            </Link>
          ))}
        </nav>

        <div className="hidden flex-wrap items-center gap-2 md:flex">
          <span data-tour="locale">
            <LocaleSwitcher />
          </span>
          <span data-tour="theme">
            <ThemePicker />
          </span>
          {user ? (
            <>
              <Link href={homeForRole(user.role)} className={buttonClasses("secondary", "sm")}>
                {t.nav.mySpace}
              </Link>
              <button
                type="button"
                onClick={() => signOut({ callbackUrl: "/" })}
                className={buttonClasses("ghost", "sm")}
              >
                {t.nav.signOut}
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className={buttonClasses("ghost", "sm")}>
                {t.nav.login}
              </Link>
              <Link href="/register" className={buttonClasses("primary", "sm")}>
                {t.nav.register}
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          ref={menuButton}
          aria-label={open ? t.accessibility.closeMenu : t.nav.openMenu}
          aria-expanded={open}
          aria-controls="public-mobile-menu"
          onClick={() => setOpen((value) => !value)}
          className={buttonClasses("secondary", "sm", "md:hidden")}
        >
          {t.nav.menu}
        </button>
      </div>

      {open ? (
        <div
          id="public-mobile-menu"
          className="border-t border-border px-4 py-3 md:hidden"
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              setOpen(false);
              menuButton.current?.focus();
            }
          }}
        >
          <nav aria-label={t.accessibility.publicNavigation} className="flex flex-col gap-1">
            {LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                aria-current={isActive(link.href) ? "page" : undefined}
                onClick={() => setOpen(false)}
                className="rounded-md px-3 py-2 font-mono text-xs uppercase tracking-wide text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                {t.nav[link.label]}
              </Link>
            ))}
          </nav>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <LocaleSwitcher />
            <ThemePicker />
            {user ? (
              <>
                <Link href={homeForRole(user.role)} className={buttonClasses("secondary", "sm")}>
                  {t.nav.mySpace}
                </Link>
                <button
                  type="button"
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className={buttonClasses("ghost", "sm")}
                >
                  {t.nav.signOut}
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className={buttonClasses("ghost", "sm")}>
                  {t.nav.login}
                </Link>
                <Link href="/register" className={buttonClasses("primary", "sm")}>
                  {t.nav.register}
                </Link>
              </>
            )}
          </div>
        </div>
      ) : null}
    </header>
  );
}

"use client";

import Link from "next/link";

import { LocaleSwitcher } from "@/components/i18n/LocaleSwitcher";
import { useT } from "@/lib/i18n/client";

export function PublicFooter() {
  const t = useT();

  return (
    <footer className="border-t border-border bg-card/40">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-8 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
        <p className="font-mono text-xs uppercase tracking-wide">
          <span aria-hidden className="mr-2 text-primary">
            //
          </span>
          {t.common.appName} — {t.nav.platform}
        </p>
        <div className="flex flex-wrap items-center gap-4 font-mono text-xs uppercase tracking-wide">
          <Link href="/services" className="hover:text-primary">
            [ {t.nav.services} ]
          </Link>
          <Link href="/announcements" className="hover:text-primary">
            [ {t.nav.announcements} ]
          </Link>
          <Link href="/contact" className="hover:text-primary">
            [ {t.nav.contact} ]
          </Link>
          <Link href="/guide" className="hover:text-primary" data-tour="footer-guide">
            [ {t.nav.guide} ]
          </Link>
          <Link href="/apparence" className="hover:text-primary">
            [ {t.nav.appearance} ]
          </Link>
          <LocaleSwitcher />
        </div>
      </div>
    </footer>
  );
}

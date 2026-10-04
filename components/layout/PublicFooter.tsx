"use client";

import Link from "next/link";

import { LocaleSwitcher } from "@/components/i18n/LocaleSwitcher";
import { LiteModeToggle } from "@/components/layout/LiteModeToggle";
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
          {/* F95 — footer links render on every public page; prefetching all
              of them would fire ~10 RSC requests per visit for links that
              are rarely used. Prefetching stays on the main navbar instead. */}
          <Link href="/arrivants" prefetch={false} className="hover:text-primary">
            [ {t.nav.arrivals} ]
          </Link>
          <Link href="/services" prefetch={false} className="hover:text-primary">
            [ {t.nav.services} ]
          </Link>
          <Link href="/transport" prefetch={false} className="hover:text-primary">
            [ {t.nav.transport} ]
          </Link>
          <Link href="/projects" prefetch={false} className="hover:text-primary">
            [ {t.nav.projects} ]
          </Link>
          <Link href="/announcements" prefetch={false} className="hover:text-primary">
            [ {t.nav.announcements} ]
          </Link>
          <Link href="/contact" prefetch={false} className="hover:text-primary">
            [ {t.nav.contact} ]
          </Link>
          <Link href="/guide" prefetch={false} className="hover:text-primary" data-tour="footer-guide">
            [ {t.nav.guide} ]
          </Link>
          <Link href="/apparence" prefetch={false} className="hover:text-primary">
            [ {t.nav.appearance} ]
          </Link>
          <Link href="/eco" prefetch={false} className="hover:text-primary">
            [ {t.nav.eco} ]
          </Link>
          <Link href="/statut" prefetch={false} className="hover:text-primary">
            [ {t.nav.status} ]
          </Link>
          <LiteModeToggle />
          <LocaleSwitcher />
        </div>
      </div>
    </footer>
  );
}

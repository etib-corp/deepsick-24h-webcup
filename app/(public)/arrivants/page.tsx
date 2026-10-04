import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, IdCard, Languages, LifeBuoy } from "lucide-react";

import { ArrivalsChecklist } from "@/components/arrivals/ArrivalsChecklist";
import { LocaleSwitcher } from "@/components/i18n/LocaleSwitcher";
import { buttonClasses } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { getDictionary } from "@/lib/i18n/server";

/** Simple information for new arrivals — readable with no account needed (F71). */

const FREE_LINKS = ["/services", "/announcements", "/contact", "/guide"] as const;

export function generateMetadata(): Metadata {
  return { title: getDictionary().arrivals.title };
}

export default function ArrivalsPage() {
  const t = getDictionary();

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-10">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <span className="inline-flex items-center gap-2 rounded-full border border-[var(--info)]/40 bg-[var(--info)]/10 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--info)]">
          {t.arrivals.badge}
        </span>
        <span className="text-xs text-muted-foreground">{t.arrivals.noAccountNote}</span>
      </div>

      <PageHeader title={t.arrivals.title} description={t.arrivals.subtitle} />

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="p-5">
          <div className="flex items-center gap-2">
            <Languages className="size-5 text-[var(--info)]" aria-hidden />
            <h2 className="font-mono text-lg text-foreground">{t.arrivals.languageTitle}</h2>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{t.arrivals.languageHint}</p>
          <div className="mt-3">
            <LocaleSwitcher />
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="font-mono text-lg text-foreground">{t.arrivals.freeTitle}</h2>
          <ul className="mt-2 space-y-1.5">
            {t.arrivals.freeItems.map((item, index) => (
              <li key={item}>
                <Link
                  href={FREE_LINKS[index] ?? "/services"}
                  className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                >
                  <ArrowRight className="size-3.5" aria-hidden />
                  {item}
                </Link>
              </li>
            ))}
          </ul>
          <Link href="/services" className={buttonClasses("secondary", "sm", "mt-3")}>
            {t.arrivals.freeAction}
          </Link>
        </Card>
      </div>

      <ArrivalsChecklist />

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="p-5">
          <div className="flex items-center gap-2">
            <IdCard className="size-5 text-[var(--info)]" aria-hidden />
            <h2 className="font-mono text-lg text-foreground">{t.arrivals.noEmailTitle}</h2>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{t.arrivals.noEmailText}</p>
          <Link href="/register" className={buttonClasses("primary", "sm", "mt-3")}>
            {t.arrivals.noEmailAction}
          </Link>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-2">
            <LifeBuoy className="size-5 text-[var(--info)]" aria-hidden />
            <h2 className="font-mono text-lg text-foreground">{t.arrivals.helpTitle}</h2>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{t.arrivals.helpText}</p>
          <Link href="/contact" className={buttonClasses("secondary", "sm", "mt-3")}>
            {t.arrivals.helpAction}
          </Link>
        </Card>
      </div>
    </div>
  );
}

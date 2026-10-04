import type { Metadata } from "next";
import Link from "next/link";

import { Badge } from "@/components/ui/Badge";
import { buttonClasses } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { getActivePartners } from "@/lib/data";
import { format, getDictionary } from "@/lib/i18n/server";
import { partnerAvailability } from "@/lib/partners";

export const dynamic = "force-dynamic";

export function generateMetadata(): Metadata {
  return { title: getDictionary().partners.title };
}

/**
 * F99 — external partner directory. Each card makes three things obvious:
 * whether the partner is available **now**, the opening window when it is
 * not, and the **next action** a resident can take.
 */
export default async function PartnersPage() {
  const t = getDictionary();
  const now = new Date();
  const partners = (await getActivePartners()).map((partner) => ({
    partner,
    availability: partnerAvailability(partner, now),
  }));

  const available = partners.filter((entry) => entry.availability.open);
  const unavailable = partners.filter((entry) => !entry.availability.open);

  function statusLine(entry: (typeof partners)[number]): string {
    const { availability } = entry;
    if (!availability.opensAt || !availability.closesAt) return t.partners.alwaysOpen;
    return availability.open
      ? format(t.partners.closesAt, { time: availability.closesAt })
      : format(t.partners.opensAt, { time: availability.opensAt });
  }

  function renderCard(entry: (typeof partners)[number]) {
    const { partner, availability } = entry;
    return (
      <Card key={partner.id} className="space-y-2 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-mono text-sm text-foreground">{partner.name}</h3>
          <Badge tone={availability.open ? "success" : "neutral"}>
            {availability.open ? t.partners.availableNow : t.partners.unavailableNow}
          </Badge>
        </div>

        {partner.category ? (
          <p className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
            {partner.category}
          </p>
        ) : null}

        <p className="text-sm text-muted-foreground">{partner.description}</p>
        <p className="font-mono text-[11px] text-muted-foreground">{statusLine(entry)}</p>
        {partner.contact ? (
          <p className="text-xs text-muted-foreground">
            {format(t.partners.contact, { contact: partner.contact })}
          </p>
        ) : null}

        {partner.actionHref ? (
          partner.actionHref.startsWith("/") ? (
            <Link href={partner.actionHref} className={buttonClasses("secondary", "sm")}>
              {partner.actionLabel ?? t.partners.actionFallback}
            </Link>
          ) : (
            <a
              href={partner.actionHref}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonClasses("secondary", "sm")}
            >
              {partner.actionLabel ?? t.partners.actionFallback}
            </a>
          )
        ) : null}
      </Card>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <PageHeader title={t.partners.title} description={t.partners.subtitle} />

      {partners.length === 0 ? (
        <Card className="p-6 text-center text-sm text-muted-foreground">{t.partners.empty}</Card>
      ) : (
        <div className="space-y-6">
          <section aria-labelledby="partners-available">
            <h2 id="partners-available" className="mb-2 font-mono text-sm text-foreground">
              {t.partners.availableTitle}
            </h2>
            {available.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t.partners.availableEmpty}</p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">{available.map(renderCard)}</div>
            )}
          </section>

          {unavailable.length > 0 ? (
            <section aria-labelledby="partners-unavailable">
              <h2 id="partners-unavailable" className="mb-2 font-mono text-sm text-foreground">
                {t.partners.unavailableTitle}
              </h2>
              <div className="grid gap-3 sm:grid-cols-2">{unavailable.map(renderCard)}</div>
            </section>
          ) : null}
        </div>
      )}
    </div>
  );
}

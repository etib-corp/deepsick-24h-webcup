import type { Metadata } from "next";
import Link from "next/link";

import { DataConcernForm } from "@/components/forms/DataConcernForm";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { getCitizenDataConcerns } from "@/lib/data";
import { getCitizenDataCounts } from "@/lib/data-export";
import { formatDateTime } from "@/lib/format";
import { getDictionary } from "@/lib/i18n/server";
import { requirePageRole } from "@/lib/permissions";
import { isConcernStatus } from "@/lib/roles";

export const dynamic = "force-dynamic";

export function generateMetadata(): Metadata {
  return { title: getDictionary().privacy.title };
}

const CONCERN_TONES = {
  RECEIVED: "info",
  REVIEWED: "warning",
  ANSWERED: "success",
} as const;

/**
 * F51 — "how is my data used?". The page explains what the city stores and
 * how it is used, lets the resident raise a concern, and keeps a visible
 * trace of the handling (reference + status + written response).
 */
export default async function CitizenDataPage() {
  const t = getDictionary();
  const session = await requirePageRole(["CITIZEN"]);
  const [concerns, sections] = await Promise.all([
    getCitizenDataConcerns(session.user.id),
    getCitizenDataCounts(session.user.id, t),
  ]);

  return (
    <div className="space-y-5">
      <PageHeader title={t.privacy.title} description={t.privacy.subtitle} />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-4">
          <h2 className="font-mono text-sm text-foreground">{t.privacy.storedTitle}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t.privacy.storedHint}</p>
          <ul className="mt-3 space-y-1.5 text-sm">
            {sections.map((section) => (
              <li key={section.key} className="flex items-baseline justify-between gap-3">
                <span className="text-muted-foreground">{section.label}</span>
                <span className="font-mono text-foreground">{section.count}</span>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="p-4">
          <h2 className="font-mono text-sm text-foreground">{t.privacy.usageTitle}</h2>
          <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
            {t.privacy.usageItems.map((item) => (
              <li key={item} className="flex gap-2">
                <span aria-hidden className="text-primary">
                  ▸
                </span>
                {item}
              </li>
            ))}
          </ul>
          <p className="mt-3 text-sm">
            <Link
              href="/citizen/account"
              className="text-primary underline-offset-4 hover:underline"
            >
              {t.privacy.manage}
            </Link>
          </p>
        </Card>
      </div>

      <Card className="p-4">
        <DataConcernForm />
      </Card>

      <section aria-labelledby="concern-trail">
        <h2 id="concern-trail" className="font-mono text-sm text-foreground">
          {t.privacy.trailTitle}
        </h2>
        {concerns.length === 0 ? (
          <p className="mt-1 text-sm text-muted-foreground">{t.privacy.trailEmpty}</p>
        ) : (
          <ol className="mt-2 space-y-2">
            {concerns.map((concern) => (
              <li key={concern.id} className="rounded-md border border-border p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm text-foreground">{concern.subject}</p>
                  <Badge
                    tone={
                      isConcernStatus(concern.status) ? CONCERN_TONES[concern.status] : "neutral"
                    }
                  >
                    {isConcernStatus(concern.status)
                      ? t.privacy.statuses[concern.status]
                      : concern.status}
                  </Badge>
                </div>
                <p className="mt-1 font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
                  {concern.reference} · {formatDateTime(concern.createdAt)}
                </p>
                {concern.response ? (
                  <p className="mt-2 rounded-md bg-muted/40 p-2 text-sm text-muted-foreground">
                    {concern.response}
                  </p>
                ) : null}
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}

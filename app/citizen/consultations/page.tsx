import type { Metadata } from "next";
import Link from "next/link";

import { FeedRow, SectionHeader } from "@/components/colony/FeedRow";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { getOpinionsByAuthor, getPublishedConsultations } from "@/lib/data";
import { getDictionary } from "@/lib/i18n/server";
import { requirePageRole } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export function generateMetadata(): Metadata {
  return { title: getDictionary().citizen.consultations.title };
}

export default async function CitizenConsultationsPage() {
  const t = getDictionary();
  const session = await requirePageRole(["CITIZEN"]);
  const [consultations, opinions] = await Promise.all([
    getPublishedConsultations(),
    getOpinionsByAuthor(session.user.id),
  ]);
  const answered = new Set(opinions.map((opinion) => opinion.consultationId));

  return (
    <div className="space-y-5">
      <header>
        <h1 className="font-mono text-xl text-foreground">{t.citizen.consultations.title}</h1>
        <p className="text-sm text-muted-foreground">{t.citizen.consultations.subtitle}</p>
      </header>

      <p className="rounded-lg border border-border bg-card p-3 text-xs text-muted-foreground">
        {t.citizen.consultations.note}
      </p>

      {consultations.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          {t.citizen.consultations.empty}
        </p>
      ) : (
        <section>
          <SectionHeader title={t.citizen.consultations.title} />
          <div className="space-y-2">
            {consultations.map((consultation) => (
              <Link key={consultation.id} href={`/citizen/consultations/${consultation.slug}`}>
                <Card className="transition hover:border-primary/50">
                  <FeedRow
                    className="border-0 bg-transparent p-0"
                    title={consultation.title}
                    meta={consultation.summary ?? undefined}
                    trailing={
                      <div className="flex items-center gap-2">
                        <Badge tone={consultation.status === "OPEN" ? "info" : "neutral"}>
                          {consultation.status === "OPEN"
                            ? t.citizen.consultations.open
                            : t.citizen.consultations.closed}
                        </Badge>
                        {consultation.status !== "OPEN" && consultation.outcome ? (
                          <Badge tone="success">{t.citizen.consultations.outcomeAvailable}</Badge>
                        ) : null}
                        {answered.has(consultation.id) ? (
                          <Badge tone="success">{t.citizen.consultations.opinionRecorded}</Badge>
                        ) : null}
                      </div>
                    }
                  />
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

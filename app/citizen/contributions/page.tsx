import type { Metadata } from "next";
import Link from "next/link";

import { FeedRow, SectionHeader } from "@/components/colony/FeedRow";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { getOpinionsByAuthor } from "@/lib/data";
import { formatDate } from "@/lib/format";
import { getDictionary } from "@/lib/i18n/server";
import { requirePageRole } from "@/lib/permissions";
import { OPINION_STANCE_LABELS, type OpinionStance } from "@/lib/roles";

export const dynamic = "force-dynamic";

export function generateMetadata(): Metadata {
  return { title: getDictionary().citizen.contributions.title };
}

export default async function CitizenContributionsPage() {
  const t = getDictionary();
  const session = await requirePageRole(["CITIZEN"]);
  const opinions = await getOpinionsByAuthor(session.user.id);

  return (
    <div className="space-y-5">
      <header>
        <h1 className="font-mono text-xl text-foreground">{t.citizen.contributions.title}</h1>
        <p className="text-sm text-muted-foreground">{t.citizen.contributions.subtitle}</p>
      </header>

      <SectionHeader title={t.citizen.contributions.title} />

      {opinions.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          {t.citizen.contributions.empty}
        </p>
      ) : (
        <div className="space-y-2">
          {opinions.map((opinion) => (
            <Card key={opinion.id} className="space-y-2">
              <Link
                href={`/citizen/consultations/${opinion.consultation.slug}`}
                className="block hover:text-primary"
              >
                <FeedRow
                  className="border-0 bg-transparent p-0"
                  title={opinion.consultation.title}
                  meta={`${opinion.reference} · ${formatDate(opinion.createdAt)}`}
                  trailing={
                    <div className="flex items-center gap-2">
                      {opinion.consultation.anonymous ? (
                        <Badge tone="warning">{t.citizen.consultations.anonymous}</Badge>
                      ) : null}
                      {opinion.stance ? (
                        <Badge tone="info">
                          {t.citizen.consultations.stance[opinion.stance as OpinionStance] ??
                            OPINION_STANCE_LABELS[opinion.stance as OpinionStance]}
                        </Badge>
                      ) : null}
                      <Badge tone="neutral">
                        {opinion.consultation.status === "OPEN"
                          ? t.citizen.consultations.open
                          : t.citizen.consultations.closed}
                      </Badge>
                    </div>
                  }
                />
              </Link>
              <p className="whitespace-pre-line text-sm text-muted-foreground">{opinion.comment}</p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

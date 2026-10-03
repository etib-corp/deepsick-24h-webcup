import { notFound } from "next/navigation";

import { FeedRow, SectionHeader } from "@/components/colony/FeedRow";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { getConsultationById, getOpinionsByConsultation, getOpinionStats } from "@/lib/data";
import { formatDateTime } from "@/lib/format";
import { format, getDictionary } from "@/lib/i18n/server";
import type { OpinionStance } from "@/lib/roles";

/**
 * Read-only view of a consultation's opinions for authorised agents
 * (COUNCIL / ADMIN_AGENT). Callers must enforce the role.
 */
export async function ConsultationOpinions({ id }: { id: string }) {
  const t = getDictionary();
  const consultation = await getConsultationById(id);
  if (!consultation) notFound();

  const [opinions, stats] = await Promise.all([
    getOpinionsByConsultation(id),
    getOpinionStats(id),
  ]);

  return (
    <div className="space-y-5">
      <header>
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={consultation.status === "OPEN" ? "info" : "neutral"}>
            {consultation.status === "OPEN"
              ? t.council.consultations.open
              : t.council.consultations.closed}
          </Badge>
          <Badge tone={consultation.published ? "success" : "neutral"}>
            {consultation.published
              ? t.council.consultations.published
              : t.council.consultations.draft}
          </Badge>
        </div>
        <h1 className="mt-2 font-mono text-xl text-foreground">{consultation.title}</h1>
        {consultation.summary ? (
          <p className="text-sm text-muted-foreground">{consultation.summary}</p>
        ) : null}
      </header>

      <Card className="p-4">
        <p className="whitespace-pre-line text-sm text-foreground">{consultation.description}</p>
      </Card>

      <Card className="p-4">
        <SectionHeader title={t.council.consultations.aggregate} />
        <div className="flex flex-wrap gap-2">
          <Badge tone="success">
            {format(t.council.consultations.aggregateSupport, { count: stats.support })}
          </Badge>
          <Badge tone="danger">
            {format(t.council.consultations.aggregateOppose, { count: stats.oppose })}
          </Badge>
          <Badge tone="neutral">
            {format(t.council.consultations.aggregateNeutral, { count: stats.neutral })}
          </Badge>
        </div>
      </Card>

      <section>
        <SectionHeader
          title={format(t.council.consultations.opinions, { count: opinions.length })}
        />
        {opinions.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            {t.council.consultations.noOpinions}
          </p>
        ) : (
          <div className="space-y-2">
            {opinions.map((opinion) => (
              <Card key={opinion.id} className="space-y-2">
                <FeedRow
                  className="border-0 bg-transparent p-0"
                  title={opinion.author?.name ?? t.common.none}
                  meta={`${opinion.reference} · ${formatDateTime(opinion.createdAt)}`}
                  trailing={
                    opinion.stance ? (
                      <Badge tone="info">
                        {t.citizen.consultations.stance[opinion.stance as OpinionStance] ??
                          opinion.stance}
                      </Badge>
                    ) : null
                  }
                />
                <p className="whitespace-pre-line text-sm text-muted-foreground">
                  {opinion.comment}
                </p>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

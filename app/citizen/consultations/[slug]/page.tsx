import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { OpinionForm } from "@/components/colony/OpinionForm";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { getConsultationBySlug, getOpinionByAuthorAndConsultation } from "@/lib/data";
import { format, getDictionary } from "@/lib/i18n/server";
import { requirePageRole } from "@/lib/permissions";

export const dynamic = "force-dynamic";

type Params = { params: { slug: string } };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const consultation = await getConsultationBySlug(params.slug);
  return { title: consultation?.title ?? getDictionary().citizen.consultations.title };
}

export default async function CitizenConsultationPage({ params }: Params) {
  const t = getDictionary();
  const session = await requirePageRole(["CITIZEN"]);
  const consultation = await getConsultationBySlug(params.slug);
  if (!consultation || !consultation.published) notFound();

  const opinion = await getOpinionByAuthorAndConsultation(consultation.id, session.user.id);
  const isOpen = consultation.status === "OPEN";

  return (
    <div className="space-y-5">
      <header>
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={isOpen ? "info" : "neutral"}>
            {isOpen ? t.citizen.consultations.open : t.citizen.consultations.closed}
          </Badge>
          {consultation.anonymous ? (
            <Badge tone="warning">{t.citizen.consultations.anonymous}</Badge>
          ) : null}
          {opinion ? (
            <Badge tone="success">{t.citizen.consultations.opinionRecorded}</Badge>
          ) : null}
        </div>
        <h1 className="mt-2 font-mono text-2xl text-foreground">{consultation.title}</h1>
        {consultation.summary ? (
          <p className="mt-1 text-sm text-muted-foreground">{consultation.summary}</p>
        ) : null}
      </header>

      <Card className="p-4">
        <p className="whitespace-pre-line text-sm text-foreground">{consultation.description}</p>
      </Card>

      {!isOpen && consultation.outcome ? (
        <Card className="space-y-1 border-primary/40 p-4">
          <p className="font-mono text-xs uppercase tracking-wide text-primary">
            {t.citizen.consultations.outcome}
          </p>
          <p className="whitespace-pre-line text-sm text-foreground">{consultation.outcome}</p>
        </Card>
      ) : null}

      <p className="rounded-lg border border-border bg-card p-3 text-xs text-muted-foreground">
        {isOpen ? t.citizen.consultations.note : t.citizen.consultations.readOnly}
      </p>

      <Card className="space-y-3 p-4">
        <h2 className="font-mono text-sm uppercase tracking-wide text-muted-foreground">
          {isOpen
            ? opinion
              ? t.citizen.consultations.editOpinion
              : t.citizen.consultations.giveOpinion
            : t.citizen.consultations.yourOpinion}
        </h2>

        {opinion ? (
          <p className="font-mono text-xs text-muted-foreground">
            {format(t.citizen.consultations.opinionReference, { reference: opinion.reference })}
          </p>
        ) : null}

        {isOpen ? (
          <OpinionForm
            consultationId={consultation.id}
            initialStance={opinion?.stance}
            initialComment={opinion?.comment}
            anonymous={consultation.anonymous}
          />
        ) : opinion ? (
          <div className="space-y-2 text-sm">
            <p className="font-mono text-xs uppercase tracking-wide text-primary">
              {t.citizen.consultations.yourOpinion}
              {opinion.stance
                ? ` · ${t.citizen.consultations.stance[opinion.stance as "SUPPORT" | "OPPOSE" | "NEUTRAL"]}`
                : ""}
            </p>
            <p className="whitespace-pre-line text-foreground">{opinion.comment}</p>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">{t.citizen.consultations.readOnly}</p>
        )}
      </Card>
    </div>
  );
}

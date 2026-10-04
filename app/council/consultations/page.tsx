import type { Metadata } from "next";
import Link from "next/link";

import { ConsultationForm } from "@/components/colony/ConsultationForm";
import { FeedRow, SectionHeader } from "@/components/colony/FeedRow";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import {
  deleteConsultationAction,
  setConsultationStatusAction,
  toggleConsultationAction,
} from "@/lib/actions/admin";
import { getAllConsultations } from "@/lib/data";
import { format, getDictionary } from "@/lib/i18n/server";
import { requirePageRole } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export function generateMetadata(): Metadata {
  return { title: getDictionary().council.consultations.title };
}

export default async function CouncilConsultationsPage() {
  const t = getDictionary();
  await requirePageRole(["COUNCIL"]);
  const consultations = await getAllConsultations();

  return (
    <div className="space-y-5">
      <header>
        <h1 className="font-mono text-xl text-foreground">{t.council.consultations.title}</h1>
        <p className="text-sm text-muted-foreground">{t.council.consultations.subtitle}</p>
      </header>

      <div className="grid gap-5 lg:grid-cols-[1fr,1.3fr]">
        <Card className="p-4">
          <SectionHeader title={t.council.consultations.new} />
          <ConsultationForm />
        </Card>

        <section>
          <SectionHeader
            title={t.council.consultations.list}
            badge={
              <span className="font-mono text-[11px] text-muted-foreground">
                {consultations.length}
              </span>
            }
          />
          <div className="space-y-2">
            {consultations.map((consultation) => (
              <Card key={consultation.id} className="p-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <Link
                    href={`/council/consultations/${consultation.id}`}
                    className="flex-1 hover:text-primary"
                  >
                    <FeedRow
                      className="border-0 bg-transparent p-0"
                      title={consultation.title}
                      meta={format(t.council.consultations.opinions, {
                        count: consultation._count.opinions,
                      })}
                    />
                  </Link>
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
                    {consultation.anonymous ? (
                      <Badge tone="warning">{t.council.consultations.anonymous}</Badge>
                    ) : null}
                    <form action={toggleConsultationAction}>
                      <input type="hidden" name="id" value={consultation.id} />
                      <input
                        type="hidden"
                        name="published"
                        value={consultation.published ? "false" : "true"}
                      />
                      <Button type="submit" variant="secondary" size="sm">
                        {consultation.published
                          ? t.council.consultations.unpublish
                          : t.council.consultations.publish}
                      </Button>
                    </form>
                    <form action={setConsultationStatusAction}>
                      <input type="hidden" name="id" value={consultation.id} />
                      <input
                        type="hidden"
                        name="status"
                        value={consultation.status === "OPEN" ? "CLOSED" : "OPEN"}
                      />
                      <Button type="submit" variant="secondary" size="sm">
                        {consultation.status === "OPEN"
                          ? t.council.consultations.close
                          : t.council.consultations.reopen}
                      </Button>
                    </form>
                    <form action={deleteConsultationAction}>
                      <input type="hidden" name="id" value={consultation.id} />
                      <Button type="submit" variant="ghost" size="sm">
                        {t.council.consultations.delete}
                      </Button>
                    </form>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

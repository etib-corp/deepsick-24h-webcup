import type { Metadata } from "next";
import Link from "next/link";

import { FeedRow, SectionHeader } from "@/components/colony/FeedRow";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { getAllConsultations } from "@/lib/data";
import { format, getDictionary } from "@/lib/i18n/server";
import { requirePageRole } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export function generateMetadata(): Metadata {
  return { title: getDictionary().council.consultations.title };
}

export default async function AgentConsultationsPage() {
  const t = getDictionary();
  await requirePageRole(["COUNCIL", "ADMIN_AGENT"]);
  const consultations = await getAllConsultations();

  return (
    <div className="space-y-5">
      <header>
        <h1 className="font-mono text-xl text-foreground">{t.council.consultations.title}</h1>
        <p className="text-sm text-muted-foreground">{t.council.consultations.subtitle}</p>
      </header>

      <section>
        <SectionHeader title={t.council.consultations.list} />
        <div className="space-y-2">
          {consultations.map((consultation) => (
            <Link
              key={consultation.id}
              href={`/operations/administration/consultations/${consultation.id}`}
            >
              <Card className="transition hover:border-primary/50">
                <FeedRow
                  className="border-0 bg-transparent p-0"
                  title={consultation.title}
                  meta={format(t.council.consultations.opinions, {
                    count: consultation._count.opinions,
                  })}
                  trailing={
                    <Badge tone={consultation.status === "OPEN" ? "info" : "neutral"}>
                      {consultation.status === "OPEN"
                        ? t.council.consultations.open
                        : t.council.consultations.closed}
                    </Badge>
                  }
                />
              </Card>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

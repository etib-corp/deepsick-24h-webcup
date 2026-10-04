import type { Metadata } from "next";

import { IdeaForm } from "@/components/citizen/IdeaForm";
import { SectionHeader } from "@/components/colony/FeedRow";
import { EmptyState } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { getIdeasByAuthor } from "@/lib/data";
import { formatDate } from "@/lib/format";
import { getDictionary } from "@/lib/i18n/server";
import { requirePageRole } from "@/lib/permissions";
import type { IdeaStatus } from "@/lib/roles";

export const dynamic = "force-dynamic";

const STATUS_TONES: Record<IdeaStatus, "neutral" | "info" | "success" | "warning"> = {
  SUBMITTED: "neutral",
  REVIEWED: "info",
  PLANNED: "success",
  DECLINED: "warning",
};

export function generateMetadata(): Metadata {
  return { title: getDictionary().citizen.ideas.title };
}

/** F68 — the resident proposes improvement ideas and follows the Council review. */
export default async function CitizenIdeasPage() {
  const t = getDictionary();
  const session = await requirePageRole(["CITIZEN"]);
  const ideas = await getIdeasByAuthor(session.user.id);

  return (
    <div className="space-y-5">
      <header>
        <h1 className="font-mono text-xl text-foreground">{t.citizen.ideas.title}</h1>
        <p className="text-sm text-muted-foreground">{t.citizen.ideas.subtitle}</p>
      </header>

      <div className="grid gap-5 lg:grid-cols-[1fr,1.2fr]">
        <Card className="p-4">
          <SectionHeader title={t.citizen.ideas.formTitle} />
          <IdeaForm />
        </Card>

        <section>
          <SectionHeader
            title={t.citizen.ideas.mine}
            badge={
              <span className="font-mono text-[11px] text-muted-foreground">{ideas.length}</span>
            }
          />
          {ideas.length === 0 ? (
            <EmptyState title={t.citizen.ideas.empty} description={t.citizen.ideas.emptyHint} />
          ) : (
            <div className="space-y-2">
              {ideas.map((idea) => (
                <Card key={idea.id} className="p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm text-foreground">{idea.title}</p>
                    <Badge tone={STATUS_TONES[idea.status as IdeaStatus] ?? "neutral"}>
                      {t.citizen.ideas.status[idea.status as IdeaStatus]}
                    </Badge>
                  </div>
                  <p className="mt-1 font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
                    {idea.reference} · {formatDate(idea.createdAt)}
                  </p>
                  <p className="mt-2 whitespace-pre-line text-sm text-muted-foreground">
                    {idea.body}
                  </p>
                  {idea.response ? (
                    <div className="mt-2 rounded-md border border-primary/30 bg-primary/5 p-2">
                      <p className="font-mono text-[10px] uppercase tracking-wide text-primary">
                        {t.citizen.ideas.response}
                      </p>
                      <p className="mt-1 whitespace-pre-line text-sm text-muted-foreground">
                        {idea.response}
                      </p>
                    </div>
                  ) : null}
                </Card>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

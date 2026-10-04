import type { Metadata } from "next";

import { EmptyState } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Select, Textarea } from "@/components/ui/Field";
import { reviewIdeaAction } from "@/lib/actions/ideas";
import { getAllIdeas } from "@/lib/data";
import { formatDate } from "@/lib/format";
import { format, getDictionary } from "@/lib/i18n/server";
import { requirePageRole } from "@/lib/permissions";
import { IDEA_STATUSES, type IdeaStatus } from "@/lib/roles";

export const dynamic = "force-dynamic";

const STATUS_TONES: Record<IdeaStatus, "neutral" | "info" | "success" | "warning"> = {
  SUBMITTED: "neutral",
  REVIEWED: "info",
  PLANNED: "success",
  DECLINED: "warning",
};

export function generateMetadata(): Metadata {
  return { title: getDictionary().council.ideas.title };
}

/** F68 — Council review desk for resident ideas. */
export default async function CouncilIdeasPage() {
  const t = getDictionary();
  await requirePageRole(["COUNCIL"]);
  const ideas = await getAllIdeas();

  return (
    <div className="space-y-5">
      <header>
        <h1 className="font-mono text-xl text-foreground">{t.council.ideas.title}</h1>
        <p className="text-sm text-muted-foreground">{t.council.ideas.subtitle}</p>
      </header>

      {ideas.length === 0 ? (
        <EmptyState title={t.citizen.ideas.empty} description={t.citizen.ideas.emptyHint} />
      ) : (
        <div className="space-y-3">
          {ideas.map((idea) => (
            <Card key={idea.id} className="p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-sm text-foreground">{idea.title}</p>
                  <p className="mt-0.5 font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
                    {idea.reference} ·{" "}
                    {format(t.council.ideas.author, {
                      name: idea.author?.name ?? t.common.colon,
                    })}{" "}
                    · {formatDate(idea.createdAt)}
                  </p>
                </div>
                <Badge tone={STATUS_TONES[idea.status as IdeaStatus] ?? "neutral"}>
                  {t.council.ideas.statusOptions[idea.status as IdeaStatus]}
                </Badge>
              </div>

              <p className="mt-2 whitespace-pre-line text-sm text-muted-foreground">{idea.body}</p>

              <form action={reviewIdeaAction} className="mt-3 space-y-2">
                <input type="hidden" name="id" value={idea.id} />
                <div className="grid gap-2 sm:grid-cols-[200px,1fr]">
                  <Select name="status" defaultValue={idea.status} aria-label={t.council.ideas.status}>
                    {IDEA_STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {t.council.ideas.statusOptions[status]}
                      </option>
                    ))}
                  </Select>
                  <Textarea
                    name="response"
                    defaultValue={idea.response ?? ""}
                    placeholder={t.council.ideas.responsePlaceholder}
                    className="min-h-16"
                  />
                </div>
                <Button type="submit" variant="secondary" size="sm">
                  {t.council.ideas.save}
                </Button>
              </form>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

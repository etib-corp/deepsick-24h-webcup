import type { Metadata } from "next";

import { SectionHeader } from "@/components/colony/FeedRow";
import { Badge } from "@/components/ui/Badge";
import { buttonClasses } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { answerDataConcernAction, reviewDataConcernAction } from "@/lib/actions/privacy";
import { getDataConcerns } from "@/lib/data";
import { formatDateTime } from "@/lib/format";
import { getDictionary } from "@/lib/i18n/server";
import { requirePageRole } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export function generateMetadata(): Metadata {
  return { title: getDictionary().privacy.councilTitle };
}

const STATUS_TONES = {
  RECEIVED: "info",
  REVIEWED: "warning",
  ANSWERED: "success",
} as const;

type ConcernStatusKey = keyof typeof STATUS_TONES;

/**
 * F51 — Council desk for data-usage concerns: every concern arrives with a
 * reference, is marked "being examined" and receives a written answer that
 * the resident sees in their personal space.
 */
export default async function CouncilDataConcernsPage() {
  const t = getDictionary();
  await requirePageRole(["COUNCIL"]);
  const concerns = await getDataConcerns();

  const open = concerns.filter((concern) => concern.status !== "ANSWERED");

  return (
    <div className="space-y-5">
      <header>
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          {t.privacy.councilEyebrow}
        </p>
        <h1 className="mt-1 font-mono text-xl text-foreground">{t.privacy.councilTitle}</h1>
        <p className="text-sm text-muted-foreground">{t.privacy.councilSubtitle}</p>
      </header>

      <Card className="p-4">
        <SectionHeader
          title={t.privacy.councilQueue}
          badge={
            <span className="font-mono text-[11px] text-muted-foreground">
              {open.length} / {concerns.length}
            </span>
          }
        />
        {concerns.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">{t.privacy.councilEmpty}</p>
        ) : (
          <div className="mt-2 space-y-3">
            {concerns.map((concern) => {
              const status = concern.status as ConcernStatusKey;
              return (
                <article key={concern.id} className="rounded-md border border-border p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm text-foreground">{concern.subject}</p>
                    <Badge tone={STATUS_TONES[status] ?? "neutral"}>
                      {t.privacy.statuses[status] ?? concern.status}
                    </Badge>
                  </div>
                  <p className="mt-1 font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
                    {concern.reference} · {concern.author?.name ?? t.common.colon} ·{" "}
                    {formatDateTime(concern.createdAt)}
                  </p>
                  <p className="mt-2 whitespace-pre-line text-sm text-muted-foreground">
                    {concern.body}
                  </p>

                  {concern.response ? (
                    <p className="mt-3 rounded-md bg-muted/40 p-2 text-sm text-foreground">
                      {t.privacy.councilAnswerLabel} {concern.response}
                    </p>
                  ) : null}

                  <div className="mt-3 flex flex-wrap items-end gap-3">
                    {concern.status === "RECEIVED" ? (
                      <form action={reviewDataConcernAction}>
                        <input type="hidden" name="id" value={concern.id} />
                        <input type="hidden" name="status" value="REVIEWED" />
                        <button type="submit" className={buttonClasses("secondary", "sm")}>
                          {t.privacy.councilReview}
                        </button>
                      </form>
                    ) : null}

                    {concern.status !== "ANSWERED" ? (
                      <form action={answerDataConcernAction} className="flex-1 space-y-2">
                        <input type="hidden" name="id" value={concern.id} />
                        <textarea
                          name="response"
                          required
                          minLength={5}
                          placeholder={t.privacy.councilAnswerPlaceholder}
                          className="min-h-20 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60"
                        />
                        <button type="submit" className={buttonClasses("primary", "sm")}>
                          {t.privacy.councilAnswer}
                        </button>
                      </form>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </Card>

      <p className="text-sm text-muted-foreground">{t.privacy.councilTrailHint}</p>
    </div>
  );
}

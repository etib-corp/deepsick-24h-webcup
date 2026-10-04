import type { Metadata } from "next";
import Link from "next/link";

import { FeedRow, SectionHeader } from "@/components/colony/FeedRow";
import { StatTile } from "@/components/colony/StatTile";
import { Badge } from "@/components/ui/Badge";
import { buttonClasses } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { PriorityBadge, StatusBadge } from "@/components/ui/StatusBadge";
import { getStaffRequests } from "@/lib/data";
import { formatDate } from "@/lib/format";
import { format } from "@/lib/i18n/format";
import { getDictionary } from "@/lib/i18n/server";
import { requirePageRole } from "@/lib/permissions";
import { buildSimilarityProfile, similarCounts } from "@/lib/similarity";

export const dynamic = "force-dynamic";

export function generateMetadata(): Metadata {
  return { title: getDictionary().ops.administration.title };
}

export default async function AdministrationConsolePage() {
  const t = getDictionary();
  await requirePageRole(["ADMIN_AGENT", "COUNCIL"]);
  const requests = await getStaffRequests();

  // F75 — probable duplicates flagged on the queue itself.
  const duplicateCounts = similarCounts(requests.map(buildSimilarityProfile));

  const actionable = requests.filter((request) =>
    ["SUBMITTED", "IN_REVIEW", "IN_PROGRESS"].includes(request.status),
  );
  const inReview = requests.filter((request) => request.status === "IN_REVIEW");
  const resolved = requests.filter((request) =>
    ["RESOLVED", "CLOSED"].includes(request.status),
  );

  return (
    <div className="space-y-5">
      <header>
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          BUREAU DES DÉMARCHES
        </p>
        <h1 className="mt-1 font-mono text-xl text-foreground">{t.ops.administration.title}</h1>
        <p className="text-sm text-muted-foreground">{t.ops.administration.subtitle}</p>
      </header>

      <div className="grid grid-cols-3 gap-3">
        <StatTile
          label={t.ops.administration.toProcess}
          value={actionable.length}
          hint={t.ops.administration.toProcessHint}
          tone="warning"
        />
        <StatTile
          label={t.ops.administration.inReview}
          value={inReview.length}
          hint={t.ops.administration.inReviewHint}
          tone="info"
        />
        <StatTile
          label={t.ops.administration.processed}
          value={resolved.length}
          hint={t.ops.administration.thisCycle}
          tone="success"
        />
      </div>

      <Card className="flex flex-wrap items-center justify-between gap-3 p-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-wide text-muted-foreground">
            {t.ops.administration.exportTitle}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">{t.ops.administration.exportHint}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a
            href="/api/operations/requests/export"
            download
            className={buttonClasses("secondary", "sm")}
          >
            {t.ops.administration.exportAll}
          </a>
          <a
            href="/api/operations/requests/export?scope=actionable"
            download
            className={buttonClasses("secondary", "sm")}
          >
            {t.ops.administration.exportActionable}
          </a>
        </div>
      </Card>

      <section>
        <SectionHeader
          title={t.ops.administration.queue}
          badge={<span className="font-mono text-[11px] text-muted-foreground">{requests.length}</span>}
        />
        {requests.length === 0 ? (
          <Card className="p-6 text-center text-sm text-muted-foreground">
            {t.ops.administration.empty}
          </Card>
        ) : (
          <div className="space-y-2">
            {requests.map((request) => (
              <Link key={request.id} href={`/operations/administration/${request.id}`}>
                <FeedRow
                  title={`${request.reference} · ${request.subject}`}
                  meta={`${request.author?.name ?? t.common.colon} · ${formatDate(request.createdAt)}${
                    request.category ? ` · ${request.category}` : ""
                  }`}
                  trailing={
                    <div className="flex items-center gap-1.5">
                      {duplicateCounts.get(request.id) ? (
                        <span
                          title={t.ops.administration.similarBadgeHint}
                          aria-label={t.ops.administration.similarBadgeHint}
                        >
                          <Badge tone="warning">
                            {format(t.ops.administration.similarBadge, {
                              count: duplicateCounts.get(request.id) ?? 0,
                            })}
                          </Badge>
                        </span>
                      ) : null}
                      {request._count.supports > 0 ? (
                        <Badge tone="info">🤝 {request._count.supports}</Badge>
                      ) : null}
                      {request._count.replies > 0 ? (
                        <Badge tone="mars">✉ {request._count.replies}</Badge>
                      ) : null}
                      <PriorityBadge priority={request.priority} />
                      <StatusBadge status={request.status} />
                    </div>
                  }
                />
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

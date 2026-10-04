import type { Metadata } from "next";

import { SectionHeader } from "@/components/colony/FeedRow";
import { EmptyState } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { buttonClasses } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { setRequestSharedAction, toggleSupportAction } from "@/lib/actions/supports";
import { getOwnRequestsForSharing, getSharedRequests, getSupportedRequestIds } from "@/lib/data";
import { format, getDictionary } from "@/lib/i18n/server";
import { requirePageRole } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export function generateMetadata(): Metadata {
  return { title: getDictionary().citizen.soutien.title };
}

/**
 * F52 — community support: citizens share their own requests and back the
 * shared requests of other residents. Sharing is opt-in per request; one
 * support per citizen and per request.
 */
export default async function CitizenSupportPage() {
  const t = getDictionary();
  const session = await requirePageRole(["CITIZEN"]);

  const [mine, shared, supported] = await Promise.all([
    getOwnRequestsForSharing(session.user.id),
    getSharedRequests(),
    getSupportedRequestIds(session.user.id),
  ]);
  const supportedIds = new Set(supported.map((row) => row.requestId));

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-mono text-xl text-foreground">{t.citizen.soutien.title}</h1>
        <p className="text-sm text-muted-foreground">{t.citizen.soutien.subtitle}</p>
      </header>

      <section>
        <SectionHeader title={t.citizen.soutien.mineTitle} />
        <p className="mb-3 mt-1 text-sm text-muted-foreground">{t.citizen.soutien.mineHint}</p>
        {mine.length === 0 ? (
          <EmptyState
            title={t.citizen.soutien.mineEmpty}
            description={t.citizen.soutien.mineEmptyHint}
          />
        ) : (
          <div className="space-y-2">
            {mine.map((request) => (
              <Card
                key={request.id}
                className="flex flex-wrap items-center justify-between gap-3 p-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm text-foreground">{request.subject}</p>
                  <p className="mt-0.5 font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
                    {request.reference} ·{" "}
                    {format(t.citizen.soutien.supports, { count: request._count.supports })}
                    {request.shareForSupport ? ` · ${t.citizen.soutien.sharedBadge}` : ""}
                  </p>
                </div>
                <form action={setRequestSharedAction}>
                  <input type="hidden" name="requestId" value={request.id} />
                  <input
                    type="hidden"
                    name="shared"
                    value={request.shareForSupport ? "false" : "true"}
                  />
                  <button type="submit" className={buttonClasses("secondary", "sm")}>
                    {request.shareForSupport
                      ? t.citizen.soutien.unshare
                      : t.citizen.soutien.share}
                  </button>
                </form>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section>
        <SectionHeader title={t.citizen.soutien.boardTitle} />
        {shared.length === 0 ? (
          <EmptyState
            title={t.citizen.soutien.boardEmpty}
            description={t.citizen.soutien.boardEmptyHint}
          />
        ) : (
          <div className="space-y-3">
            {shared.map((request) => {
              const isOwn = request.authorId === session.user.id;
              const isSupported = supportedIds.has(request.id);
              return (
                <Card key={request.id} className="p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusBadge status={request.status} />
                        {isOwn ? <Badge tone="info">{t.citizen.soutien.own}</Badge> : null}
                      </div>
                      <p className="mt-2 text-sm text-foreground">{request.subject}</p>
                      <p className="mt-1 line-clamp-3 whitespace-pre-line text-sm text-muted-foreground">
                        {request.description}
                      </p>
                      <p className="mt-1 font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
                        {request.reference} ·{" "}
                        {format(t.citizen.soutien.by, {
                          name: request.author?.name ?? t.common.colon,
                        })}{" "}
                        ·{" "}
                        {format(t.citizen.soutien.supports, { count: request._count.supports })}
                      </p>
                    </div>
                    {!isOwn ? (
                      <form action={toggleSupportAction}>
                        <input type="hidden" name="requestId" value={request.id} />
                        <button
                          type="submit"
                          aria-pressed={isSupported}
                          className={buttonClasses(isSupported ? "secondary" : "primary", "sm")}
                        >
                          {isSupported ? t.citizen.soutien.supported : t.citizen.soutien.support}
                        </button>
                      </form>
                    ) : null}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

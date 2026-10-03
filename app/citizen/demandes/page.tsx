import type { Metadata } from "next";
import Link from "next/link";

import { FeedRow, SectionHeader } from "@/components/colony/FeedRow";
import { PriorityBadge, StatusBadge } from "@/components/ui/StatusBadge";
import { getRequestsByAuthor } from "@/lib/data";
import { formatDate } from "@/lib/format";
import { getDictionary } from "@/lib/i18n/server";
import { requirePageRole } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export function generateMetadata(): Metadata {
  return { title: getDictionary().citizen.demandes.title };
}

export default async function CitizenDemandesPage() {
  const t = getDictionary();
  const session = await requirePageRole(["CITIZEN"]);
  const requests = await getRequestsByAuthor(session.user.id);

  return (
    <div>
      <div className="mb-4">
        <h1 className="font-mono text-xl text-foreground">{t.citizen.demandes.title}</h1>
        <p className="text-sm text-muted-foreground">{t.citizen.demandes.subtitle}</p>
      </div>

      <SectionHeader
        title={t.citizen.demandes.history}
        badge={<span className="font-mono text-[11px] text-muted-foreground">{requests.length}</span>}
      />

      {requests.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          {t.citizen.demandes.empty}
        </p>
      ) : (
        <div className="space-y-2">
          {requests.map((request) => (
            <Link key={request.id} href={`/citizen/demandes/${request.id}`}>
              <FeedRow
                title={`${request.reference} · ${request.subject}`}
                meta={[request.category, formatDate(request.createdAt)]
                  .filter(Boolean)
                  .join(" · ")}
                trailing={
                  <div className="flex items-center gap-1.5">
                    <PriorityBadge priority={request.priority} />
                    <StatusBadge status={request.status} />
                  </div>
                }
              />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

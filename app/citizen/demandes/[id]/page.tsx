import Link from "next/link";
import { notFound } from "next/navigation";

import { SectionHeader } from "@/components/colony/FeedRow";
import { Card } from "@/components/ui/Card";
import { PriorityBadge, StatusBadge } from "@/components/ui/StatusBadge";
import { getRequestById } from "@/lib/data";
import { formatDateTime } from "@/lib/format";
import { getDictionary } from "@/lib/i18n/server";
import { requirePageRole } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export default async function CitizenDemandeDetailPage({ params }: { params: { id: string } }) {
  const t = getDictionary();
  const session = await requirePageRole(["CITIZEN"]);
  const request = await getRequestById(params.id);
  if (!request || request.authorId !== session.user.id) notFound();

  return (
    <div className="space-y-5">
      <Link
        href="/citizen/demandes"
        className="font-mono text-[11px] uppercase tracking-wide text-primary hover:underline"
      >
        {t.citizen.demandes.back}
      </Link>

      <header>
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          {request.reference} · {request.category ?? t.citizen.demandes.category}
        </p>
        <h1 className="mt-1 font-mono text-xl text-foreground">{request.subject}</h1>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <StatusBadge status={request.status} />
          <PriorityBadge priority={request.priority} />
        </div>
      </header>

      <Card className="p-4">
        <SectionHeader title={t.citizen.demandes.description} />
        <p className="whitespace-pre-line text-sm text-foreground">{request.description}</p>
        <p className="mt-3 font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
          {formatDateTime(request.createdAt)}
        </p>
      </Card>

      <Card className="p-4">
        <SectionHeader title={t.citizen.demandes.tracking} />
        <ol className="space-y-3">
          {request.history.map((event) => (
            <li key={event.id} className="border-l border-border pl-3">
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={event.status} />
                <span className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
                  {formatDateTime(event.createdAt)}
                </span>
              </div>
              {event.note ? <p className="mt-1 text-sm text-muted-foreground">{event.note}</p> : null}
            </li>
          ))}
        </ol>
      </Card>
    </div>
  );
}

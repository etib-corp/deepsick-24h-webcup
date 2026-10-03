import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";

import { SectionHeader } from "@/components/colony/FeedRow";
import { RequestStatusForm } from "@/components/colony/RequestStatusForm";
import { Card } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { getRequestById } from "@/lib/data";
import { formatDateTime } from "@/lib/format";
import { format, getDictionary } from "@/lib/i18n/server";
import { requirePageRole } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export default async function AdministrationRequestPage({ params }: { params: { id: string } }) {
  const t = getDictionary();
  await requirePageRole(["ADMIN_AGENT", "COUNCIL"]);
  const request = await getRequestById(params.id);
  if (!request) notFound();

  return (
    <div className="space-y-5">
      <Breadcrumbs currentLabel={request.subject} />
      <Link
        href="/operations/administration"
        className="font-mono text-[11px] uppercase tracking-wide text-primary hover:underline"
      >
        {"← "}
        {t.ops.administration.queue}
      </Link>

      <header>
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          {request.reference} · {request.category ?? t.ops.administration.category}
        </p>
        <h1 className="mt-1 font-mono text-xl text-foreground">{request.subject}</h1>
        <div className="mt-2">
          <StatusBadge status={request.status} />
        </div>
      </header>

      <div className="grid gap-4 lg:grid-cols-[1.2fr,1fr]">
        <Card className="p-4">
          <SectionHeader title={t.ops.administration.colonRequest} />
          <p className="whitespace-pre-line text-sm text-foreground">{request.description}</p>
          <p className="mt-3 font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
            {format(t.ops.administration.depositedOn, {
              name: request.author?.name ?? t.common.none,
              email: request.author?.email ?? t.common.none,
              date: formatDateTime(request.createdAt),
            })}
          </p>
        </Card>

        <div className="space-y-4">
          <Card className="p-4">
            <SectionHeader title={t.ops.administration.instruction} />
            <RequestStatusForm requestId={request.id} status={request.status} />
          </Card>

          <Card className="p-4">
            <SectionHeader title={t.ops.administration.history} />
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
      </div>
    </div>
  );
}

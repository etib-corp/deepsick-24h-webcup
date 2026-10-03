import Link from "next/link";

import { Badge } from "@/components/ui/Badge";
import { buttonClasses } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/Card";
import { AppointmentStatusBadge, OrderStatusBadge, ReportStatusBadge, StatusBadge } from "@/components/ui/StatusBadge";
import { formatDateTime } from "@/lib/format";
import { format, getDictionary } from "@/lib/i18n/server";
import type { TrackedRequest, TrackingKind } from "@/lib/request-tracking";
import { isReportType } from "@/lib/roles";

function TrackingStatus({ kind, status }: { kind: TrackingKind; status: string }) {
  switch (kind) {
    case "request": return <StatusBadge status={status} />;
    case "report": return <ReportStatusBadge status={status} />;
    case "order": return <OrderStatusBadge status={status} />;
    case "appointment": return <AppointmentStatusBadge status={status} />;
    case "contact": {
      const labels = getDictionary().citizen.tracking.contactStatus;
      return <Badge tone={status === "PROCESSED" ? "success" : "info"}>{labels[status as keyof typeof labels] ?? status}</Badge>;
    }
  }
}

export function RequestTrackingCard({ item, detail = false }: { item: TrackedRequest; detail?: boolean }) {
  const t = getDictionary();
  const copy = t.citizen.tracking;
  const subtype = item.kind === "report" && isReportType(item.type) ? t.reportType[item.type]
    : item.kind === "order" && (item.type === "TAXI" || item.type === "FOOD") ? t.orderType[item.type] : null;
  const href = item.kind === "report" ? `/citizen/reports/${item.id}` : `/citizen/requests/${item.kind}/${item.id}`;

  return (
    <Card className="min-w-0 break-words">
      <CardHeader>
        <CardDescription>{copy.kinds[item.kind]}{subtype ? ` · ${subtype}` : ""} · {item.reference}</CardDescription>
        <CardTitle><h2 className="font-mono">{item.title}</h2></CardTitle>
        <CardDescription>
          {copy.created}: <time dateTime={item.createdAt.toISOString()}>{formatDateTime(item.createdAt)}</time>
        </CardDescription>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm">{copy.currentStatus}</span>
          <TrackingStatus kind={item.kind} status={item.status} />
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {item.scheduledAt ? <p>{copy.scheduled}: <time dateTime={item.scheduledAt.toISOString()}>{formatDateTime(item.scheduledAt)}</time></p> : null}
        {detail && item.description ? <p className="whitespace-pre-line">{item.description}</p> : null}
        {detail && item.kind === "order" ? (
          <dl className="grid gap-2 sm:grid-cols-2">
            {item.origin ? <div><dt className="text-muted-foreground">{copy.origin}</dt><dd>{item.origin}</dd></div> : null}
            {item.destination ? <div><dt className="text-muted-foreground">{copy.destination}</dt><dd>{item.destination}</dd></div> : null}
            <div><dt className="text-muted-foreground">{copy.total}</dt><dd>{item.total} {t.citizen.wallet.credits}</dd></div>
          </dl>
        ) : null}
        <h3 className="font-mono text-sm">{copy.steps}</h3>
        <ol className="flex flex-col gap-3">
          <li className="border-l border-border pl-3">
            <p>{copy.created}</p>
            <time className="text-sm text-muted-foreground" dateTime={item.createdAt.toISOString()}>{formatDateTime(item.createdAt)}</time>
          </li>
          {item.steps.map((step, index) => (
            <li key={index} className="border-l border-border pl-3">
              <div className="flex flex-wrap items-center gap-2">
                <TrackingStatus kind={item.kind} status={step.status} />
                <time className="text-sm text-muted-foreground" dateTime={step.createdAt.toISOString()}>{formatDateTime(step.createdAt)}</time>
              </div>
              {detail && step.note ? <p className="mt-1 whitespace-pre-line text-sm text-muted-foreground">{step.note}</p> : null}
            </li>
          ))}
        </ol>
        <p className="text-sm text-muted-foreground">
          {copy.updated}: <time dateTime={item.updatedAt.toISOString()}>{formatDateTime(item.updatedAt)}</time>
        </p>
        {!item.hasHistory ? <p className="text-sm text-muted-foreground">{copy.limitedHistory}</p> : null}
      </CardContent>
      {!detail ? (
        <CardFooter>
          <Link href={href} className={buttonClasses("secondary", "sm")} aria-label={format(copy.detailFor, { title: item.title, reference: item.reference })}>{copy.detail}</Link>
        </CardFooter>
      ) : null}
    </Card>
  );
}

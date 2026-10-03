import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";

import { SectionHeader } from "@/components/colony/FeedRow";
import { PoliceCaseForm, ReportAssignButton, ReportStatusForm } from "@/components/colony/ReportActions";
import { RadarCard } from "@/components/colony/RadarCard";
import { Card } from "@/components/ui/Card";
import { ReportPriorityBadge, ReportStatusBadge } from "@/components/ui/StatusBadge";
import { getReportById } from "@/lib/data";
import { formatDateTime } from "@/lib/format";
import { format, getDictionary } from "@/lib/i18n/server";
import { requirePageRole } from "@/lib/permissions";
import { REPORT_TYPE_ROLE, isReportType } from "@/lib/roles";

type Station = "security" | "medical" | "maintenance";

const STATION_FOR_TYPE: Record<string, Station> = {
  SECURITY: "security",
  MEDICAL: "medical",
  MAINTENANCE: "maintenance",
  CLEANLINESS: "maintenance",
};

/** Incident detail with the service action panel (take charge, update, PV). */
export async function ReportDetailView({ id }: { id: string }) {
  const t = getDictionary();
  const report = await getReportById(id);
  if (!report) notFound();

  const ownerRole = isReportType(report.type) ? REPORT_TYPE_ROLE[report.type] : "MAINTENANCE";
  const session = await requirePageRole([ownerRole, "COUNCIL"]);

  const station: Station = STATION_FOR_TYPE[report.type] ?? "maintenance";
  const canFileCase =
    report.type === "SECURITY" &&
    (session.user.role === "SECURITY" || session.user.role === "COUNCIL");

  return (
    <div className="space-y-5">
      <Breadcrumbs currentLabel={report.title} />
      <Link
        href={`/operations/${station}`}
        className="font-mono text-[11px] uppercase tracking-wide text-primary hover:underline"
      >
        {t.ops.detail.back}
      </Link>

      <header>
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          {report.reference} · {isReportType(report.type) ? t.reportType[report.type] : report.type}
        </p>
        <h1 className="mt-1 font-mono text-xl text-foreground">{report.title}</h1>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <ReportStatusBadge status={report.status} />
          <ReportPriorityBadge priority={report.priority} />
          {report.unit ? (
            <span className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
              {format(t.ops.forms.unitLabel, { name: report.unit })}
            </span>
          ) : null}
        </div>
      </header>

      <div className="grid gap-4 lg:grid-cols-[1.2fr,1fr]">
        <div className="space-y-4">
          <RadarCard
            label={report.sector ?? t.citizen.reports.unknownSector}
            caption={`${report.reference} · ${report.assignee?.name ?? t.common.unassigned}`}
            locked={report.status === "EN_ROUTE" || report.status === "IN_PROGRESS"}
          />

          <Card className="p-4">
            <SectionHeader title={t.ops.detail.colonReport} />
            <p className="whitespace-pre-line text-sm text-foreground">{report.description}</p>
            <div className="mt-3 grid grid-cols-2 gap-2 font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
              <span>{format(t.ops.detail.author, { name: report.author?.name ?? t.common.none })}</span>
              <span>{format(t.ops.detail.sector, { name: report.sector ?? t.common.none })}</span>
              <span>{format(t.ops.detail.opened, { date: formatDateTime(report.createdAt) })}</span>
              <span>
                {format(t.ops.detail.unit, {
                  name: report.assignee?.name ?? t.citizen.reports.noUnit,
                })}
              </span>
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="p-4">
            <SectionHeader title={t.ops.detail.processing} />
            <ReportStatusForm reportId={report.id} status={report.status} />
            <div className="mt-4 border-t border-border pt-3">
              <ReportAssignButton reportId={report.id} assigneeName={report.assignee?.name} />
            </div>
          </Card>

          {canFileCase ? (
            <Card className="p-4">
              <SectionHeader
                title={t.ops.detail.arrest}
                badge={report.policeCase ? <ReportStatusBadge status="CLOSED" /> : null}
              />
              <PoliceCaseForm reportId={report.id} existing={report.policeCase} />
            </Card>
          ) : null}

          <Card className="p-4">
            <SectionHeader title={t.ops.detail.timeline} />
            <ol className="space-y-3">
              {report.events.map((event) => (
                <li key={event.id} className="border-l border-border pl-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <ReportStatusBadge status={event.status} />
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

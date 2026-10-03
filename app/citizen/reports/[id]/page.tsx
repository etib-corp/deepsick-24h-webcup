import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";

import { RadarCard } from "@/components/colony/RadarCard";
import { SectionHeader } from "@/components/colony/FeedRow";
import { Card } from "@/components/ui/Card";
import { ReportPriorityBadge, ReportStatusBadge } from "@/components/ui/StatusBadge";
import { formatDateTime } from "@/lib/format";
import { getReportById } from "@/lib/data";
import { format, getDictionary } from "@/lib/i18n/server";
import { requirePageRole } from "@/lib/permissions";
import { isReportType } from "@/lib/roles";

export const dynamic = "force-dynamic";

type Params = { params: { id: string } };

export default async function CitizenReportDetailPage({ params }: Params) {
  const t = getDictionary();
  const session = await requirePageRole(["CITIZEN"]);
  const report = await getReportById(params.id);
  if (!report || report.authorId !== session.user.id) notFound();

  return (
    <div className="space-y-5">
      <Breadcrumbs currentLabel={report.title} />
      <Link href="/citizen/reports" className="font-mono text-[11px] uppercase tracking-wide text-primary hover:underline">
        {t.citizen.reports.back}
      </Link>

      <header>
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          {report.reference} · {isReportType(report.type) ? t.reportType[report.type] : report.type}
        </p>
        <h1 className="mt-1 font-mono text-xl text-foreground">{report.title}</h1>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <ReportStatusBadge status={report.status} />
          <ReportPriorityBadge priority={report.priority} />
          {report.sector ? (
            <span className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
              {report.sector}
            </span>
          ) : null}
        </div>
      </header>

      <RadarCard
        label={report.sector ?? t.citizen.reports.unknownSector}
        caption={`${report.reference} · ${report.unit ?? t.citizen.reports.noUnit}`}
        locked={report.status === "EN_ROUTE" || report.status === "IN_PROGRESS"}
      />

      <Card className="p-4">
        <SectionHeader title={t.citizen.reports.description} />
        <p className="whitespace-pre-line text-sm text-foreground">{report.description}</p>
        <p className="mt-3 font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
          {format(t.ops.forms.unitLabel, {
            name: report.assignee?.name ?? t.citizen.dashboard.awaitingAssignment,
          })}
        </p>
      </Card>

      <Card className="p-4">
        <SectionHeader title={t.citizen.reports.tracking} />
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

      {report.policeCase ? (
        <Card className="p-4">
          <SectionHeader
            title={t.citizen.reports.securityCase}
            badge={<ReportStatusBadge status="CLOSED" />}
          />
          <p className="text-sm text-muted-foreground">
            {format(t.citizen.reports.securityCaseText, {
              name: report.policeCase.suspectName ?? t.citizen.reports.notProvided,
            })}
          </p>
        </Card>
      ) : null}
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";

import { FeedRow, SectionHeader } from "@/components/colony/FeedRow";
import { buttonClasses } from "@/components/ui/Button";
import { ReportPriorityBadge, ReportStatusBadge } from "@/components/ui/StatusBadge";
import { getReports } from "@/lib/data";
import { getDictionary } from "@/lib/i18n/server";
import { requirePageRole } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export function generateMetadata(): Metadata {
  return { title: getDictionary().citizen.reports.title };
}

export default async function CitizenReportsPage() {
  const t = getDictionary();
  const session = await requirePageRole(["CITIZEN"]);
  const reports = await getReports({ authorId: session.user.id });

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-mono text-xl text-foreground">{t.citizen.reports.title}</h1>
          <p className="text-sm text-muted-foreground">{t.citizen.reports.subtitle}</p>
        </div>
        <Link href="/citizen/report" className={buttonClasses("primary", "sm")}>
          {t.citizen.reports.new}
        </Link>
      </div>

      <SectionHeader
        title={t.citizen.reports.history}
        badge={<span className="font-mono text-[11px] text-muted-foreground">{reports.length}</span>}
      />

      {reports.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          {t.citizen.reports.empty}
        </p>
      ) : (
        <div className="space-y-2">
          {reports.map((report) => (
            <Link key={report.id} href={`/citizen/reports/${report.id}`}>
              <FeedRow
                title={`${report.reference} · ${report.title}`}
                meta={[report.sector, report.assignee?.name ?? t.common.unassigned]
                  .filter(Boolean)
                  .join(" · ")}
                trailing={
                  <div className="flex items-center gap-1.5">
                    <ReportPriorityBadge priority={report.priority} />
                    <ReportStatusBadge status={report.status} />
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

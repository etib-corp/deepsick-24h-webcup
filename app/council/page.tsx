import type { Metadata } from "next";
import Link from "next/link";

import { FeedRow, SectionHeader } from "@/components/colony/FeedRow";
import { StatTile } from "@/components/colony/StatTile";
import { TourLauncher } from "@/components/tour/TourLauncher";
import { Card } from "@/components/ui/Card";
import { ReportStatusBadge } from "@/components/ui/StatusBadge";
import { getCouncilStats, getReports } from "@/lib/data";
import { formatDate } from "@/lib/format";
import { getDictionary } from "@/lib/i18n/server";
import { requirePageRole } from "@/lib/permissions";
import { isReportType } from "@/lib/roles";

export const dynamic = "force-dynamic";

export function generateMetadata(): Metadata {
  return { title: getDictionary().council.nav.overview };
}

export default async function CouncilPage() {
  const t = getDictionary();
  await requirePageRole(["COUNCIL"]);
  const [stats, reports] = await Promise.all([getCouncilStats(), getReports()]);

  const byType = reports.reduce<Record<string, number>>((acc, report) => {
    acc[report.type] = (acc[report.type] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-5">
      <header>
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          PILOTAGE · TERRA NOVA
        </p>
        <h1 className="mt-1 font-mono text-xl text-foreground">{t.council.overview.title}</h1>
        <p className="text-sm text-muted-foreground">{t.council.overview.subtitle}</p>
      </header>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6" data-tour="council-stats">
        <StatTile
          label={t.council.overview.open}
          value={stats.openReports}
          hint={t.council.overview.openHint}
          tone="danger"
        />
        <StatTile
          label={t.council.overview.inProgress}
          value={stats.inProgress}
          hint={t.council.overview.inProgressHint}
          tone="info"
        />
        <StatTile
          label={t.council.overview.services}
          value={stats.services}
          hint={t.council.overview.servicesHint}
          tone="primary"
        />
        <StatTile
          label={t.council.overview.announcements}
          value={stats.announcements}
          hint={t.council.overview.announcementsHint}
          tone="primary"
        />
        <StatTile
          label={t.council.overview.users}
          value={stats.users}
          hint={t.council.overview.usersHint}
          tone="success"
        />
        <StatTile
          label={t.council.overview.orders}
          value={stats.orders}
          hint={t.council.overview.ordersHint}
          tone="warning"
        />
      </div>

      <Card className="p-4">
        <SectionHeader title={t.council.overview.breakdown} />
        <div className="flex flex-wrap gap-2">
          {Object.entries(byType).map(([type, count]) => (
            <span
              key={type}
              className="rounded-md border border-border px-3 py-1.5 font-mono text-[11px] uppercase tracking-wide text-foreground"
            >
              {isReportType(type) ? t.reportType[type] : type} · {count}
            </span>
          ))}
        </div>
      </Card>

      <section>
        <SectionHeader
          title={t.council.overview.recent}
          action={
            <Link href="/council/users" className="font-mono text-[11px] uppercase tracking-wide text-primary hover:underline">
              {t.council.overview.manageUsers}
            </Link>
          }
        />
        <div className="space-y-2">
          {reports.slice(0, 8).map((report) => (
            <FeedRow
              key={report.id}
              title={`${report.reference} · ${report.title}`}
              meta={[report.sector, report.author?.name, formatDate(report.createdAt)]
                .filter(Boolean)
                .join(" · ")}
              trailing={<ReportStatusBadge status={report.status} />}
            />
          ))}
        </div>
      </section>

      <section>
        <SectionHeader title={t.council.overview.devTools} />
        <Link href="/dev/tickets">
          <Card size="sm" className="gap-1 p-4 transition hover:border-primary/50">
            <p className="font-mono text-sm text-foreground">{t.council.overview.devPanel}</p>
            <p className="text-xs text-muted-foreground">{t.council.overview.devPanelHint}</p>
          </Card>
        </Link>
      </section>

      {/* Every tour the Council can run, from here */}
      <section>
        <Card className="p-5">
          <TourLauncher onlyAccessible role="COUNCIL" />
        </Card>
      </section>
    </div>
  );
}

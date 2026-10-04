import type { Metadata } from "next";
import Link from "next/link";

import { FeedRow, SectionHeader } from "@/components/colony/FeedRow";
import { StatTile } from "@/components/colony/StatTile";
import { Badge } from "@/components/ui/Badge";
import { buttonClasses } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import {
  buildActivityReport,
  isReportDays,
  REPORT_DAY_OPTIONS,
} from "@/lib/activity-report";
import { getActivityReportData } from "@/lib/activity-report-data";
import { formatDate } from "@/lib/format";
import { format, getDictionary } from "@/lib/i18n/server";
import { requirePageRole } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export function generateMetadata(): Metadata {
  return { title: getDictionary().report.title };
}

/**
 * F103 — synthetic platform activity report for managers (High Council +
 * administration). Aggregated figures only, compared with the previous period,
 * with the period stated, a short list of items needing attention, and a CSV
 * export of the same figures.
 */
export default async function ActivityReportPage({
  searchParams,
}: {
  searchParams: { days?: string };
}) {
  const t = getDictionary();
  await requirePageRole(["COUNCIL", "ADMIN_AGENT"]);

  const days = isReportDays(searchParams.days) ? Number(searchParams.days) : 30;
  const data = await getActivityReportData({ days });
  const report = buildActivityReport(data.metrics, { days });

  const metricLabels = t.report.metrics as Record<string, string>;
  const attentionLabels = t.report.attentionItems as Record<string, string>;
  const max = Math.max(1, ...report.trends.map((trend) => trend.current));
  const perDay = report.totals.current > 0 ? (report.totals.current / days).toFixed(1) : "0";

  return (
    <div className="space-y-5">
      <header>
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          {t.report.eyebrow}
        </p>
        <h1 className="mt-1 font-mono text-xl text-foreground">{t.report.title}</h1>
        <p className="text-sm text-muted-foreground">{t.report.subtitle}</p>
        <p className="mt-2 font-mono text-[11px] uppercase tracking-wide text-muted-foreground">
          {format(t.report.periodRange, {
            from: formatDate(report.from),
            to: formatDate(report.to),
          })}
        </p>
      </header>

      <div className="flex flex-wrap items-center gap-2">
        {REPORT_DAY_OPTIONS.map((option) => (
          <Link
            key={option}
            href={`/operations/report?days=${option}`}
            className={buttonClasses(days === option ? "primary" : "secondary", "sm")}
          >
            {format(t.report.days, { days: option })}
          </Link>
        ))}
        <a
          href={`/api/operations/report/export?days=${days}`}
          download
          className={buttonClasses("secondary", "sm")}
        >
          {t.report.export}
        </a>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <StatTile
          label={t.report.total}
          value={report.totals.current}
          hint={format(t.report.totalHint, { days })}
          tone="info"
        />
        <StatTile
          label={t.report.perDay}
          value={perDay}
          hint={t.report.perDayHint}
          tone="primary"
        />
        <StatTile
          label={t.report.change}
          value={
            report.totals.change === null
              ? t.report.new
              : `${report.totals.change >= 0 ? "+" : ""}${report.totals.change}%`
          }
          hint={t.report.changeHint}
          tone={report.totals.change !== null && report.totals.change < 0 ? "danger" : "success"}
        />
      </div>

      <Card className="space-y-3 p-4">
        <div>
          <h2 className="font-mono text-sm text-foreground">{t.report.trends}</h2>
          <p className="text-sm text-muted-foreground">{t.report.trendsHint}</p>
        </div>
        <ul className="space-y-2.5">
          {report.trends.map((trend) => (
            <li key={trend.key}>
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="text-sm text-foreground">
                  {metricLabels[trend.key] ?? trend.key}
                </span>
                <span className="flex items-center gap-2 font-mono text-xs text-muted-foreground">
                  {trend.current} / {trend.previous}
                  {trend.change !== null ? (
                    <Badge tone={trend.change >= 0 ? "success" : "danger"}>
                      {trend.change >= 0 ? `+${trend.change}` : trend.change}%
                    </Badge>
                  ) : (
                    <Badge tone="info">{t.report.new}</Badge>
                  )}
                </span>
              </div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${Math.round((trend.current / max) * 100)}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      </Card>

      <section>
        <SectionHeader
          title={t.report.attention}
          badge={
            <span className="font-mono text-[11px] text-muted-foreground">
              {data.attention.length}
            </span>
          }
        />
        {data.attention.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            {t.report.attentionEmpty}
          </p>
        ) : (
          <div className="space-y-2">
            {data.attention.map((item) => (
              <Link key={item.key} href={item.href}>
                <FeedRow
                  icon="⚠️"
                  title={attentionLabels[item.key] ?? item.key}
                  meta={`${item.count}`}
                  trailing={<Badge tone="warning">{item.count}</Badge>}
                />
              </Link>
            ))}
          </div>
        )}
      </section>

      <p className="text-sm text-muted-foreground">{t.report.summaryNote}</p>
    </div>
  );
}

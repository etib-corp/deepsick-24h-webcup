import type { Metadata } from "next";
import Link from "next/link";

import { StatTile } from "@/components/colony/StatTile";
import { Badge } from "@/components/ui/Badge";
import { buttonClasses } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { getServiceIndex, getServiceVisitsSince } from "@/lib/data";
import { format, getDictionary } from "@/lib/i18n/server";
import { buildUsageReport, startOfUtcDay } from "@/lib/insights";
import { requirePageRole } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export function generateMetadata(): Metadata {
  return { title: getDictionary().insights.title };
}

const DAY_OPTIONS = [7, 30] as const;

/**
 * F98 — "which services are used the most?" The report is anonymous,
 * aggregated per day, compared with the previous period and framed with a
 * reading hint, so the Council gets an exploitable insight rather than raw
 * counters.
 */
export default async function CouncilInsightsPage({
  searchParams,
}: {
  searchParams: { days?: string };
}) {
  const t = getDictionary();
  await requirePageRole(["COUNCIL"]);

  const days = searchParams.days === "7" ? 7 : 30;
  const since = new Date(startOfUtcDay(new Date()).getTime() - days * 2 * 86_400_000);
  const [rows, services] = await Promise.all([getServiceVisitsSince(since), getServiceIndex()]);
  const report = buildUsageReport(rows, services, { days });

  const busiest = report.entries[0];
  const max = Math.max(1, ...report.entries.map((entry) => entry.count));
  const perDay = report.total > 0 ? (report.total / days).toFixed(1) : "0";

  return (
    <div className="space-y-5">
      <header>
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          {t.insights.eyebrow}
        </p>
        <h1 className="mt-1 font-mono text-xl text-foreground">{t.insights.title}</h1>
        <p className="text-sm text-muted-foreground">{t.insights.subtitle}</p>
      </header>

      <div className="flex flex-wrap items-center gap-2">
        {DAY_OPTIONS.map((option) => (
          <Link
            key={option}
            href={`/council/insights?days=${option}`}
            className={buttonClasses(days === option ? "primary" : "secondary", "sm")}
          >
            {format(t.insights.period, { days: option })}
          </Link>
        ))}
        <a
          href={`/api/council/insights/export?days=${days}`}
          download
          className={buttonClasses("secondary", "sm")}
        >
          {t.insights.export}
        </a>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <StatTile
          label={t.insights.total}
          value={report.total}
          hint={format(t.insights.totalHint, { days })}
          tone="info"
        />
        <StatTile
          label={t.insights.perDay}
          value={perDay}
          hint={t.insights.perDayHint}
          tone="primary"
        />
        <StatTile
          label={t.insights.busiest}
          value={busiest ? busiest.name : "—"}
          hint={busiest ? format(t.insights.busiestHint, { count: busiest.count }) : t.insights.empty}
          tone="warning"
        />
      </div>

      {report.total === 0 ? (
        <Card className="p-6 text-center text-sm text-muted-foreground">{t.insights.empty}</Card>
      ) : (
        <Card className="space-y-3 p-4">
          <h2 className="font-mono text-sm text-foreground">{t.insights.ranking}</h2>
          <p className="text-sm text-muted-foreground">
            {format(t.insights.concentration, { share: report.topShare })}
          </p>
          <ul className="space-y-2.5">
            {report.entries
              .filter((entry) => entry.count > 0 || entry.previous > 0)
              .map((entry) => (
                <li key={entry.serviceId}>
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <span className="text-sm text-foreground">
                      {entry.slug ? (
                        <Link href={`/services/${entry.slug}`} className="hover:underline">
                          {entry.name}
                        </Link>
                      ) : (
                        entry.name
                      )}
                    </span>
                    <span className="flex items-center gap-2 font-mono text-xs text-muted-foreground">
                      {entry.count} · {entry.share}%
                      {entry.change !== null ? (
                        <Badge tone={entry.change >= 0 ? "success" : "danger"}>
                          {entry.change >= 0 ? `+${entry.change}` : entry.change}%
                        </Badge>
                      ) : null}
                    </span>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${Math.round((entry.count / max) * 100)}%` }}
                    />
                  </div>
                </li>
              ))}
          </ul>
        </Card>
      )}

      <p className="text-sm text-muted-foreground">{t.insights.privacy}</p>
    </div>
  );
}

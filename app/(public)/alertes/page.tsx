import type { Metadata } from "next";

import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { isAlertLive, isAlertSeverity, instructionSteps, sortAlertsBySeverity } from "@/lib/alerts";
import { getActiveColonyAlerts, getAllColonyAlerts } from "@/lib/data";
import { formatDate, formatDateTime } from "@/lib/format";
import { format, getDictionary } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

export function generateMetadata(): Metadata {
  return { title: getDictionary().alerts.title };
}

const SEVERITY_TONES = {
  CRITICAL: "danger",
  WARNING: "warning",
  ADVISORY: "info",
} as const;

/**
 * F101 — colony alerts page: for each live alert, what residents must know
 * and what they must do, immediately readable. Resolved alerts stay listed
 * for a short while so inhabitants can confirm the situation is over.
 */
export default async function AlertsPage() {
  const t = getDictionary();
  const [activeRows, allRows] = await Promise.all([
    getActiveColonyAlerts(),
    getAllColonyAlerts(10),
  ]);

  const live = sortAlertsBySeverity(activeRows.filter((alert) => isAlertLive(alert)));
  const resolved = allRows.filter((alert) => alert.status === "RESOLVED").slice(0, 5);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <PageHeader title={t.alerts.title} description={t.alerts.subtitle} />

      {live.length === 0 ? (
        <Card className="p-6 text-center">
          <p className="text-2xl" aria-hidden>
            ✅
          </p>
          <p className="mt-2 text-sm text-muted-foreground">{t.alerts.empty}</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {live.map((alert) => {
            const steps = instructionSteps(alert.instructions);
            return (
              <Card key={alert.id} className="border-destructive/40 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="font-mono text-base text-foreground">{alert.title}</h2>
                  <Badge tone={isAlertSeverity(alert.severity) ? SEVERITY_TONES[alert.severity] : "danger"}>
                    {isAlertSeverity(alert.severity)
                      ? t.alerts.severities[alert.severity]
                      : alert.severity}
                  </Badge>
                </div>
                <p className="mt-1 font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
                  {alert.sector
                    ? format(t.alerts.sectorChip, { sector: alert.sector })
                    : t.alerts.wholeColony}
                  {alert.startsAt ? ` · ${format(t.alerts.since, { date: formatDate(alert.startsAt) })}` : ""}
                </p>

                <div className="mt-3">
                  <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                    {t.alerts.know}
                  </p>
                  <p className="mt-1 whitespace-pre-line text-sm text-foreground">
                    {alert.situation}
                  </p>
                </div>

                {steps.length > 0 ? (
                  <div className="mt-3 rounded-md border border-destructive/40 bg-destructive/10 p-3">
                    <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-destructive">
                      {t.alerts.todo}
                    </p>
                    <ol className="mt-2 space-y-1.5 text-sm text-foreground">
                      {steps.map((step, index) => (
                        <li key={index} className="flex gap-2">
                          <span
                            aria-hidden
                            className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-destructive/20 font-mono text-[10px] text-destructive"
                          >
                            {index + 1}
                          </span>
                          {step}
                        </li>
                      ))}
                    </ol>
                  </div>
                ) : null}
              </Card>
            );
          })}
        </div>
      )}

      {resolved.length > 0 ? (
        <section aria-labelledby="resolved-alerts" className="mt-8">
          <h2 id="resolved-alerts" className="font-mono text-sm text-foreground">
            {t.alerts.resolvedTitle}
          </h2>
          <ul className="mt-2 space-y-1.5">
            {resolved.map((alert) => (
              <li
                key={alert.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border px-3 py-2 text-sm"
              >
                <span className="text-muted-foreground">
                  ✅ {alert.title}
                  {alert.sector ? ` · ${alert.sector}` : ""}
                </span>
                <span className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
                  {alert.resolvedAt
                    ? format(t.alerts.resolvedAt, { date: formatDateTime(alert.resolvedAt) })
                    : ""}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

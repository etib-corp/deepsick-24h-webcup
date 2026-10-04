import type { Metadata } from "next";

import { AlertForm } from "@/components/colony/AlertForm";
import { SectionHeader } from "@/components/colony/FeedRow";
import { Badge } from "@/components/ui/Badge";
import { buttonClasses } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { deleteColonyAlertAction, resolveColonyAlertAction } from "@/lib/actions/alerts";
import { getDictionary } from "@/lib/i18n/server";
import { formatDateTime } from "@/lib/format";
import { getAllColonyAlerts } from "@/lib/data";
import { requirePageRole } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export function generateMetadata(): Metadata {
  return { title: getDictionary().alerts.councilTitle };
}

/** F101 — Council crisis desk: publish, follow and lift colony alerts. */
export default async function CouncilAlertsPage() {
  const t = getDictionary();
  await requirePageRole(["COUNCIL"]);
  const alerts = await getAllColonyAlerts();

  return (
    <div className="space-y-5">
      <header>
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          {t.alerts.councilEyebrow}
        </p>
        <h1 className="mt-1 font-mono text-xl text-foreground">{t.alerts.councilTitle}</h1>
        <p className="text-sm text-muted-foreground">{t.alerts.councilSubtitle}</p>
      </header>

      <Card className="space-y-3 p-4">
        <SectionHeader title={t.alerts.council.listTitle} />
        {alerts.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t.alerts.council.empty}</p>
        ) : (
          <ul className="space-y-2">
            {alerts.map((alert) => (
              <li
                key={alert.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="text-sm text-foreground">{alert.title}</p>
                  <p className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
                    {alert.sector ?? t.alerts.wholeColony} · {formatDateTime(alert.createdAt)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge tone={alert.status === "ACTIVE" ? "danger" : "neutral"}>
                    {alert.status === "ACTIVE" ? t.alerts.council.live : t.alerts.council.resolved}
                  </Badge>
                  {alert.status === "ACTIVE" ? (
                    <form action={resolveColonyAlertAction}>
                      <input type="hidden" name="id" value={alert.id} />
                      <button type="submit" className={buttonClasses("secondary", "sm")}>
                        {t.alerts.council.resolve}
                      </button>
                    </form>
                  ) : null}
                  <form action={deleteColonyAlertAction}>
                    <input type="hidden" name="id" value={alert.id} />
                    <button type="submit" className={buttonClasses("danger", "sm")}>
                      {t.alerts.council.delete}
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card className="space-y-3 p-4">
        <SectionHeader title={t.alerts.council.createTitle} />
        <AlertForm />
      </Card>
    </div>
  );
}

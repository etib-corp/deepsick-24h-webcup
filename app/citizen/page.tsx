import type { Metadata } from "next";
import Link from "next/link";

import { FeedRow, SectionHeader } from "@/components/colony/FeedRow";
import { StatTile } from "@/components/colony/StatTile";
import { Badge } from "@/components/ui/Badge";
import { buttonClasses } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import {
  OrderStatusBadge,
  ReportPriorityBadge,
  ReportStatusBadge,
} from "@/components/ui/StatusBadge";
import { colonySol, colonyTime, COLONY_POPULATION } from "@/lib/colony";
import { getOrders, getReports } from "@/lib/data";
import { format, getDictionary } from "@/lib/i18n/server";
import { requirePageRole } from "@/lib/permissions";
import { CIVIC_SERVICES, REPORT_ACTIONABLE } from "@/lib/roles";

export const dynamic = "force-dynamic";

export function generateMetadata(): Metadata {
  return { title: getDictionary().citizen.nav.home };
}

export default async function CitizenDashboardPage() {
  const t = getDictionary();
  const session = await requirePageRole(["CITIZEN"]);
  const [reports, orders] = await Promise.all([
    getReports({ authorId: session.user.id }),
    getOrders({ customerId: session.user.id }),
  ]);

  const actionable = new Set<string>(REPORT_ACTIONABLE as readonly string[]);
  const activeReports = reports.filter((report) => actionable.has(report.status));
  const activeOrders = orders.filter(
    (order) => order.status !== "COMPLETED" && order.status !== "CANCELLED",
  );
  const firstName = session.user.name?.split(" ")[0] ?? "colon";
  const activeCount = activeReports.length + activeOrders.length;

  return (
    <div className="space-y-6">
      <header>
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          {format(t.citizen.dashboard.colonStatus, { id: session.user.id.slice(-6).toUpperCase() })}
        </p>
        <div className="mt-1 flex items-center gap-2">
          <h1 className="font-mono text-xl text-foreground">
            {format(t.citizen.dashboard.greeting, { name: firstName })}
          </h1>
          <Badge tone="info">{t.citizen.dashboard.tier}</Badge>
        </div>
      </header>

      <div className="grid grid-cols-3 gap-3">
        <StatTile
          label={t.citizen.dashboard.local}
          value={colonyTime()}
          hint={format(t.citizen.dashboard.sol, { sol: colonySol() })}
          tone="primary"
        />
        <StatTile
          label={t.citizen.dashboard.air}
          value="99.2%"
          hint={t.citizen.dashboard.nominal}
          tone="info"
        />
        <StatTile
          label={t.citizen.dashboard.radiation}
          value="0.18"
          hint={t.citizen.dashboard.safe}
          tone="success"
        />
      </div>

      <Card className="space-y-3">
        <SectionHeader title={t.citizen.dashboard.ready} />
        <div className="grid grid-cols-2 gap-2">
          <Link href="/citizen/orders?type=TAXI" className={buttonClasses("secondary", "sm")}>
            {t.citizen.dashboard.callRover}
          </Link>
          <Link href="/citizen/orders?type=FOOD" className={buttonClasses("secondary", "sm")}>
            {t.citizen.dashboard.orderFood}
          </Link>
        </div>
        <p className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
          {format(t.landing.population, { population: COLONY_POPULATION })}
        </p>
      </Card>

      <section>
        <SectionHeader
          title={t.citizen.dashboard.activeRequests}
          badge={
            <Badge tone="warning">
              {format(t.citizen.dashboard.inProgressCount, { count: activeCount })}
            </Badge>
          }
          action={
            <Link href="/citizen/requests" className="font-mono text-[11px] uppercase tracking-wide text-primary hover:underline">
              {t.common.seeAll}
            </Link>
          }
        />

        {activeCount === 0 ? (
          <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            {t.citizen.dashboard.empty}
          </p>
        ) : (
          <div className="space-y-2">
            {activeReports.slice(0, 3).map((report) => (
              <Link key={report.id} href={`/citizen/reports/${report.id}`}>
                <FeedRow
                  title={`${report.reference} · ${report.title}`}
                  meta={[
                    report.sector,
                    report.assignee?.name
                      ? format(t.citizen.dashboard.unit, { name: report.assignee.name })
                      : t.citizen.dashboard.awaitingAssignment,
                  ]
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
            {activeOrders.slice(0, 3).map((order) => (
              <Link key={order.id} href="/citizen/orders">
                <FeedRow
                  icon={order.type === "TAXI" ? "🚡" : "🍜"}
                  title={`${order.reference} · ${order.summary}`}
                  meta={[
                    order.etaMinutes ? `ETA ${order.etaMinutes} min` : null,
                    `${order.total} ${t.citizen.wallet.credits}`,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                  trailing={<OrderStatusBadge status={order.status} />}
                />
              </Link>
            ))}
          </div>
        )}
      </section>

      <section>
        <SectionHeader title={t.citizen.dashboard.civicNetwork} />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {CIVIC_SERVICES.map((service) => {
            const copy =
              t.civicServices[service.key as keyof typeof t.civicServices] ?? {
                label: service.label,
                description: service.description,
              };

            return (
              <Link key={service.key} href={service.href}>
                <Card size="sm" className="h-full gap-1 p-3 transition hover:border-primary/50">
                  <span aria-hidden className="text-lg">
                    {service.icon}
                  </span>
                  <p className="font-mono text-xs text-foreground">{copy.label}</p>
                  <p className="text-[11px] leading-snug text-muted-foreground">
                    {copy.description}
                  </p>
                </Card>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}

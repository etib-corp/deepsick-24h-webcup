import type { Metadata } from "next";

import { DisruptionForm } from "@/components/colony/DisruptionForm";
import { FeedRow, LiveBadge, SectionHeader } from "@/components/colony/FeedRow";
import { OrderStatusForm } from "@/components/colony/OrderStatusForm";
import { RadarCard } from "@/components/colony/RadarCard";
import { StatTile } from "@/components/colony/StatTile";
import { Badge } from "@/components/ui/Badge";
import { buttonClasses } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { resolveDisruptionAction } from "@/lib/actions/disruptions";
import { getAllTransitDisruptions, getOrders } from "@/lib/data";
import { formatDate } from "@/lib/format";
import { getDictionary } from "@/lib/i18n/server";
import { requirePageRole } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export function generateMetadata(): Metadata {
  return { title: getDictionary().ops.transport.title };
}

export default async function TransportConsolePage() {
  const t = getDictionary();
  await requirePageRole(["DRIVER", "COUNCIL"]);
  const [orders, disruptions] = await Promise.all([
    getOrders({ type: "TAXI" }),
    getAllTransitDisruptions(),
  ]);

  const active = orders.filter((order) => ["CONFIRMED", "IN_TRANSIT"].includes(order.status));
  const pending = orders.filter((order) => order.status === "PENDING");
  const done = orders.filter((order) => order.status === "COMPLETED");

  return (
    <div className="space-y-5">
      <header>
        <div className="flex items-center justify-between gap-3">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            HERMES MOBILITY NET · 42 online
          </p>
          <LiveBadge />
        </div>
        <h1 className="mt-1 font-mono text-xl text-foreground">{t.ops.transport.title}</h1>
        <p className="text-sm text-muted-foreground">{t.ops.transport.subtitle}</p>
      </header>

      <div className="grid grid-cols-3 gap-3">
        <StatTile
          label={t.ops.transport.waiting}
          value={pending.length}
          hint={t.ops.transport.waitingHint}
          tone="warning"
        />
        <StatTile
          label={t.ops.transport.running}
          value={active.length}
          hint={t.ops.transport.runningHint}
          tone="info"
        />
        <StatTile
          label={t.ops.transport.completed}
          value={done.length}
          hint={t.ops.transport.thisCycle}
          tone="success"
        />
      </div>

      <RadarCard
        label={t.ops.transport.radarLabel}
        caption={t.ops.transport.radarCaption}
        locked
        blips={[
          { x: 0.4, y: 0.5, tone: "warning" },
          { x: 0.66, y: 0.36, tone: "info" },
        ]}
      />

      {/* F97 — line interruptions and the replacement solutions to show. */}
      <Card className="space-y-3 p-4">
        <SectionHeader title={t.disruptions.console.listTitle} />
        <p className="text-sm text-muted-foreground">{t.disruptions.console.hint}</p>

        {disruptions.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t.disruptions.console.empty}</p>
        ) : (
          <ul className="space-y-2">
            {disruptions.map((disruption) => (
              <li
                key={disruption.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="text-sm text-foreground">{disruption.title}</p>
                  <p className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
                    {disruption.lineId} · {formatDate(disruption.createdAt)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge tone={disruption.active ? "danger" : "neutral"}>
                    {disruption.active
                      ? t.disruptions.console.live
                      : t.disruptions.console.resolved}
                  </Badge>
                  {disruption.active ? (
                    <form action={resolveDisruptionAction}>
                      <input type="hidden" name="id" value={disruption.id} />
                      <button type="submit" className={buttonClasses("secondary", "sm")}>
                        {t.disruptions.console.resolve}
                      </button>
                    </form>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}

        <div className="border-t border-border pt-3">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            {t.disruptions.console.createTitle}
          </p>
          <div className="mt-3">
            <DisruptionForm />
          </div>
        </div>
      </Card>

      <section>
        <SectionHeader title={t.ops.transport.queue} badge={<LiveBadge label={`${orders.length}`} />} />
        {orders.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            {t.ops.transport.empty}
          </p>
        ) : (
          <div className="space-y-2">
            {orders.map((order) => (
              <Card key={order.id} className="p-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <FeedRow
                    className="flex-1 border-0 bg-transparent p-0"
                    icon="🚡"
                    title={`${order.reference} · ${order.summary}`}
                    meta={[
                      order.customer?.name ?? null,
                      order.etaMinutes ? `ETA ${order.etaMinutes} min` : null,
                      `${order.total} ${t.citizen.wallet.credits}`,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  />
                  <OrderStatusForm orderId={order.id} status={order.status} />
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

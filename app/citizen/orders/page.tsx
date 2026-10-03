import type { Metadata } from "next";

import { FeedRow, SectionHeader } from "@/components/colony/FeedRow";
import { OrderForm } from "@/components/colony/OrderForm";
import { Card } from "@/components/ui/Card";
import { OrderStatusBadge } from "@/components/ui/StatusBadge";
import { getOrders } from "@/lib/data";
import { getDictionary } from "@/lib/i18n/server";
import { requirePageRole } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export function generateMetadata(): Metadata {
  return { title: getDictionary().citizen.orders.title };
}

export default async function CitizenOrdersPage({
  searchParams,
}: {
  searchParams: { type?: string };
}) {
  const t = getDictionary();
  const session = await requirePageRole(["CITIZEN"]);
  const orders = await getOrders({ customerId: session.user.id });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-mono text-xl text-foreground">{t.citizen.orders.title}</h1>
        <p className="text-sm text-muted-foreground">{t.citizen.orders.subtitle}</p>
      </header>

      <Card className="p-4">
        <SectionHeader title={t.citizen.orders.newOrder} />
        <OrderForm defaultType={searchParams.type === "FOOD" ? "FOOD" : "TAXI"} />
      </Card>

      <section>
        <SectionHeader
          title={t.citizen.orders.history}
          badge={<span className="font-mono text-[11px] text-muted-foreground">{orders.length}</span>}
        />
        {orders.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            {t.citizen.orders.empty}
          </p>
        ) : (
          <div className="space-y-2">
            {orders.map((order) => (
              <FeedRow
                key={order.id}
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
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

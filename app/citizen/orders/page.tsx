import type { Metadata } from "next";

import { CitizenOrderCard } from "@/components/citizen/CitizenOrderCard";
import { OrderForm } from "@/components/colony/OrderForm";
import { Reveal } from "@/components/motion/Reveal";
import { EmptyState } from "@/components/ui/Alert";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { getOrders } from "@/lib/data";
import { getDictionary } from "@/lib/i18n/server";
import { requirePageRole } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export function generateMetadata(): Metadata {
  return { title: getDictionary().citizen.orders.title };
}

export default async function CitizenOrdersPage({ searchParams }: {
  searchParams: { type?: string };
}) {
  const t = getDictionary();
  const copy = t.citizen.orders;
  const session = await requirePageRole(["CITIZEN"]);
  const orders = await getOrders({ customerId: session.user.id });
  const active = orders.filter((order) => !["COMPLETED", "CANCELLED"].includes(order.status));
  const history = orders.filter((order) => ["COMPLETED", "CANCELLED"].includes(order.status));

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2 border-b border-border pb-5">
        <h1 className="font-mono text-2xl">{copy.title}</h1>
        <p className="text-sm text-muted-foreground">{copy.subtitle}</p>
      </header>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <section aria-labelledby="new-order-title" className="min-w-0">
          <Card>
            <CardHeader>
              <h2 id="new-order-title" className="font-mono text-lg">{copy.newOrder}</h2>
              <p className="text-sm text-muted-foreground">{copy.formHint}</p>
            </CardHeader>
            <CardContent>
              <OrderForm defaultType={searchParams.type === "FOOD" ? "FOOD" : "TAXI"} />
            </CardContent>
          </Card>
        </section>

        <section aria-labelledby="active-orders-title" className="min-w-0">
          <h2 id="active-orders-title" className="mb-4 font-mono text-lg">{copy.active} · {active.length}</h2>
          {active.length === 0 ? <EmptyState title={copy.activeEmpty} /> : (
            <Reveal className="flex flex-col gap-4">
              {active.map((order) => <CitizenOrderCard key={order.id} order={order} />)}
            </Reveal>
          )}
        </section>
      </div>

      <section aria-labelledby="order-history-title">
        <h2 id="order-history-title" className="mb-2 font-mono text-lg">{copy.history} · {history.length}</h2>
        <p className="mb-4 text-sm text-muted-foreground">{copy.historyHint}</p>
        {history.length === 0 ? <EmptyState title={copy.historyEmpty} /> : (
          <Reveal className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {history.map((order) => <CitizenOrderCard key={order.id} order={order} />)}
          </Reveal>
        )}
      </section>
    </div>
  );
}

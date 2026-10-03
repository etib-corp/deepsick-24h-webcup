import Link from "next/link";

import { CommerceOrderCard, type CommerceOrder } from "@/components/commerce/CommerceOrderCard";
import { EmptyState } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button, buttonClasses } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, Stat } from "@/components/ui/Card";
import { Field, Input, Select } from "@/components/ui/Field";
import { OrderStatusBadge } from "@/components/ui/StatusBadge";
import { format, getDictionary } from "@/lib/i18n/server";
import { ORDER_STATUSES } from "@/lib/roles";

export function CommerceDashboard({ orders, query, status }: {
  orders: CommerceOrder[];
  query: string;
  status: string;
}) {
  const t = getDictionary();
  const copy = t.ops.commerce;
  const active = orders.filter((order) => !["COMPLETED", "CANCELLED"].includes(order.status));
  const revenue = orders.filter((order) => order.status === "COMPLETED")
    .reduce((sum, order) => sum + order.total, 0);
  const counts = Object.fromEntries(ORDER_STATUSES.map((value) => [value, orders.filter((order) => order.status === value).length]));
  const visible = orders.filter((order) =>
    (!status || order.status === status) &&
    (!query || [order.reference, order.summary, order.customer?.name].filter(Boolean).join(" ").toLocaleLowerCase().includes(query.toLocaleLowerCase())),
  );
  const queue = visible.filter((order) => !["COMPLETED", "CANCELLED"].includes(order.status));
  const history = visible.filter((order) => ["COMPLETED", "CANCELLED"].includes(order.status));

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-3 border-b border-border pb-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="font-mono text-xs uppercase tracking-widest text-primary">Mercator Exchange</p>
          <Badge tone="info">{copy.activeOrders} · {active.length}</Badge>
        </div>
        <h1 className="font-mono text-2xl">{copy.title}</h1>
        <p className="text-sm text-muted-foreground">{copy.subtitle}</p>
        <nav aria-label={copy.title} className="flex flex-wrap gap-2">
          <a href="#commerce-orders" className={buttonClasses("secondary", "sm")}>{copy.queue}</a>
          <a href="#commerce-history" className={buttonClasses("ghost", "sm")}>{copy.history}</a>
        </nav>
      </header>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label={copy.pending} value={counts.PENDING} hint={copy.pendingHint} />
        <Stat label={copy.preparing} value={counts.CONFIRMED + counts.PREPARING} hint={copy.preparingHint} />
        <Stat label={copy.ready} value={counts.READY} hint={copy.readyHint} />
        <Stat label={copy.revenue} value={revenue} hint={copy.revenueScope} />
      </div>

      <form action="/operations/commerce" method="get" className="flex flex-wrap items-end gap-3 rounded-xl border border-border bg-card p-4">
        <div className="min-w-0 flex-1 basis-60">
          <Field label={copy.search} htmlFor="commerce-query">
            <Input key={query} id="commerce-query" name="q" type="search" maxLength={160} defaultValue={query} placeholder={copy.searchPlaceholder} />
          </Field>
        </div>
        <div className="min-w-0 flex-1 basis-44">
          <Field label={copy.statusFilter} htmlFor="commerce-status">
            <Select key={status} id="commerce-status" name="status" defaultValue={status}>
              <option value="">{copy.allStatuses}</option>
              {ORDER_STATUSES.map((value) => <option key={value} value={value}>{t.orderStatus[value]}</option>)}
            </Select>
          </Field>
        </div>
        <Button type="submit">{copy.applyFilters}</Button>
        {query || status ? <Link href="/operations/commerce" className={buttonClasses("ghost")}>{copy.resetFilters}</Link> : null}
      </form>

      <p className="text-sm text-muted-foreground">{format(copy.results, { count: visible.length })}</p>
      {visible.length === 0 ? <EmptyState title={orders.length === 0 ? copy.empty : copy.noResults} /> : null}

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <section id="commerce-orders" aria-labelledby="commerce-orders-title" tabIndex={-1} className="min-w-0 scroll-mt-48">
          <h2 id="commerce-orders-title" className="mb-3 font-mono text-base">{copy.queue} · {queue.length}</h2>
          {queue.length === 0 ? <EmptyState title={copy.empty} /> : (
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              {queue.map((order) => <CommerceOrderCard key={order.id} order={order} />)}
            </div>
          )}
        </section>

        <aside aria-labelledby="commerce-activity-title" className="min-w-0">
          <Card>
            <CardHeader>
              <h2 id="commerce-activity-title" className="font-mono text-base">{copy.activity}</h2>
              <p className="text-sm text-muted-foreground">{copy.activityHint}</p>
            </CardHeader>
            <CardContent>
              <dl className="flex flex-col gap-3">
                {ORDER_STATUSES.map((value) => (
                  <div key={value} className="flex flex-wrap items-center justify-between gap-2">
                    <dt><OrderStatusBadge status={value} /></dt>
                    <dd className="font-mono">{counts[value]}</dd>
                  </div>
                ))}
              </dl>
            </CardContent>
          </Card>
        </aside>
      </div>

      <section id="commerce-history" aria-labelledby="commerce-history-title" tabIndex={-1} className="scroll-mt-48">
        <h2 id="commerce-history-title" className="mb-2 font-mono text-base">{copy.history} · {history.length}</h2>
        <p className="mb-4 text-sm text-muted-foreground">{copy.historyHint}</p>
        {history.length === 0 ? <EmptyState title={copy.noHistory} /> : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {history.map((order) => <CommerceOrderCard key={order.id} order={order} />)}
          </div>
        )}
      </section>
    </div>
  );
}

import { OrderStatusForm } from "@/components/colony/OrderStatusForm";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/Card";
import { OrderStatusBadge } from "@/components/ui/StatusBadge";
import type { getOrders } from "@/lib/data";
import { formatDateTime } from "@/lib/format";
import { format, getDictionary } from "@/lib/i18n/server";

export type CommerceOrder = Awaited<ReturnType<typeof getOrders>>[number];

export function CommerceOrderCard({ order }: { order: CommerceOrder }) {
  const t = getDictionary();
  const copy = t.ops.commerce;
  const titleId = `commerce-order-${order.id}`;
  const details = [
    [copy.customer, order.customer?.name || copy.unknownCustomer],
    [copy.sector, order.customer?.sector],
    [copy.origin, order.origin],
    [copy.destination, order.destination],
    [copy.eta, order.etaMinutes == null ? null : format(copy.etaMinutes, { minutes: order.etaMinutes })],
  ].filter(([, value]) => value);

  return (
    <article aria-labelledby={titleId}>
      <Card className="h-full">
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-mono text-xs text-muted-foreground">{order.reference}</span>
            <OrderStatusBadge status={order.status} />
          </div>
          <h3 id={titleId} className="font-mono text-base">{order.summary}</h3>
          <p className="text-sm text-muted-foreground">
            {copy.createdAt}{" "}
            <time dateTime={order.createdAt.toISOString()}>{formatDateTime(order.createdAt)}</time>
          </p>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <dl className="flex flex-col gap-2 text-sm">
            {details.map(([label, value]) => (
              <div key={label} className="flex flex-wrap justify-between gap-x-4 gap-y-1">
                <dt className="text-muted-foreground">{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
          <p className="font-mono text-lg text-primary">
            {order.total} <span className="text-sm">{t.citizen.wallet.credits}</span>
          </p>
        </CardContent>
        <CardFooter className="mt-auto flex-col items-stretch gap-2">
          <p className="text-sm text-muted-foreground">{copy.updateStatus}</p>
          <div role="group" aria-label={`${copy.updateStatus} · ${order.reference}`} className="[&>form]:flex-wrap [&_select]:max-w-full [&_select]:flex-1">
            <OrderStatusForm orderId={order.id} status={order.status} />
          </div>
        </CardFooter>
      </Card>
    </article>
  );
}

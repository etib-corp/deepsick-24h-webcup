import Link from "next/link";
import { TramFront, Utensils } from "lucide-react";

import { buttonClasses } from "@/components/ui/Button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/Card";
import { OrderStatusBadge } from "@/components/ui/StatusBadge";
import type { getOrders } from "@/lib/data";
import { formatDateTime } from "@/lib/format";
import { format, getDictionary } from "@/lib/i18n/server";

type CitizenOrder = Awaited<ReturnType<typeof getOrders>>[number];

export function CitizenOrderCard({ order }: { order: CitizenOrder }) {
  const t = getDictionary();
  const copy = t.citizen.orders;
  const isFood = order.type === "FOOD";
  const titleId = `citizen-order-${order.id}`;

  return (
    <article aria-labelledby={titleId}>
      <Card className="h-full">
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="flex items-center gap-2 font-mono text-xs text-muted-foreground">
              {isFood ? <Utensils aria-hidden="true" className="size-4 shrink-0" /> : <TramFront aria-hidden="true" className="size-4 shrink-0" />}
              {isFood ? t.orderType.FOOD : t.orderType.TAXI}
            </span>
            <OrderStatusBadge status={order.status} />
          </div>
          <p className="font-mono text-xs text-muted-foreground">{order.reference}</p>
          <h3 id={titleId} className="font-mono text-base">{order.summary}</h3>
          <p className="text-sm text-muted-foreground">
            {copy.receivedOn}{" "}<time dateTime={order.createdAt.toISOString()}>{formatDateTime(order.createdAt)}</time>
          </p>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <dl className="flex flex-col gap-2 text-sm">
            {order.origin ? <div><dt className="text-muted-foreground">{isFood ? copy.foodOrigin : copy.origin}</dt><dd>{order.origin}</dd></div> : null}
            {order.destination ? <div><dt className="text-muted-foreground">{isFood ? copy.foodDestination : copy.destination}</dt><dd>{order.destination}</dd></div> : null}
            <div><dt className="text-muted-foreground">{copy.amount}</dt><dd className="font-mono text-lg text-primary">{order.total} {t.citizen.wallet.credits}</dd></div>
          </dl>
          {order.etaMinutes != null && !["COMPLETED", "CANCELLED"].includes(order.status) ? (
            <p className="text-sm text-muted-foreground">{format(copy.recordedEstimate, { minutes: order.etaMinutes })}</p>
          ) : null}
        </CardContent>
        <CardFooter className="mt-auto flex-wrap">
          <Link href={`/citizen/requests/order/${order.id}`} aria-label={format(copy.detailsFor, { reference: order.reference })} className={buttonClasses("secondary", "sm")}>
            {copy.details}
          </Link>
        </CardFooter>
      </Card>
    </article>
  );
}

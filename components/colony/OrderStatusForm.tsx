import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Field";
import { updateOrderStatusAction } from "@/lib/actions/orders";
import { getDictionary } from "@/lib/i18n/server";
import { ORDER_STATUSES } from "@/lib/roles";

/** Inline status control for taxi / restauration orders. */
export async function OrderStatusForm({ orderId, status }: { orderId: string; status: string }) {
  const t = getDictionary();

  return (
    <form action={updateOrderStatusAction} className="flex items-center gap-2">
      <input type="hidden" name="orderId" value={orderId} />
      <Select aria-label={t.ops.forms.status} name="status" defaultValue={status} className="h-8 w-auto text-xs">
        {ORDER_STATUSES.map((value) => (
          <option key={value} value={value}>
            {t.orderStatus[value]}
          </option>
        ))}
      </Select>
      <Button type="submit" variant="secondary" size="sm">
        {t.ops.administration.updateShort}
      </Button>
    </form>
  );
}

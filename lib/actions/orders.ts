"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import type { ActionState } from "@/lib/action-state";
import { getDictionary } from "@/lib/i18n/server";
import { requirePageRole } from "@/lib/permissions";
import { createOrder, updateOrderStatus } from "@/lib/services";
import { ORDER_TYPES, STAFF_ROLES, isOrderStatus } from "@/lib/roles";

const orderSchema = z.object({
  type: z.enum(ORDER_TYPES),
  summary: z.string().trim().min(3, "Décrivez la commande.").max(160),
  origin: z.string().trim().max(120).optional().or(z.literal("")),
  destination: z.string().trim().max(120).optional().or(z.literal("")),
});

function revalidateOrders() {
  for (const path of ["/citizen", "/citizen/orders", "/operations/transport", "/operations/commerce", "/council"]) {
    revalidatePath(path);
  }
}

export async function createOrderAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await requirePageRole(["CITIZEN"]);

  const parsed = orderSchema.safeParse({
    type: formData.get("type"),
    summary: formData.get("summary"),
    origin: formData.get("origin"),
    destination: formData.get("destination"),
  });

  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Données invalides." };
  }

  let reference: string;
  try {
    const order = await createOrder(session.user.id, {
      ...parsed.data,
      total: parsed.data.type === "TAXI" ? 12 : 18,
      etaMinutes: parsed.data.type === "TAXI" ? 8 : 24,
    });
    reference = order.reference;
  } catch {
    return { ok: false, message: getDictionary().errors.orderFailed };
  }

  revalidateOrders();
  return { ok: true, reference };
}

export async function updateOrderStatusAction(formData: FormData) {
  await requirePageRole(STAFF_ROLES);
  const orderId = String(formData.get("orderId") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!orderId || !isOrderStatus(status)) return;

  await updateOrderStatus(orderId, status);
  revalidateOrders();
}

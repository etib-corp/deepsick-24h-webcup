"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import type { ActionState } from "@/lib/action-state";
import { getDictionary } from "@/lib/i18n/server";
import { requirePageRole } from "@/lib/permissions";
import { auditActor, auditNeutralizedInputs, recordSecurityEvent } from "@/lib/security";
import { readId } from "@/lib/sanitize";
import { createOrder, updateOrderStatus } from "@/lib/services";
import { ORDER_TYPES, STAFF_ROLES, isOrderStatus } from "@/lib/roles";
import { plainText, optionalPlainText } from "@/lib/validation";

const orderSchema = z.object({
  type: z.enum(ORDER_TYPES),
  summary: plainText(3, "Décrivez la commande.", 160),
  origin: optionalPlainText(120),
  destination: optionalPlainText(120),
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

  await auditNeutralizedInputs(
    {
      summary: formData.get("summary"),
      origin: formData.get("origin"),
      destination: formData.get("destination"),
    },
    "commande",
    session,
  );

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
  const session = await requirePageRole(STAFF_ROLES);
  const orderId = readId(formData.get("orderId"));
  const status = String(formData.get("status") ?? "");
  if (!orderId || !isOrderStatus(status)) return;

  try {
    await updateOrderStatus(orderId, status);
  } catch {
    return;
  }

  await recordSecurityEvent({
    type: "ORDER_STATUS_CHANGED",
    outcome: "SUCCESS",
    ...auditActor(session),
    targetType: "order",
    targetId: orderId,
    detail: `nouveau statut ${status}`,
  });

  revalidateOrders();
}

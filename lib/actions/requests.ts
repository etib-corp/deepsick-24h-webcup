"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import type { ActionState } from "@/lib/action-state";
import { getDictionary } from "@/lib/i18n/server";
import { getAuthSession } from "@/lib/permissions";
import { auditNeutralizedInputs } from "@/lib/security";
import { createServiceRequest } from "@/lib/services";
import { firstError, requestSchema } from "@/lib/validation";

export async function createRequestAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await getAuthSession();
  if (!session) {
    return { ok: false, message: getDictionary().errors.notConnected };
  }

  const parsed = requestSchema.safeParse({
    subject: formData.get("subject"),
    description: formData.get("description"),
    category: formData.get("category"),
    priority: formData.get("priority"),
  });

  if (!parsed.success) {
    return { ok: false, message: firstError(parsed.error) };
  }

  await auditNeutralizedInputs(
    {
      subject: formData.get("subject"),
      description: formData.get("description"),
      category: formData.get("category"),
    },
    "demande citoyenne",
    session,
  );

  try {
    await createServiceRequest(session.user.id, parsed.data);
  } catch {
    return { ok: false, message: getDictionary().errors.requestFailed };
  }

  revalidatePath("/citizen/requests");
  revalidatePath("/citizen");
  redirect("/citizen/requests?creee=1");
}

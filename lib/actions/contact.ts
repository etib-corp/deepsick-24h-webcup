"use server";

import type { ActionState } from "@/lib/action-state";
import { getDictionary } from "@/lib/i18n/server";
import { getAuthSession } from "@/lib/permissions";
import { auditNeutralizedInputs } from "@/lib/security";
import { createContactMessage } from "@/lib/services";
import { contactSchema, firstError } from "@/lib/validation";

export async function contactAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = contactSchema.safeParse({
    subject: formData.get("subject"),
    email: formData.get("email"),
    body: formData.get("body"),
  });

  if (!parsed.success) {
    return { ok: false, message: firstError(parsed.error) };
  }

  const session = await getAuthSession();

  await auditNeutralizedInputs(
    {
      subject: formData.get("subject"),
      email: formData.get("email"),
      body: formData.get("body"),
    },
    "contact",
    session,
  );

  try {
    const message = await createContactMessage({
      ...parsed.data,
      authorId: session?.user?.id ?? null,
    });
    return {
      ok: true,
      message: getDictionary().publicPages.contact.sent,
      reference: message.reference,
    };
  } catch {
    return { ok: false, message: getDictionary().publicPages.contact.failed };
  }
}

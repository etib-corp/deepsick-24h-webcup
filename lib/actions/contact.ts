"use server";

import type { ActionState } from "@/lib/action-state";
import {
  botGuardMessage,
  consumeFormToken,
  inspectFormSubmission,
  readBotFields,
  releaseFormToken,
} from "@/lib/bot-guard";
import { getDictionary } from "@/lib/i18n/server";
import { getAuthSession } from "@/lib/permissions";
import { auditNeutralizedInputs } from "@/lib/security";
import { createContactMessage } from "@/lib/services";
import { contactSchema, firstError } from "@/lib/validation";

export async function contactAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const t = getDictionary();

  // F81 — invisible bot controls run before any work: blocked attempts are
  // traced and replaying them never succeeds.
  const guard = await inspectFormSubmission({ form: "contact", ...readBotFields(formData) });
  if (!guard.ok) return { ok: false, message: botGuardMessage(guard, t) };

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

  if (!(await consumeFormToken(guard.nonce, "contact", guard.ip))) {
    return { ok: false, message: t.errors.botBlocked };
  }

  try {
    const message = await createContactMessage({
      ...parsed.data,
      authorId: session?.user?.id ?? null,
    });
    return {
      ok: true,
      message: t.publicPages.contact.sent,
      reference: message.reference,
    };
  } catch {
    // The write itself failed — free the challenge so the visitor can retry as-is.
    await releaseFormToken(guard.nonce);
    return { ok: false, message: t.publicPages.contact.failed };
  }
}

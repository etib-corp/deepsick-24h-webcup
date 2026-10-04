"use server";

import { revalidatePath } from "next/cache";

import type { ActionState } from "@/lib/action-state";
import { getDictionary } from "@/lib/i18n/server";
import { requirePageRole } from "@/lib/permissions";
import { auditNeutralizedInputs } from "@/lib/security";
import { readId } from "@/lib/sanitize";
import { upsertServiceFeedback } from "@/lib/services";
import { feedbackSchema, firstError } from "@/lib/validation";

/** F76 — a citizen comments on a municipal service (one editable comment). */

export async function submitFeedbackAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await requirePageRole(["CITIZEN"]);

  const parsed = feedbackSchema.safeParse({ comment: formData.get("comment") });
  if (!parsed.success) return { ok: false, message: firstError(parsed.error) };

  const serviceId = readId(formData.get("serviceId"));

  await auditNeutralizedInputs(
    { comment: formData.get("comment") },
    "commentaire de service",
    session,
  );

  try {
    await upsertServiceFeedback({
      serviceId,
      authorId: session.user.id,
      comment: parsed.data.comment,
    });
  } catch {
    return { ok: false, message: getDictionary().errors.feedbackFailed };
  }

  const t = getDictionary();
  // Re-render the public service page with the new comment.
  revalidatePath(`/services`);
  return { ok: true, message: t.publicPages.services.feedback.saved };
}

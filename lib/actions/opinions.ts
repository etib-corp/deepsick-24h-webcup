"use server";

import { revalidatePath } from "next/cache";

import type { ActionState } from "@/lib/action-state";
import { getConsultationById } from "@/lib/data";
import { getDictionary } from "@/lib/i18n/server";
import { requirePageRole } from "@/lib/permissions";
import { upsertOpinion } from "@/lib/services";
import { firstError, opinionSchema } from "@/lib/validation";

/**
 * Records a citizen's non-binding opinion on a consultation. One opinion per
 * citizen and consultation (editable). Closed projects no longer accept input.
 */
export async function submitOpinionAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await requirePageRole(["CITIZEN"]);

  const parsed = opinionSchema.safeParse({
    consultationId: formData.get("consultationId"),
    stance: formData.get("stance"),
    comment: formData.get("comment"),
  });
  if (!parsed.success) return { ok: false, message: firstError(parsed.error) };

  const consultation = await getConsultationById(parsed.data.consultationId);
  if (!consultation || !consultation.published) {
    return { ok: false, message: getDictionary().errors.opinionFailed };
  }
  if (consultation.status !== "OPEN") {
    return { ok: false, message: getDictionary().errors.consultationClosed };
  }

  let reference: string;
  try {
    const opinion = await upsertOpinion({
      consultationId: consultation.id,
      authorId: session.user.id,
      stance: parsed.data.stance,
      comment: parsed.data.comment,
    });
    reference = opinion.reference;
  } catch {
    return { ok: false, message: getDictionary().errors.opinionFailed };
  }

  revalidatePath(`/citizen/consultations/${consultation.slug}`);
  revalidatePath("/citizen/consultations");
  revalidatePath("/citizen/contributions");
  revalidatePath("/council/consultations");

  return { ok: true, reference };
}

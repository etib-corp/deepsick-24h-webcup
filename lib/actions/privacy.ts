"use server";

import { revalidatePath } from "next/cache";

import type { ActionState } from "@/lib/action-state";
import { getDictionary } from "@/lib/i18n/server";
import { requirePageRole } from "@/lib/permissions";
import { isConcernStatus } from "@/lib/roles";
import { auditActor, auditNeutralizedInputs, recordSecurityEvent } from "@/lib/security";
import { readId } from "@/lib/sanitize";
import { createDataConcern, reviewDataConcern } from "@/lib/services";
import { concernSchema, firstError } from "@/lib/validation";

/**
 * F51 — residents can raise a concern about how their data is used; the
 * Council handles it and the resident follows the trace (`RECEIVED` →
 * `REVIEWED` → `ANSWERED` with a written response) from their personal space.
 */

export async function submitDataConcernAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const t = getDictionary();
  const session = await requirePageRole(["CITIZEN"]);

  const parsed = concernSchema.safeParse({
    subject: formData.get("subject"),
    body: formData.get("body"),
  });
  if (!parsed.success) return { ok: false, message: firstError(parsed.error) };

  await auditNeutralizedInputs(
    { subject: formData.get("subject"), body: formData.get("body") },
    "inquiétude données",
    session,
  );

  try {
    const concern = await createDataConcern(session.user.id, parsed.data);
    revalidatePath("/citizen/donnees");
    revalidatePath("/council/donnees");
    return { ok: true, reference: concern.reference };
  } catch {
    return { ok: false, message: t.privacy.failed };
  }
}

/** Council: move a concern to "being examined". */
export async function reviewDataConcernAction(formData: FormData) {
  const session = await requirePageRole(["COUNCIL"]);
  const id = readId(formData.get("id"));
  const status = String(formData.get("status") ?? "REVIEWED");
  if (!isConcernStatus(status)) return;

  try {
    await reviewDataConcern(id, { status }, session.user.id);
  } catch {
    return;
  }

  await recordSecurityEvent({
    type: "CONTENT_CHANGED",
    outcome: "SUCCESS",
    ...auditActor(session),
    targetType: "data-concern",
    targetId: id,
    detail: `revue → ${status}`,
  });

  revalidatePath("/citizen/donnees");
  revalidatePath("/council/donnees");
}

/** Council: answer a concern — the response is shown to its author. */
export async function answerDataConcernAction(formData: FormData) {
  const session = await requirePageRole(["COUNCIL"]);
  const id = readId(formData.get("id"));
  const response = formData.get("response");

  try {
    await reviewDataConcern(
      id,
      { status: "ANSWERED", response: typeof response === "string" ? response : null },
      session.user.id,
    );
  } catch {
    return;
  }

  await recordSecurityEvent({
    type: "CONTENT_CHANGED",
    outcome: "SUCCESS",
    ...auditActor(session),
    targetType: "data-concern",
    targetId: id,
    detail: "réponse apportée",
  });

  revalidatePath("/citizen/donnees");
  revalidatePath("/council/donnees");
}

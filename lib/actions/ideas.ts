"use server";

import { revalidatePath } from "next/cache";

import type { ActionState } from "@/lib/action-state";
import { getDictionary } from "@/lib/i18n/server";
import { requirePageRole } from "@/lib/permissions";
import { isIdeaStatus } from "@/lib/roles";
import { auditActor, auditNeutralizedInputs, recordSecurityEvent } from "@/lib/security";
import { readId } from "@/lib/sanitize";
import { createIdea, reviewIdea } from "@/lib/services";
import { firstError, ideaSchema } from "@/lib/validation";

/** F68 — residents propose improvement ideas; the Council reviews them. */

export async function submitIdeaAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await requirePageRole(["CITIZEN"]);

  const parsed = ideaSchema.safeParse({
    title: formData.get("title"),
    body: formData.get("body"),
  });
  if (!parsed.success) return { ok: false, message: firstError(parsed.error) };

  await auditNeutralizedInputs(
    { title: formData.get("title"), body: formData.get("body") },
    "idée citoyenne",
    session,
  );

  try {
    const idea = await createIdea(session.user.id, parsed.data);
    revalidatePath("/citizen/ideas");
    revalidatePath("/council/ideas");
    return { ok: true, reference: idea.reference };
  } catch {
    return { ok: false, message: getDictionary().errors.ideaFailed };
  }
}

export async function reviewIdeaAction(formData: FormData) {
  const session = await requirePageRole(["COUNCIL"]);
  const id = readId(formData.get("id"));
  const status = String(formData.get("status"));
  const response = formData.get("response");

  if (!isIdeaStatus(status)) return;
  try {
    await reviewIdea(
      id,
      { status, response: typeof response === "string" ? response : null },
      session.user.id,
    );
  } catch {
    return;
  }

  await recordSecurityEvent({
    type: "CONTENT_CHANGED",
    outcome: "SUCCESS",
    ...auditActor(session),
    targetType: "idea",
    targetId: id,
    detail: `revue → ${status}`,
  });

  revalidatePath("/citizen/ideas");
  revalidatePath("/council/ideas");
}

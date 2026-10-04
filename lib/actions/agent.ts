"use server";

import { revalidatePath } from "next/cache";

import { requirePageRole } from "@/lib/permissions";
import { auditActor, recordSecurityEvent } from "@/lib/security";
import { readId, readText } from "@/lib/sanitize";
import { assignRequest, updateRequestStatus } from "@/lib/services";
import { isRequestStatus } from "@/lib/roles";

/** Démarches administratives: move a citizen request forward and log a note. */
export async function updateRequestStatusAction(formData: FormData) {
  const session = await requirePageRole(["ADMIN_AGENT", "COUNCIL"]);

  const requestId = readId(formData.get("requestId"));
  const status = String(formData.get("status") ?? "");
  const note = readText(formData.get("note"), 1000);

  if (!requestId || !isRequestStatus(status)) return;

  try {
    await updateRequestStatus(requestId, status, session.user.id, note);
  } catch {
    return;
  }

  await recordSecurityEvent({
    type: "REQUEST_STATUS_CHANGED",
    outcome: "SUCCESS",
    ...auditActor(session),
    targetType: "service-request",
    targetId: requestId,
    detail: `nouveau statut ${status}`,
  });

  revalidatePath("/operations/administration");
  revalidatePath(`/operations/administration/${requestId}`);
  revalidatePath("/citizen");
  revalidatePath("/citizen/reports");
}

export async function assignToMeAction(formData: FormData) {
  const session = await requirePageRole(["ADMIN_AGENT", "COUNCIL"]);
  const requestId = readId(formData.get("requestId"));
  if (!requestId) return;

  try {
    await assignRequest(requestId, session.user.id);
  } catch {
    return;
  }

  await recordSecurityEvent({
    type: "RECORD_ASSIGNED",
    outcome: "SUCCESS",
    ...auditActor(session),
    targetType: "service-request",
    targetId: requestId,
    detail: "auto-assignation",
  });

  revalidatePath("/operations/administration");
  revalidatePath(`/operations/administration/${requestId}`);
}

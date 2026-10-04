"use server";

import { revalidatePath } from "next/cache";

import { requirePageRole } from "@/lib/permissions";
import { readId } from "@/lib/sanitize";
import { auditActor, recordSecurityEvent } from "@/lib/security";
import { reviewSecurityAlert } from "@/lib/sentinel";

const REVIEWABLE = ["REVIEWED", "RESOLVED"] as const;

/**
 * F85 — marks a security alert as reviewed or resolved. Restricted to the
 * authorised profiles (High Council + security station) and recorded in the
 * audit trail.
 */
export async function reviewAlertAction(formData: FormData) {
  const session = await requirePageRole(["SECURITY", "COUNCIL"]);
  const id = readId(formData.get("id"));
  const status = String(formData.get("status") ?? "");

  if (!id || !(REVIEWABLE as readonly string[]).includes(status)) return;
  const next = status as (typeof REVIEWABLE)[number];

  try {
    await reviewSecurityAlert(id, next, session.user.id);
  } catch {
    return;
  }

  await recordSecurityEvent({
    type: "ALERT_REVIEWED",
    outcome: "SUCCESS",
    ...auditActor(session),
    targetType: "security_alert",
    targetId: id,
    detail: next === "RESOLVED" ? "alerte résolue" : "alerte examinée",
  });

  revalidatePath("/council/security");
  revalidatePath("/operations/security");
}

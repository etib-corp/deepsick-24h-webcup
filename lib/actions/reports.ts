"use server";

import { revalidatePath } from "next/cache";

import type { ActionState } from "@/lib/action-state";
import { getDictionary } from "@/lib/i18n/server";
import { requirePageRole } from "@/lib/permissions";
import { auditActor, auditNeutralizedInputs, recordSecurityEvent } from "@/lib/security";
import { readId, readText } from "@/lib/sanitize";
import {
  assignReport,
  createReport,
  filePoliceCase,
  updateReportStatus,
} from "@/lib/services";
import { STAFF_ROLES, isReportStatus } from "@/lib/roles";
import { firstError, policeCaseSchema, reportSchema } from "@/lib/validation";

function revalidateIncidents(reportId?: string) {
  for (const path of [
    "/citizen",
    "/citizen/reports",
    "/operations/security",
    "/operations/medical",
    "/operations/maintenance",
    "/council",
  ]) {
    revalidatePath(path);
  }
  if (reportId) {
    revalidatePath(`/citizen/reports/${reportId}`);
    revalidatePath(`/operations/security/${reportId}`);
    revalidatePath(`/operations/medical/${reportId}`);
    revalidatePath(`/operations/maintenance/${reportId}`);
  }
}

export async function createReportAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await requirePageRole(["CITIZEN"]);

  const parsed = reportSchema.safeParse({
    type: formData.get("type"),
    title: formData.get("title"),
    description: formData.get("description"),
    priority: formData.get("priority"),
    sector: formData.get("sector"),
  });

  if (!parsed.success) {
    return { ok: false, message: firstError(parsed.error) };
  }

  await auditNeutralizedInputs(
    {
      title: formData.get("title"),
      description: formData.get("description"),
      sector: formData.get("sector"),
    },
    "signalement",
    session,
  );

  let reference: string;
  try {
    const report = await createReport(session.user.id, parsed.data);
    reference = report.reference;
  } catch {
    return { ok: false, message: getDictionary().errors.reportFailed };
  }

  revalidateIncidents();
  return { ok: true, reference };
}

export async function updateReportStatusAction(formData: FormData) {
  const session = await requirePageRole(STAFF_ROLES);

  const reportId = readId(formData.get("reportId"));
  const status = String(formData.get("status") ?? "");
  const note = readText(formData.get("note"), 1000);

  if (!reportId || !isReportStatus(status)) return;

  try {
    await updateReportStatus(reportId, status, session.user.id, note);
  } catch {
    // Unknown or stale record — nothing to disclose, nothing to change.
    return;
  }

  await recordSecurityEvent({
    type: "REPORT_STATUS_CHANGED",
    outcome: "SUCCESS",
    ...auditActor(session),
    targetType: "report",
    targetId: reportId,
    detail: `nouveau statut ${status}`,
  });

  revalidateIncidents(reportId);
}

export async function assignReportAction(formData: FormData) {
  const session = await requirePageRole(STAFF_ROLES);
  const reportId = readId(formData.get("reportId"));
  if (!reportId) return;

  try {
    await assignReport(reportId, session.user.id);
  } catch {
    return;
  }

  await recordSecurityEvent({
    type: "RECORD_ASSIGNED",
    outcome: "SUCCESS",
    ...auditActor(session),
    targetType: "report",
    targetId: reportId,
    detail: "prise en charge",
  });

  revalidateIncidents(reportId);
}

export async function filePoliceCaseAction(formData: FormData) {
  const session = await requirePageRole(["SECURITY", "COUNCIL"]);
  const reportId = readId(formData.get("reportId"));
  if (!reportId) return;

  const parsed = policeCaseSchema.safeParse({
    suspectName: formData.get("suspectName"),
    arrestNotes: formData.get("arrestNotes"),
    fineAmount: formData.get("fineAmount"),
    pvContent: formData.get("pvContent"),
  });
  if (!parsed.success) return;

  await auditNeutralizedInputs(
    {
      suspectName: formData.get("suspectName"),
      arrestNotes: formData.get("arrestNotes"),
      pvContent: formData.get("pvContent"),
    },
    "dossier de sécurité",
    session,
    { targetType: "report", targetId: reportId },
  );

  try {
    await filePoliceCase(reportId, session.user.id, parsed.data);
  } catch {
    return;
  }

  await recordSecurityEvent({
    type: "CASE_FILED",
    outcome: "SUCCESS",
    ...auditActor(session),
    targetType: "report",
    targetId: reportId,
    detail: "dossier de sécurité enregistré",
  });

  revalidateIncidents(reportId);
}

"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import type { ActionState } from "@/lib/action-state";
import { getDictionary } from "@/lib/i18n/server";
import { requirePageRole } from "@/lib/permissions";
import {
  assignReport,
  createReport,
  filePoliceCase,
  updateReportStatus,
} from "@/lib/services";
import { REPORT_PRIORITIES, REPORT_TYPES, STAFF_ROLES, isReportStatus } from "@/lib/roles";

const reportSchema = z.object({
  type: z.enum(REPORT_TYPES),
  title: z.string().trim().min(3, "Indiquez un objet.").max(120),
  description: z.string().trim().min(10, "Décrivez la situation (10 caractères min.).").max(4000),
  priority: z.enum(REPORT_PRIORITIES),
  sector: z.string().trim().max(80).optional().or(z.literal("")),
});

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
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Données invalides." };
  }

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

  const reportId = String(formData.get("reportId") ?? "");
  const status = String(formData.get("status") ?? "");
  const note = formData.get("note") ? String(formData.get("note")) : undefined;

  if (!reportId || !isReportStatus(status)) return;

  await updateReportStatus(reportId, status, session.user.id, note);
  revalidateIncidents(reportId);
}

export async function assignReportAction(formData: FormData) {
  const session = await requirePageRole(STAFF_ROLES);
  const reportId = String(formData.get("reportId") ?? "");
  if (!reportId) return;

  await assignReport(reportId, session.user.id);
  revalidateIncidents(reportId);
}

export async function filePoliceCaseAction(formData: FormData) {
  const session = await requirePageRole(["SECURITY", "COUNCIL"]);
  const reportId = String(formData.get("reportId") ?? "");
  if (!reportId) return;

  const fine = formData.get("fineAmount") ? Number(formData.get("fineAmount")) : null;

  await filePoliceCase(reportId, session.user.id, {
    suspectName: formData.get("suspectName") ? String(formData.get("suspectName")) : null,
    arrestNotes: formData.get("arrestNotes") ? String(formData.get("arrestNotes")) : null,
    fineAmount: Number.isFinite(fine) ? fine : null,
    pvContent: formData.get("pvContent") ? String(formData.get("pvContent")) : null,
  });

  revalidateIncidents(reportId);
}

"use server";

import { revalidatePath } from "next/cache";

import type { AdminActionState } from "@/lib/action-state";
import { getDictionary } from "@/lib/i18n/server";
import { requirePageRole } from "@/lib/permissions";
import { isProjectStatus } from "@/lib/roles";
import { auditActor, auditNeutralizedInputs, recordSecurityEvent } from "@/lib/security";
import { readId } from "@/lib/sanitize";
import {
  createProject,
  deleteProject,
  setProjectPublished,
  setProjectStatus,
} from "@/lib/services";
import { firstError, projectSchema } from "@/lib/validation";

/** F67 — Council management of the public project directory. */

export async function createProjectAction(
  _previous: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const session = await requirePageRole(["COUNCIL"]);

  const parsed = projectSchema.safeParse({
    title: formData.get("title"),
    summary: formData.get("summary"),
    description: formData.get("description"),
    sector: formData.get("sector"),
    status: formData.get("status"),
    progress: formData.get("progress"),
  });
  if (!parsed.success) return { ok: false, message: firstError(parsed.error) };

  await auditNeutralizedInputs(
    {
      title: formData.get("title"),
      summary: formData.get("summary"),
      description: formData.get("description"),
    },
    "projet municipal",
    session,
  );

  let projectId: string;
  try {
    const project = await createProject(parsed.data);
    projectId = project.id;
  } catch {
    return { ok: false, message: getDictionary().errors.projectFailed };
  }

  await recordSecurityEvent({
    type: "CONTENT_CHANGED",
    outcome: "SUCCESS",
    ...auditActor(session),
    targetType: "project",
    targetId: projectId,
    detail: "création",
  });

  revalidatePath("/council/projects");
  revalidatePath("/projects");
  return { ok: true, message: getDictionary().council.projects.form.created };
}

export async function toggleProjectAction(formData: FormData) {
  const session = await requirePageRole(["COUNCIL"]);
  const id = readId(formData.get("id"));
  const published = formData.get("published") === "true";

  await setProjectPublished(id, published);
  await recordSecurityEvent({
    type: "CONTENT_CHANGED",
    outcome: "SUCCESS",
    ...auditActor(session),
    targetType: "project",
    targetId: id,
    detail: published ? "publication" : "dépublication",
  });

  revalidatePath("/council/projects");
  revalidatePath("/projects");
}

export async function setProjectStatusAction(formData: FormData) {
  const session = await requirePageRole(["COUNCIL"]);
  const id = readId(formData.get("id"));
  const status = String(formData.get("status"));

  if (!isProjectStatus(status)) return;
  try {
    await setProjectStatus(id, status);
  } catch {
    return;
  }

  await recordSecurityEvent({
    type: "CONTENT_CHANGED",
    outcome: "SUCCESS",
    ...auditActor(session),
    targetType: "project",
    targetId: id,
    detail: `statut → ${status}`,
  });

  revalidatePath("/council/projects");
  revalidatePath("/projects");
}

export async function deleteProjectAction(formData: FormData) {
  const session = await requirePageRole(["COUNCIL"]);
  const id = readId(formData.get("id"));

  await deleteProject(id);
  await recordSecurityEvent({
    type: "CONTENT_CHANGED",
    outcome: "SUCCESS",
    ...auditActor(session),
    targetType: "project",
    targetId: id,
    detail: "suppression",
  });

  revalidatePath("/council/projects");
  revalidatePath("/projects");
}

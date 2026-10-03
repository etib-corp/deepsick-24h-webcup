"use server";

import { revalidatePath } from "next/cache";

import type { AdminActionState } from "@/lib/action-state";
import { getDictionary } from "@/lib/i18n/server";
import { requirePageRole } from "@/lib/permissions";
import {
  createAnnouncement,
  createMunicipalService,
  deleteMunicipalService,
  setAnnouncementPublished,
  setUserRole,
} from "@/lib/services";
import { isRole } from "@/lib/roles";
import { announcementSchema, firstError, serviceSchema } from "@/lib/validation";

export async function createServiceAction(
  _previous: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  await requirePageRole(["COUNCIL"]);

  const parsed = serviceSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
    category: formData.get("category"),
    icon: formData.get("icon"),
    mapX: formData.get("mapX"),
    mapY: formData.get("mapY"),
    sector: formData.get("sector"),
  });
  if (!parsed.success) return { ok: false, message: firstError(parsed.error) };

  try {
    await createMunicipalService(parsed.data);
  } catch {
    return { ok: false, message: getDictionary().errors.serviceFailed };
  }

  revalidatePath("/council/services");
  revalidatePath("/services");
  return { ok: true, message: getDictionary().council.services.form.created };
}

export async function deleteServiceAction(formData: FormData) {
  await requirePageRole(["COUNCIL"]);
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await deleteMunicipalService(id);
  revalidatePath("/council/services");
  revalidatePath("/services");
}

export async function createAnnouncementAction(
  _previous: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const session = await requirePageRole(["COUNCIL"]);

  const parsed = announcementSchema.safeParse({
    title: formData.get("title"),
    excerpt: formData.get("excerpt"),
    body: formData.get("body"),
    published: formData.get("published") === "on" || formData.get("published") === "true",
  });
  if (!parsed.success) return { ok: false, message: firstError(parsed.error) };

  try {
    await createAnnouncement({ ...parsed.data, authorId: session.user.id });
  } catch {
    return { ok: false, message: getDictionary().errors.announcementFailed };
  }

  revalidatePath("/council/announcements");
  revalidatePath("/announcements");
  return { ok: true, message: getDictionary().council.announcements.form.created };
}

export async function toggleAnnouncementAction(formData: FormData) {
  await requirePageRole(["COUNCIL"]);
  const id = String(formData.get("id") ?? "");
  const published = formData.get("published") === "true";
  if (!id) return;
  await setAnnouncementPublished(id, published);
  revalidatePath("/council/announcements");
  revalidatePath("/announcements");
}

export async function setUserRoleAction(formData: FormData) {
  const session = await requirePageRole(["COUNCIL"]);
  const userId = String(formData.get("userId") ?? "");
  const role = String(formData.get("role") ?? "");

  if (!userId || !isRole(role) || userId === session.user.id) return;

  await setUserRole(userId, role);
  revalidatePath("/council/users");
}

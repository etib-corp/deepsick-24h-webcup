"use server";

import { revalidatePath } from "next/cache";

import type { AdminActionState } from "@/lib/action-state";
import { getDictionary } from "@/lib/i18n/server";
import { requirePageRole } from "@/lib/permissions";
import {
  createAnnouncement,
  createBroadcast,
  createConsultation,
  createMunicipalService,
  deleteBroadcast,
  deleteConsultation,
  deleteMunicipalService,
  setAnnouncementPublished,
  setBroadcastActive,
  setConsultationPublished,
  setConsultationStatus,
  setServiceFeatured,
  setUserRole,
} from "@/lib/services";
import { isConsultationStatus, isRole } from "@/lib/roles";
import {
  announcementSchema,
  broadcastSchema,
  consultationSchema,
  firstError,
  serviceSchema,
} from "@/lib/validation";

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
    featured: formData.get("featured"),
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

export async function toggleServiceFeaturedAction(formData: FormData) {
  await requirePageRole(["COUNCIL"]);
  const id = String(formData.get("id") ?? "");
  const featured = formData.get("featured") === "true";
  if (!id) return;
  await setServiceFeatured(id, featured);
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

export async function createBroadcastAction(
  _previous: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const session = await requirePageRole(["COUNCIL"]);

  const parsed = broadcastSchema.safeParse({
    title: formData.get("title"),
    message: formData.get("message"),
    actionLabel: formData.get("actionLabel"),
    actionHref: formData.get("actionHref"),
    startsAt: formData.get("startsAt"),
    endsAt: formData.get("endsAt"),
    active: formData.get("active") === "on" || formData.get("active") === "true",
  });
  if (!parsed.success) return { ok: false, message: firstError(parsed.error) };

  try {
    await createBroadcast({ ...parsed.data, authorId: session.user.id });
  } catch {
    return { ok: false, message: getDictionary().errors.broadcastFailed };
  }

  revalidatePath("/council/broadcasts");
  revalidatePath("/", "layout");
  return { ok: true, message: getDictionary().council.broadcasts.form.created };
}

export async function toggleBroadcastAction(formData: FormData) {
  await requirePageRole(["COUNCIL"]);
  const id = String(formData.get("id") ?? "");
  const active = formData.get("active") === "true";
  if (!id) return;
  await setBroadcastActive(id, active);
  revalidatePath("/council/broadcasts");
  revalidatePath("/", "layout");
}

export async function deleteBroadcastAction(formData: FormData) {
  await requirePageRole(["COUNCIL"]);
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await deleteBroadcast(id);
  revalidatePath("/council/broadcasts");
  revalidatePath("/", "layout");
}

export async function createConsultationAction(
  _previous: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const session = await requirePageRole(["COUNCIL"]);

  const parsed = consultationSchema.safeParse({
    title: formData.get("title"),
    summary: formData.get("summary"),
    description: formData.get("description"),
    published: formData.get("published") === "on" || formData.get("published") === "true",
    opensAt: formData.get("opensAt"),
    closesAt: formData.get("closesAt"),
  });
  if (!parsed.success) return { ok: false, message: firstError(parsed.error) };

  try {
    await createConsultation({ ...parsed.data, authorId: session.user.id });
  } catch {
    return { ok: false, message: getDictionary().errors.consultationFailed };
  }

  revalidatePath("/council/consultations");
  revalidatePath("/citizen/consultations");
  return { ok: true, message: getDictionary().council.consultations.form.created };
}

export async function toggleConsultationAction(formData: FormData) {
  await requirePageRole(["COUNCIL"]);
  const id = String(formData.get("id") ?? "");
  const published = formData.get("published") === "true";
  if (!id) return;
  await setConsultationPublished(id, published);
  revalidatePath("/council/consultations");
  revalidatePath("/citizen/consultations");
}

export async function setConsultationStatusAction(formData: FormData) {
  await requirePageRole(["COUNCIL"]);
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!id || !isConsultationStatus(status)) return;
  await setConsultationStatus(id, status);
  revalidatePath("/council/consultations");
  revalidatePath(`/council/consultations/${id}`);
  revalidatePath("/citizen/consultations");
}

export async function deleteConsultationAction(formData: FormData) {
  await requirePageRole(["COUNCIL"]);
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await deleteConsultation(id);
  revalidatePath("/council/consultations");
  revalidatePath("/citizen/consultations");
}

export async function setUserRoleAction(formData: FormData) {
  const session = await requirePageRole(["COUNCIL"]);
  const userId = String(formData.get("userId") ?? "");
  const role = String(formData.get("role") ?? "");

  if (!userId || !isRole(role) || userId === session.user.id) return;

  await setUserRole(userId, role);
  revalidatePath("/council/users");
}

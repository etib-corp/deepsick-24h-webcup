"use server";

import { revalidatePath, revalidateTag } from "next/cache";

import type { AdminActionState } from "@/lib/action-state";
import { getConsultationById } from "@/lib/data";
import { getDictionary } from "@/lib/i18n/server";
import { requirePageRole } from "@/lib/permissions";
import { auditActor, auditNeutralizedInputs, recordSecurityEvent } from "@/lib/security";
import { readId } from "@/lib/sanitize";
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
  setConsultationOutcome,
  setConsultationPublished,
  setConsultationStatus,
  setServiceFeatured,
  setServicePublished,
  setUserRole,
} from "@/lib/services";
import { isConsultationStatus, isRole } from "@/lib/roles";
import {
  announcementSchema,
  broadcastSchema,
  consultationOutcomeSchema,
  consultationSchema,
  firstError,
  serviceSchema,
} from "@/lib/validation";

export async function createServiceAction(
  _previous: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const session = await requirePageRole(["COUNCIL"]);

  const parsed = serviceSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
    category: formData.get("category"),
    icon: formData.get("icon"),
    mapX: formData.get("mapX"),
    mapY: formData.get("mapY"),
    sector: formData.get("sector"),
    featured: formData.get("featured"),
    openingHours: formData.get("openingHours"),
    address: formData.get("address"),
    plainLanguage: formData.get("plainLanguage"),
  });
  if (!parsed.success) return { ok: false, message: firstError(parsed.error) };

  await auditNeutralizedInputs(
    {
      name: formData.get("name"),
      description: formData.get("description"),
      sector: formData.get("sector"),
    },
    "service municipal",
    session,
  );

  let serviceId: string;
  try {
    const service = await createMunicipalService(parsed.data);
    serviceId = service.id;
  } catch {
    return { ok: false, message: getDictionary().errors.serviceFailed };
  }

  await recordSecurityEvent({
    type: "CONTENT_CHANGED",
    outcome: "SUCCESS",
    ...auditActor(session),
    targetType: "service",
    targetId: serviceId,
    detail: "création",
  });

  revalidatePath("/council/services");
  revalidateTag("public-services");
  revalidatePath("/services");
  return { ok: true, message: getDictionary().council.services.form.created };
}

export async function deleteServiceAction(formData: FormData) {
  const session = await requirePageRole(["COUNCIL"]);
  const id = readId(formData.get("id"));
  if (!id) return;

  try {
    await deleteMunicipalService(id);
  } catch {
    return;
  }

  await recordSecurityEvent({
    type: "CONTENT_CHANGED",
    outcome: "SUCCESS",
    ...auditActor(session),
    targetType: "service",
    targetId: id,
    detail: "suppression",
  });

  revalidatePath("/council/services");
  revalidateTag("public-services");
  revalidatePath("/services");
}

export async function toggleServiceFeaturedAction(formData: FormData) {
  const session = await requirePageRole(["COUNCIL"]);
  const id = readId(formData.get("id"));
  const featured = formData.get("featured") === "true";
  if (!id) return;

  try {
    await setServiceFeatured(id, featured);
  } catch {
    return;
  }

  await recordSecurityEvent({
    type: "CONTENT_CHANGED",
    outcome: "SUCCESS",
    ...auditActor(session),
    targetType: "service",
    targetId: id,
    detail: featured ? "mise en avant" : "retrait de la mise en avant",
  });

  revalidatePath("/council/services");
  revalidateTag("public-services");
  revalidatePath("/services");
}

export async function toggleServicePublishedAction(formData: FormData) {
  const session = await requirePageRole(["COUNCIL"]);
  const id = readId(formData.get("id"));
  const published = formData.get("published") === "true";
  if (!id) return;

  try {
    await setServicePublished(id, published);
  } catch {
    return;
  }

  await recordSecurityEvent({
    type: "CONTENT_CHANGED",
    outcome: "SUCCESS",
    ...auditActor(session),
    targetType: "service",
    targetId: id,
    detail: published ? "service réactivé" : "service désactivé",
  });

  revalidatePath("/council/services");
  revalidatePath("/services");
  revalidatePath("/citizen/appointments/nouveau");
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
    plainLanguage: formData.get("plainLanguage"),
    published: formData.get("published") === "on" || formData.get("published") === "true",
  });
  if (!parsed.success) return { ok: false, message: firstError(parsed.error) };

  await auditNeutralizedInputs(
    {
      title: formData.get("title"),
      excerpt: formData.get("excerpt"),
      body: formData.get("body"),
    },
    "annonce",
    session,
  );

  let announcementId: string;
  try {
    const announcement = await createAnnouncement({ ...parsed.data, authorId: session.user.id });
    announcementId = announcement.id;
  } catch {
    return { ok: false, message: getDictionary().errors.announcementFailed };
  }

  await recordSecurityEvent({
    type: "CONTENT_CHANGED",
    outcome: "SUCCESS",
    ...auditActor(session),
    targetType: "announcement",
    targetId: announcementId,
    detail: parsed.data.published ? "création publiée" : "création brouillon",
  });

  revalidatePath("/council/announcements");
  revalidateTag("public-announcements");
  revalidatePath("/announcements");
  return { ok: true, message: getDictionary().council.announcements.form.created };
}

export async function toggleAnnouncementAction(formData: FormData) {
  const session = await requirePageRole(["COUNCIL"]);
  const id = readId(formData.get("id"));
  const published = formData.get("published") === "true";
  if (!id) return;

  try {
    await setAnnouncementPublished(id, published);
  } catch {
    return;
  }

  await recordSecurityEvent({
    type: "CONTENT_CHANGED",
    outcome: "SUCCESS",
    ...auditActor(session),
    targetType: "announcement",
    targetId: id,
    detail: published ? "publication" : "dépublication",
  });

  revalidatePath("/council/announcements");
  revalidateTag("public-announcements");
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

  await auditNeutralizedInputs(
    {
      title: formData.get("title"),
      message: formData.get("message"),
      actionLabel: formData.get("actionLabel"),
      actionHref: formData.get("actionHref"),
    },
    "message général",
    session,
  );

  let broadcastId: string;
  try {
    const broadcast = await createBroadcast({ ...parsed.data, authorId: session.user.id });
    broadcastId = broadcast.id;
  } catch {
    return { ok: false, message: getDictionary().errors.broadcastFailed };
  }

  await recordSecurityEvent({
    type: "CONTENT_CHANGED",
    outcome: "SUCCESS",
    ...auditActor(session),
    targetType: "broadcast",
    targetId: broadcastId,
    detail: "diffusion",
  });

  revalidatePath("/council/broadcasts");
  revalidatePath("/", "layout");
  return { ok: true, message: getDictionary().council.broadcasts.form.created };
}

export async function toggleBroadcastAction(formData: FormData) {
  const session = await requirePageRole(["COUNCIL"]);
  const id = readId(formData.get("id"));
  const active = formData.get("active") === "true";
  if (!id) return;

  try {
    await setBroadcastActive(id, active);
  } catch {
    return;
  }

  await recordSecurityEvent({
    type: "CONTENT_CHANGED",
    outcome: "SUCCESS",
    ...auditActor(session),
    targetType: "broadcast",
    targetId: id,
    detail: active ? "activation" : "désactivation",
  });

  revalidatePath("/council/broadcasts");
  revalidatePath("/", "layout");
}

export async function deleteBroadcastAction(formData: FormData) {
  const session = await requirePageRole(["COUNCIL"]);
  const id = readId(formData.get("id"));
  if (!id) return;

  try {
    await deleteBroadcast(id);
  } catch {
    return;
  }

  await recordSecurityEvent({
    type: "CONTENT_CHANGED",
    outcome: "SUCCESS",
    ...auditActor(session),
    targetType: "broadcast",
    targetId: id,
    detail: "suppression",
  });

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
    anonymous: formData.get("anonymous") === "on" || formData.get("anonymous") === "true",
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
  const consultation = await setConsultationStatus(id, status);
  revalidatePath("/council/consultations");
  revalidatePath(`/council/consultations/${id}`);
  revalidatePath("/citizen/consultations");
  revalidatePath(`/citizen/consultations/${consultation.slug}`);
}

/** Saves the Council's public outcome; citizens read it on the closed consultation. */
export async function setConsultationOutcomeAction(
  _previous: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  await requirePageRole(["COUNCIL"]);

  const parsed = consultationOutcomeSchema.safeParse({
    id: formData.get("id"),
    outcome: formData.get("outcome"),
  });
  if (!parsed.success) return { ok: false, message: firstError(parsed.error) };

  let slug: string;
  try {
    const consultation = await getConsultationById(parsed.data.id);
    if (!consultation) return { ok: false, message: getDictionary().errors.consultationFailed };
    slug = consultation.slug;
    await setConsultationOutcome(parsed.data.id, parsed.data.outcome || null);
  } catch {
    return { ok: false, message: getDictionary().errors.consultationOutcomeFailed };
  }

  revalidatePath("/council/consultations");
  revalidatePath(`/council/consultations/${parsed.data.id}`);
  revalidatePath("/citizen/consultations");
  revalidatePath(`/citizen/consultations/${slug}`);
  return { ok: true, message: getDictionary().council.consultations.outcome.saved };
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
  const userId = readId(formData.get("userId"));
  const role = String(formData.get("role") ?? "");

  if (!userId || !isRole(role) || userId === session.user.id) return;

  let previousRole: string;
  try {
    const result = await setUserRole(userId, role);
    previousRole = result.previousRole;
  } catch {
    return;
  }

  await recordSecurityEvent({
    type: "ROLE_CHANGED",
    outcome: "SUCCESS",
    ...auditActor(session),
    targetType: "user",
    targetId: userId,
    detail: `${previousRole} → ${role}`,
  });

  revalidatePath("/council/users");
}

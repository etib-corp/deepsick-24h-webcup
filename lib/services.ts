import "server-only";

import { Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";

import { PublicError } from "@/lib/errors";
import { formatDateTime, slugify } from "@/lib/format";
import { normalizeIdentifier } from "@/lib/identity";
import { startOfUtcDay } from "@/lib/insights";
import { prisma } from "@/lib/prisma";
import {
  CONCERN_STATUS_LABELS,
  IDEA_STATUS_LABELS,
  isConcernStatus,
  isIdeaStatus,
  isOrderStatus,
  isProjectStatus,
  isReportStatus,
  isRequestStatus,
  isRole,
  needsAction,
  REQUEST_STATUS_LABELS,
} from "@/lib/roles";

/* ------------------------------------------------------------------ *
 * Accounts
 * ------------------------------------------------------------------ */

export type RegistrationErrorCode = "EMAIL_TAKEN" | "USERNAME_TAKEN";

/** Typed so the action can render a localized message for the resident. */
export class RegistrationError extends Error {
  readonly code: RegistrationErrorCode;

  constructor(code: RegistrationErrorCode) {
    super(code);
    this.name = "RegistrationError";
    this.code = code;
  }
}

/**
 * Creates a citizen account (F71). An email or a colon identifier is enough —
 * new arrivals without an email register with an identifier only.
 */
export async function registerCitizen(input: {
  name: string;
  email?: string | null;
  username?: string | null;
  password: string;
}) {
  const name = input.name.trim();
  const email = input.email ? normalizeIdentifier(input.email) : null;
  const username = input.username ? normalizeIdentifier(input.username) : null;
  if (!email && !username) {
    throw new Error("registerCitizen requires an email or a colon identifier.");
  }

  const existing = await prisma.user.findFirst({
    where: {
      OR: [...(email ? [{ email }] : []), ...(username ? [{ username }] : [])],
    },
    select: { email: true },
  });
  if (existing) {
    throw new RegistrationError(existing.email === email && email ? "EMAIL_TAKEN" : "USERNAME_TAKEN");
  }

  const passwordHash = await bcrypt.hash(input.password, 10);
  try {
    return await prisma.user.create({
      data: { name, email, username, passwordHash, role: "CITIZEN" },
    });
  } catch (error) {
    // The unique constraint may still fire if two requests raced.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const target = String(error.meta?.target ?? "");
      throw new RegistrationError(target.includes("username") ? "USERNAME_TAKEN" : "EMAIL_TAKEN");
    }
    throw error;
  }
}

export async function setUserRole(userId: string, role: string) {
  if (!isRole(role)) throw new PublicError("Rôle invalide.");
  const current = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (!current) throw new PublicError("Compte introuvable.");
  const user = await prisma.user.update({ where: { id: userId }, data: { role } });
  return { user, previousRole: current.role };
}

/**
 * Permanently delete a user account. Citizens own no staff-only rows (e.g.
 * `PoliceCase`), so every remaining relation cascades or set-nulls cleanly.
 */
export async function deleteAccount(userId: string) {
  return prisma.user.delete({ where: { id: userId } });
}

/* ------------------------------------------------------------------ *
 * Contact (D04)
 * ------------------------------------------------------------------ */

export async function createContactMessage(input: {
  subject: string;
  body: string;
  email: string;
  authorId?: string | null;
}) {
  return prisma.contactMessage.create({
    data: {
      subject: input.subject.trim(),
      body: input.body.trim(),
      email: input.email.toLowerCase().trim(),
      authorId: input.authorId ?? null,
      status: "RECEIVED",
    },
  });
}

export async function updateContactMessageStatus(id: string, status: string) {
  return prisma.contactMessage.update({ where: { id }, data: { status } });
}

/* ------------------------------------------------------------------ *
 * Citizen requests (D03 / F22)
 * ------------------------------------------------------------------ */

export async function createServiceRequest(
  authorId: string,
  input: {
    subject: string;
    description: string;
    category?: string | null;
    priority: string;
  },
) {
  const created = await prisma.serviceRequest.create({
    data: {
      subject: input.subject.trim(),
      description: input.description.trim(),
      category: input.category?.trim() || null,
      priority: input.priority,
      status: "SUBMITTED",
      authorId,
      history: {
        create: { status: "SUBMITTED", note: "Demande créée par l'habitant.", actorId: authorId },
      },
    },
  });
  return created;
}

/**
 * Move a request forward, record the transition, and self-assign it to the
 * agent who first acts on it.
 */
export async function updateRequestStatus(
  requestId: string,
  status: string,
  actorId: string,
  note?: string,
) {
  if (!isRequestStatus(status)) throw new PublicError("Statut invalide.");

  return prisma.$transaction(async (tx) => {
    const current = await tx.serviceRequest.findUnique({ where: { id: requestId } });
    if (!current) throw new PublicError("Demande introuvable.");

    const updated = await tx.serviceRequest.update({
      where: { id: requestId },
      data: {
        status,
        ...(current.assigneeId ? {} : { assigneeId: actorId }),
      },
    });

    await tx.requestStatusEvent.create({
      data: { requestId, status, note: note?.trim() || null, actorId },
    });

    // F49 — the author follows the status change through an in-app
    // notification (visible in /citizen/notifications). Re-applying the same
    // status records the event but does not notify again.
    if (current.status !== status) {
      await tx.notification.create({
        data: {
          userId: current.authorId,
          title: `Demande ${current.reference} mise à jour`,
          body: `Nouveau statut : ${REQUEST_STATUS_LABELS[status]}`,
          href: `/citizen/requests/request/${requestId}`,
        },
      });
    }

    return updated;
  });
}

export async function assignRequest(requestId: string, assigneeId: string) {
  return prisma.serviceRequest.update({ where: { id: requestId }, data: { assigneeId } });
}

/** True when the request still needs an agent action. */
export function requestNeedsAction(status: string): boolean {
  return needsAction(status);
}

/* ------------------------------------------------------------------ *
 * Municipal services (D05)
 * ------------------------------------------------------------------ */

async function uniqueServiceSlug(name: string) {
  const root = slugify(name) || "service";
  let slug = root;
  let suffix = 2;
  while (await prisma.municipalService.findUnique({ where: { slug } })) {
    slug = `${root}-${suffix++}`;
  }
  return slug;
}

export async function createMunicipalService(input: {
  name: string;
  description: string;
  category?: string | null;
  icon?: string | null;
  mapX?: number | null;
  mapY?: number | null;
  sector?: string | null;
  featured?: boolean;
  openingHours?: string | null;
  address?: string | null;
  plainLanguage?: string | null;
}) {
  return prisma.municipalService.create({
    data: {
      slug: await uniqueServiceSlug(input.name),
      name: input.name.trim(),
      description: input.description.trim(),
      category: input.category?.trim() || null,
      icon: input.icon?.trim() || null,
      mapX: input.mapX ?? null,
      mapY: input.mapY ?? null,
      sector: input.sector?.trim() || null,
      featured: input.featured ?? false,
      openingHours: input.openingHours?.trim() || null,
      address: input.address?.trim() || null,
      plainLanguage: input.plainLanguage?.trim() || null,
      published: true,
    },
  });
}

export async function setServiceFeatured(id: string, featured: boolean) {
  return prisma.municipalService.update({ where: { id }, data: { featured } });
}

/**
 * F63 — enable or disable a service without deleting it. Existing appointments
 * and requests are preserved; only availability changes.
 */
export async function setServicePublished(id: string, published: boolean) {
  return prisma.municipalService.update({ where: { id }, data: { published } });
}

export async function deleteMunicipalService(id: string) {
  return prisma.municipalService.delete({ where: { id } });
}

/* ------------------------------------------------------------------ *
 * Announcements (D06)
 * ------------------------------------------------------------------ */

async function uniqueAnnouncementSlug(title: string) {
  const root = slugify(title) || "annonce";
  let slug = root;
  let suffix = 2;
  while (await prisma.announcement.findUnique({ where: { slug } })) {
    slug = `${root}-${suffix++}`;
  }
  return slug;
}

/** F30 — one notification per resident for content that goes public. */
async function notifyCitizens(
  db: Prisma.TransactionClient,
  input: { title: string; body?: string | null; href?: string | null },
) {
  const citizens = await db.user.findMany({
    where: { role: "CITIZEN" },
    select: { id: true },
  });
  if (citizens.length === 0) return;

  await db.notification.createMany({
    data: citizens.map((citizen) => ({
      userId: citizen.id,
      title: input.title,
      body: input.body ?? null,
      href: input.href ?? null,
    })),
  });
}

export async function createAnnouncement(input: {
  title: string;
  excerpt?: string | null;
  body: string;
  plainLanguage?: string | null;
  published?: boolean;
  authorId?: string | null;
}) {
  const published = input.published ?? false;
  return prisma.$transaction(async (tx) => {
    const announcement = await tx.announcement.create({
      data: {
        slug: await uniqueAnnouncementSlug(input.title),
        title: input.title.trim(),
        excerpt: input.excerpt?.trim() || null,
        body: input.body.trim(),
        plainLanguage: input.plainLanguage?.trim() || null,
        published,
        publishedAt: published ? new Date() : null,
        authorId: input.authorId ?? null,
      },
    });

    if (published) {
      await notifyCitizens(tx, {
        title: "Nouvelle annonce municipale",
        body: announcement.title,
        href: `/announcements/${announcement.slug}`,
      });
    }

    return announcement;
  });
}

export async function setAnnouncementPublished(id: string, published: boolean) {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.announcement.findUnique({ where: { id } });
    if (!existing) throw new PublicError("Annonce introuvable.");

    const announcement = await tx.announcement.update({
      where: { id },
      data: { published, publishedAt: published ? new Date() : null },
    });

    // F30 — only the draft → published transition notifies the residents;
    // re-saving an already visible announcement never spams them.
    if (published && !existing.published) {
      await notifyCitizens(tx, {
        title: "Nouvelle annonce municipale",
        body: announcement.title,
        href: `/announcements/${announcement.slug}`,
      });
    }

    return announcement;
  });
}

/* ------------------------------------------------------------------ *
 * Broadcasts (general announcements shown site-wide)
 * ------------------------------------------------------------------ */

export async function createBroadcast(input: {
  title: string;
  message: string;
  actionLabel?: string | null;
  actionHref?: string | null;
  startsAt?: Date | null;
  endsAt?: Date | null;
  active?: boolean;
  authorId?: string | null;
}) {
  return prisma.broadcast.create({
    data: {
      title: input.title.trim(),
      message: input.message.trim(),
      actionLabel: input.actionLabel?.trim() || null,
      actionHref: input.actionHref?.trim() || null,
      startsAt: input.startsAt ?? null,
      endsAt: input.endsAt ?? null,
      active: input.active ?? true,
      authorId: input.authorId ?? null,
    },
  });
}

export async function setBroadcastActive(id: string, active: boolean) {
  return prisma.broadcast.update({ where: { id }, data: { active } });
}

export async function deleteBroadcast(id: string) {
  return prisma.broadcast.delete({ where: { id } });
}

/* ------------------------------------------------------------------ *
 * Consultations & opinions (F66 — citizen participation)
 * ------------------------------------------------------------------ */

async function uniqueConsultationSlug(title: string) {
  const root = slugify(title) || "consultation";
  let slug = root;
  let suffix = 2;
  while (await prisma.consultation.findUnique({ where: { slug } })) {
    slug = `${root}-${suffix++}`;
  }
  return slug;
}

export async function createConsultation(input: {
  title: string;
  summary?: string | null;
  description: string;
  published?: boolean;
  anonymous?: boolean;
  opensAt?: Date | null;
  closesAt?: Date | null;
  authorId?: string | null;
}) {
  return prisma.consultation.create({
    data: {
      slug: await uniqueConsultationSlug(input.title),
      title: input.title.trim(),
      summary: input.summary?.trim() || null,
      description: input.description.trim(),
      status: "OPEN",
      published: input.published ?? true,
      anonymous: input.anonymous ?? false,
      opensAt: input.opensAt ?? null,
      closesAt: input.closesAt ?? null,
      authorId: input.authorId ?? null,
    },
  });
}

export async function setConsultationOutcome(id: string, outcome: string | null) {
  return prisma.consultation.update({
    where: { id },
    data: { outcome: outcome?.trim() || null },
  });
}

export async function setConsultationPublished(id: string, published: boolean) {
  return prisma.consultation.update({ where: { id }, data: { published } });
}

export async function setConsultationStatus(id: string, status: string) {
  return prisma.consultation.update({ where: { id }, data: { status } });
}

export async function deleteConsultation(id: string) {
  return prisma.consultation.delete({ where: { id } });
}

/* ------------------------------------------------------------------ *
 * City projects (F67)
 * ------------------------------------------------------------------ */

async function uniqueProjectSlug(title: string) {
  const root = slugify(title) || "projet";
  let slug = root;
  let suffix = 2;
  while (await prisma.project.findUnique({ where: { slug } })) {
    slug = `${root}-${suffix++}`;
  }
  return slug;
}

export async function createProject(input: {
  title: string;
  description: string;
  summary?: string | null;
  sector?: string | null;
  status: string;
  progress?: number | null;
}) {
  if (!isProjectStatus(input.status)) throw new PublicError("Statut invalide.");
  return prisma.project.create({
    data: {
      slug: await uniqueProjectSlug(input.title),
      title: input.title.trim(),
      summary: input.summary?.trim() || null,
      description: input.description.trim(),
      sector: input.sector?.trim() || null,
      status: input.status,
      progress: input.progress ?? 0,
      published: true,
    },
  });
}

export async function setProjectPublished(id: string, published: boolean) {
  return prisma.project.update({ where: { id }, data: { published } });
}

export async function setProjectStatus(id: string, status: string) {
  if (!isProjectStatus(status)) throw new PublicError("Statut invalide.");
  return prisma.project.update({ where: { id }, data: { status } });
}

export async function deleteProject(id: string) {
  return prisma.project.delete({ where: { id } });
}

/* ------------------------------------------------------------------ *
 * Citizen ideas (F68)
 * ------------------------------------------------------------------ */

export async function createIdea(authorId: string, input: { title: string; body: string }) {
  return prisma.citizenIdea.create({
    data: {
      title: input.title.trim(),
      body: input.body.trim(),
      authorId,
      status: "SUBMITTED",
    },
  });
}

/** Council review of an idea: status + written response, author notified. */
export async function reviewIdea(
  id: string,
  input: { status: string; response?: string | null },
  reviewerId: string,
) {
  if (!isIdeaStatus(input.status)) throw new PublicError("Statut invalide.");
  const status = input.status;

  return prisma.$transaction(async (tx) => {
    const current = await tx.citizenIdea.findUnique({ where: { id } });
    if (!current) throw new PublicError("Idée introuvable.");

    const response = input.response?.trim() || null;
    const updated = await tx.citizenIdea.update({
      where: { id },
      data: { status, response, reviewerId },
    });

    // The author follows the review from their personal space (F68).
    if (current.status !== status || response !== current.response) {
      await tx.notification.create({
        data: {
          userId: current.authorId,
          title: `Idée ${current.reference} mise à jour`,
          body: `Nouveau statut : ${IDEA_STATUS_LABELS[status]}`,
          href: "/citizen/ideas",
        },
      });
    }

    return updated;
  });
}

/* ------------------------------------------------------------------ *
 * Service usage insights (F98)
 * ------------------------------------------------------------------ */

/**
 * Counts one consultation of a service detail page. Anonymous: one counter
 * per service and per day, incremented atomically — no user identity.
 */
export async function recordServiceVisit(serviceId: string) {
  const day = startOfUtcDay(new Date());
  await prisma.serviceVisit.upsert({
    where: { serviceId_day: { serviceId, day } },
    update: { count: { increment: 1 } },
    create: { serviceId, day, count: 1 },
  });
}

/* ------------------------------------------------------------------ *
 * Data-usage concerns (F51)
 * ------------------------------------------------------------------ */
export async function createDataConcern(
  authorId: string,
  input: { subject: string; body: string },
) {
  return prisma.dataConcern.create({
    data: {
      subject: input.subject.trim(),
      body: input.body.trim(),
      authorId,
      status: "RECEIVED",
    },
  });
}

/**
 * Council handling of a concern: mark it as being examined, or answer it.
 * The author is notified so the trace is visible in their personal space.
 */
export async function reviewDataConcern(
  id: string,
  input: { status: string; response?: string | null },
  responderId: string,
) {
  if (!isConcernStatus(input.status)) throw new PublicError("Statut invalide.");
  const status = input.status;

  return prisma.$transaction(async (tx) => {
    const current = await tx.dataConcern.findUnique({ where: { id } });
    if (!current) throw new PublicError("Inquiétude introuvable.");

    const response = input.response?.trim() || null;
    const updated = await tx.dataConcern.update({
      where: { id },
      data: { status, response, responderId },
    });

    if (current.status !== status || response !== current.response) {
      await tx.notification.create({
        data: {
          userId: current.authorId,
          title: `Inquiétude ${current.reference} mise à jour`,
          body:
            status === "ANSWERED"
              ? "Une réponse a été apportée à votre inquiétude sur l'usage de vos données."
              : `Nouveau statut : ${CONCERN_STATUS_LABELS[status]}`,
          href: "/citizen/donnees",
        },
      });
    }

    return updated;
  });
}

/** One opinion per citizen and consultation (editable). */
export async function upsertOpinion(input: {
  consultationId: string;
  authorId: string;
  stance: string;
  comment: string;
}) {
  const where = {
    consultationId_authorId: {
      consultationId: input.consultationId,
      authorId: input.authorId,
    },
  };
  const data = { stance: input.stance, comment: input.comment.trim() };
  try {
    return await prisma.opinion.upsert({
      where,
      update: data,
      create: { ...data, consultationId: input.consultationId, authorId: input.authorId },
    });
  } catch (error) {
    // Prisma 5 can implement this compound upsert as read + insert on MySQL.
    // A competing insert is safe to resolve against the same unique owner key.
    if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2002") {
      throw error;
    }
    return prisma.opinion.update({ where, data });
  }
}

/* ------------------------------------------------------------------ *
 * Community support & agent replies on requests (F52 / F84)
 * ------------------------------------------------------------------ */

/** F52 — a citizen backs a shared request; toggles, returns the new state. */
export async function toggleRequestSupport(requestId: string, userId: string) {
  return prisma.$transaction(async (tx) => {
    const request = await tx.serviceRequest.findUnique({
      where: { id: requestId },
      select: { id: true, reference: true, authorId: true, shareForSupport: true },
    });
    if (!request) throw new PublicError("Demande introuvable.");
    if (!request.shareForSupport) throw new PublicError("Cette demande n'est pas partagée.");
    if (request.authorId === userId) {
      throw new PublicError("Vous ne pouvez pas soutenir votre propre demande.");
    }

    const existing = await tx.requestSupport.findUnique({
      where: { requestId_userId: { requestId, userId } },
    });

    if (existing) {
      await tx.requestSupport.delete({ where: { id: existing.id } });
      return { supported: false, count: await tx.requestSupport.count({ where: { requestId } }) };
    }

    await tx.requestSupport.create({ data: { requestId, userId } });
    await tx.notification.create({
      data: {
        userId: request.authorId,
        title: `Nouveau soutien pour ${request.reference}`,
        body: "Un habitant soutient votre demande. Retrouvez le nombre de soutiens dans « Demandes du quartier ».",
        href: "/citizen/soutien",
      },
    });
    return { supported: true, count: await tx.requestSupport.count({ where: { requestId } }) };
  });
}

/** F52 — the author opts their request in or out of the community board. */
export async function setRequestShared(requestId: string, authorId: string, shared: boolean) {
  const updated = await prisma.serviceRequest.updateMany({
    where: { id: requestId, authorId },
    data: { shareForSupport: shared },
  });
  if (updated.count === 0) throw new PublicError("Demande introuvable.");
}

/** F84 — an official reply from an agent; the author is notified. */
export async function addRequestReply(requestId: string, authorId: string, body: string) {
  const trimmed = body.trim();
  return prisma.$transaction(async (tx) => {
    const request = await tx.serviceRequest.findUnique({
      where: { id: requestId },
      select: { id: true, reference: true, authorId: true },
    });
    if (!request) throw new PublicError("Demande introuvable.");

    const reply = await tx.requestReply.create({ data: { requestId, authorId, body: trimmed } });
    await tx.notification.create({
      data: {
        userId: request.authorId,
        title: `Réponse à votre demande ${request.reference}`,
        body: trimmed.slice(0, 140),
        href: `/citizen/requests/request/${requestId}`,
      },
    });
    return reply;
  });
}

/* ------------------------------------------------------------------ *
 * Service feedback (F76)
 * ------------------------------------------------------------------ */

/** One editable comment per citizen and per service. */
export async function upsertServiceFeedback(input: {
  serviceId: string;
  authorId: string;
  comment: string;
}) {
  const where = {
    serviceId_authorId: { serviceId: input.serviceId, authorId: input.authorId },
  };
  const data = { comment: input.comment.trim() };
  try {
    return await prisma.serviceFeedback.upsert({
      where,
      update: data,
      create: { ...data, serviceId: input.serviceId, authorId: input.authorId },
    });
  } catch (error) {
    // Same MySQL compound-upsert caveat as opinions (F66).
    if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2002") {
      throw error;
    }
    return prisma.serviceFeedback.update({ where, data });
  }
}

// ------------------------------------------------------------------
// Terra Nova ecosystem — reports, police cases, orders, notifications
// ------------------------------------------------------------------

export async function createReport(
  authorId: string,
  input: {
    type: string;
    title: string;
    description: string;
    priority: string;
    sector?: string | null;
  },
) {
  return prisma.report.create({
    data: {
      type: input.type,
      title: input.title.trim(),
      description: input.description.trim(),
      priority: input.priority,
      sector: input.sector?.trim() || null,
      status: "OPEN",
      authorId,
      events: {
        create: { status: "OPEN", note: "Signalement transmis par un colon.", actorId: authorId },
      },
    },
  });
}

export async function assignReport(reportId: string, assigneeId: string) {
  return prisma.report.update({
    where: { id: reportId },
    data: { assigneeId, status: "ASSIGNED" },
  });
}

/** Move an incident forward and record the transition in its timeline. */
export async function updateReportStatus(
  reportId: string,
  status: string,
  actorId: string,
  note?: string,
) {
  if (!isReportStatus(status)) throw new PublicError("Statut invalide.");

  return prisma.$transaction(async (tx) => {
    const current = await tx.report.findUnique({ where: { id: reportId } });
    if (!current) throw new PublicError("Incident introuvable.");

    const updated = await tx.report.update({
      where: { id: reportId },
      data: { status, ...(current.assigneeId ? {} : { assigneeId: actorId }) },
    });

    await tx.reportEvent.create({
      data: { reportId, status, note: note?.trim() || null, actorId },
    });

    return updated;
  });
}

/** Open (or update) the simulated police case attached to a security report. */
export async function filePoliceCase(
  reportId: string,
  officerId: string,
  input: { suspectName?: string | null; arrestNotes?: string | null; fineAmount?: number | null; pvContent?: string | null },
) {
  return prisma.policeCase.upsert({
    where: { reportId },
    update: {
      suspectName: input.suspectName?.trim() || null,
      arrestNotes: input.arrestNotes?.trim() || null,
      fineAmount: input.fineAmount ?? null,
      pvContent: input.pvContent?.trim() || null,
      status: "FILED",
      officerId,
    },
    create: {
      reportId,
      officerId,
      suspectName: input.suspectName?.trim() || null,
      arrestNotes: input.arrestNotes?.trim() || null,
      fineAmount: input.fineAmount ?? null,
      pvContent: input.pvContent?.trim() || null,
      status: "FILED",
    },
  });
}

export async function createOrder(
  customerId: string,
  input: {
    type: string;
    summary: string;
    total?: number;
    etaMinutes?: number | null;
    origin?: string | null;
    destination?: string | null;
  },
) {
  return prisma.order.create({
    data: {
      type: input.type,
      summary: input.summary.trim(),
      total: input.total ?? 0,
      etaMinutes: input.etaMinutes ?? null,
      origin: input.origin ?? null,
      destination: input.destination ?? null,
      status: "PENDING",
      customerId,
    },
  });
}

export async function updateOrderStatus(orderId: string, status: string) {
  if (!isOrderStatus(status)) throw new PublicError("Statut de commande invalide.");
  return prisma.order.update({ where: { id: orderId }, data: { status } });
}

export async function pushNotification(
  userId: string,
  input: { title: string; body?: string; href?: string },
) {
  return prisma.notification.create({
    data: { userId, title: input.title, body: input.body ?? null, href: input.href ?? null },
  });
}

export async function markAllNotificationsRead(userId: string) {
  return prisma.notification.updateMany({ where: { userId, read: false }, data: { read: true } });
}

/* ------------------------------------------------------------------ *
 * Rendez-vous (F40) — booking, cancellation and reminders
 * ------------------------------------------------------------------ */

/** Window (ms) during which a booked appointment triggers a reminder. */
export const APPOINTMENT_REMINDER_WINDOW_MS = 24 * 60 * 60 * 1000;

export async function createAppointment(
  citizenId: string,
  input: { serviceId: string; subject?: string | null; date: Date },
) {
  return prisma.$transaction(async (tx) => {
    // MySQL: serialize bookings for this service across all app instances.
    // Acquire the row lock before the first consistent read of the slot.
    await tx.$queryRaw`SELECT id FROM MunicipalService WHERE id = ${input.serviceId} FOR UPDATE`;
    const service = await tx.municipalService.findUnique({ where: { id: input.serviceId } });
    if (!service) throw new PublicError("Service introuvable.");
    // F63 — a disabled service can never be booked, even via a stale link.
    if (!service.published) throw new PublicError("Service indisponible.");

    // Authoritative re-check: never allow a double-booking of the same slot.
    const clash = await tx.appointment.findFirst({
      where: { serviceId: service.id, status: "BOOKED", date: input.date },
    });
    if (clash) throw new PublicError("Ce créneau vient d'être réservé.");

    const appointment = await tx.appointment.create({
      data: {
        serviceId: service.id,
        subject: input.subject?.trim() || null,
        citizenId,
        date: input.date,
        durationMinutes: 30,
        sector: service.sector ?? null,
        preparation: service.preparation ?? null,
        status: "BOOKED",
      },
    });

    await tx.notification.create({
      data: {
        userId: citizenId,
        title: "Rendez-vous confirmé",
        body: `${service.name} · ${formatDateTime(input.date)}`,
        href: "/citizen/appointments",
      },
    });

    return appointment;
  });
}

export async function cancelAppointment(id: string, citizenId: string) {
  const appointment = await prisma.appointment.findFirst({
    where: { id, citizenId },
  });
  if (!appointment) throw new PublicError("Rendez-vous introuvable.");
  if (appointment.status !== "BOOKED") throw new PublicError("Ce rendez-vous ne peut plus être annulé.");

  return prisma.$transaction(async (tx) => {
    const cancelled = await tx.appointment.update({
      where: { id },
      data: { status: "CANCELLED" },
      include: { service: { select: { name: true } } },
    });

    await tx.notification.create({
      data: {
        userId: citizenId,
        title: "Rendez-vous annulé",
        body: `${cancelled.service.name} · ${formatDateTime(cancelled.date)}`,
        href: "/citizen/appointments",
      },
    });

    return cancelled;
  });
}

/** Deliver a reminder notification once per booked appointment within the window. */
export async function ensureAppointmentReminders(citizenId: string): Promise<number> {
  const now = new Date();
  const horizon = new Date(now.getTime() + APPOINTMENT_REMINDER_WINDOW_MS);
  const upcoming = await prisma.appointment.findMany({
    where: {
      citizenId,
      status: "BOOKED",
      reminderSent: false,
      date: { gt: now, lte: horizon },
    },
    orderBy: { id: "asc" },
    select: { id: true, date: true, service: { select: { name: true } } },
  });

  let sent = 0;
  for (const appointment of upcoming) {
    const delivered = await prisma.$transaction(async (tx) => {
      // Conditional UPDATE claims the reminder atomically. If creation fails,
      // rollback releases the claim so a later page load can deliver it.
      const claimed = await tx.appointment.updateMany({
        where: {
          id: appointment.id, citizenId, status: "BOOKED", reminderSent: false,
          date: { gt: now, lte: horizon },
        },
        data: { reminderSent: true },
      });
      if (claimed.count === 0) return false;
      await tx.notification.create({
        data: {
          userId: citizenId,
          title: "Rappel — rendez-vous à venir",
          body: `${appointment.service.name} · ${formatDateTime(appointment.date)}`,
          href: "/citizen/appointments",
        },
      });
      return true;
    });
    if (delivered) sent++;
  }

  return sent;
}

export async function isAppointmentSlotTaken(serviceId: string, date: Date): Promise<boolean> {
  const existing = await prisma.appointment.findFirst({
    where: { serviceId, status: "BOOKED", date },
    select: { id: true },
  });
  return Boolean(existing);
}

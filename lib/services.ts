import "server-only";

import { Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";

import { PublicError } from "@/lib/errors";
import { formatDateTime, slugify } from "@/lib/format";
import { normalizeIdentifier } from "@/lib/identity";
import { prisma } from "@/lib/prisma";
import {
  isOrderStatus,
  isReportStatus,
  isRequestStatus,
  isRole,
  needsAction,
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

export async function createAnnouncement(input: {
  title: string;
  excerpt?: string | null;
  body: string;
  published?: boolean;
  authorId?: string | null;
}) {
  const published = input.published ?? false;
  return prisma.announcement.create({
    data: {
      slug: await uniqueAnnouncementSlug(input.title),
      title: input.title.trim(),
      excerpt: input.excerpt?.trim() || null,
      body: input.body.trim(),
      published,
      publishedAt: published ? new Date() : null,
      authorId: input.authorId ?? null,
    },
  });
}

export async function setAnnouncementPublished(id: string, published: boolean) {
  return prisma.announcement.update({
    where: { id },
    data: { published, publishedAt: published ? new Date() : null },
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
      opensAt: input.opensAt ?? null,
      closesAt: input.closesAt ?? null,
      authorId: input.authorId ?? null,
    },
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

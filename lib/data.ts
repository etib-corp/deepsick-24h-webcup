import "server-only";

import { unstable_cache } from "next/cache";
import { cache } from "react";
import type { Prisma } from "@prisma/client";
import { coalesce } from "@/lib/coalesce";
import { prisma } from "@/lib/prisma";
import { ACTIONABLE_STATUSES, REPORT_ACTIONABLE } from "@/lib/roles";

/* ------------------------------------------------------------------ *
 * Public content
 * ------------------------------------------------------------------ */

const readPublishedServices = unstable_cache(coalesce(async (limit?: number) => {
  return prisma.municipalService.findMany({
    where: { published: true },
    orderBy: [{ featured: "desc" }, { order: "asc" }, { name: "asc" }],
    ...(limit === undefined ? {} : { take: limit }),
  });
}), ["public-services"], { revalidate: 60, tags: ["public-services"] });

export async function getPublishedServices(limit?: number) {
  const services = await readPublishedServices(limit);
  // Next's persistent cache uses JSON; preserve the Date contract on hits.
  return services.map((service) => ({
    ...service, createdAt: new Date(service.createdAt), updatedAt: new Date(service.updatedAt),
  }));
}

export function getAllServices() {
  return prisma.municipalService.findMany({
    orderBy: [{ featured: "desc" }, { order: "asc" }, { name: "asc" }],
  });
}

export const getServiceBySlug = cache((slug: string) => {
  return prisma.municipalService.findUnique({ where: { slug } });
});

export function getOtherPublishedServices(id: string) {
  return prisma.municipalService.findMany({
    where: { published: true, id: { not: id } },
    orderBy: [{ featured: "desc" }, { order: "asc" }, { name: "asc" }],
    take: 3,
    select: { id: true, slug: true, name: true, description: true },
  });
}

export function getServiceById(id: string) {
  return prisma.municipalService.findUnique({ where: { id } });
}

export function getPublishedAnnouncements() {
  return prisma.announcement.findMany({
    where: { published: true },
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
  });
}

const readAnnouncementSummaries = unstable_cache(coalesce(async (limit?: number) => {
  return prisma.announcement.findMany({
    where: { published: true },
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
    ...(limit === undefined ? {} : { take: limit }),
    select: { id: true, slug: true, title: true, excerpt: true, publishedAt: true, createdAt: true },
  });
}), ["public-announcement-summaries"], { revalidate: 60, tags: ["public-announcements"] });

export async function getPublishedAnnouncementSummaries(limit?: number) {
  const announcements = await readAnnouncementSummaries(limit);
  return announcements.map((announcement) => ({
    ...announcement,
    createdAt: new Date(announcement.createdAt),
    publishedAt: announcement.publishedAt ? new Date(announcement.publishedAt) : null,
  }));
}

export function getAllAnnouncements() {
  return prisma.announcement.findMany({
    orderBy: [{ createdAt: "desc" }],
    include: { author: { select: { name: true } } },
  });
}

export const getAnnouncementBySlug = cache((slug: string) => {
  return prisma.announcement.findUnique({
    where: { slug },
    include: { author: { select: { name: true } } },
  });
});

/* ------------------------------------------------------------------ *
 * Broadcasts (general announcements shown site-wide)
 * ------------------------------------------------------------------ */

/** Active broadcasts currently visible to users (inside their time window). */
export function getActiveBroadcasts(now = new Date()) {
  return prisma.broadcast.findMany({
    where: {
      active: true,
      AND: [
        { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
        { OR: [{ endsAt: null }, { endsAt: { gte: now } }] },
      ],
    },
    orderBy: [{ createdAt: "desc" }],
    select: { id: true, title: true, message: true, actionLabel: true, actionHref: true },
  });
}

/** All broadcasts for the Council admin (including inactive and scheduled). */
export function getAllBroadcasts() {
  return prisma.broadcast.findMany({
    orderBy: [{ createdAt: "desc" }],
    include: { author: { select: { name: true } } },
  });
}

/* ------------------------------------------------------------------ *
 * Consultations & opinions (F66 — citizen participation)
 * ------------------------------------------------------------------ */

export function getPublishedConsultations() {
  return prisma.consultation.findMany({
    where: { published: true },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
  });
}

export function getConsultationBySlug(slug: string) {
  return prisma.consultation.findUnique({ where: { slug } });
}

export function getAllConsultations() {
  return prisma.consultation.findMany({
    orderBy: [{ createdAt: "desc" }],
    include: {
      author: { select: { name: true } },
      _count: { select: { opinions: true } },
    },
  });
}

export function getConsultationById(id: string) {
  return prisma.consultation.findUnique({
    where: { id },
    include: { author: { select: { name: true } } },
  });
}

export function getOpinionByAuthorAndConsultation(consultationId: string, authorId: string) {
  return prisma.opinion.findUnique({
    where: { consultationId_authorId: { consultationId, authorId } },
  });
}

/** A citizen's own past contributions. */
export function getOpinionsByAuthor(authorId: string) {
  return prisma.opinion.findMany({
    where: { authorId },
    orderBy: { createdAt: "desc" },
    include: { consultation: { select: { title: true, slug: true, status: true } } },
  });
}

/** All opinions for a consultation — callers must be authorised agents. */
export function getOpinionsByConsultation(consultationId: string) {
  return prisma.opinion.findMany({
    where: { consultationId },
    orderBy: { createdAt: "desc" },
    include: { author: { select: { name: true } } },
  });
}

export async function getOpinionStats(consultationId: string) {
  const rows = await prisma.opinion.groupBy({
    by: ["stance"],
    where: { consultationId },
    _count: { _all: true },
  });
  const counts: Record<string, number> = {};
  for (const row of rows) {
    counts[row.stance ?? "NEUTRAL"] = row._count._all;
  }
  return {
    total: Object.values(counts).reduce((sum, value) => sum + value, 0),
    support: counts.SUPPORT ?? 0,
    oppose: counts.OPPOSE ?? 0,
    neutral: counts.NEUTRAL ?? 0,
  };
}

/* ------------------------------------------------------------------ *
 * Requests
 * ------------------------------------------------------------------ */

export function getRequestsByAuthor(authorId: string) {
  return prisma.serviceRequest.findMany({
    where: { authorId },
    orderBy: { createdAt: "desc" },
    include: { assignee: { select: { name: true } } },
  });
}

export function getRequestById(id: string) {
  return prisma.serviceRequest.findUnique({
    where: { id },
    include: {
      author: { select: { id: true, name: true, email: true } },
      assignee: { select: { id: true, name: true, email: true } },
      history: { orderBy: { createdAt: "asc" } },
    },
  });
}

/** Requests list for agents/admins, optionally restricted to actionable items (F22). */
export function getStaffRequests({ actionable = false } = {}) {
  return prisma.serviceRequest.findMany({
    where: actionable ? { status: { in: [...ACTIONABLE_STATUSES] } } : undefined,
    orderBy: [{ createdAt: "desc" }],
    include: {
      author: { select: { name: true, email: true } },
      assignee: { select: { name: true } },
    },
  });
}

/* ------------------------------------------------------------------ *
 * Admin
 * ------------------------------------------------------------------ */

export function getUsers() {
  return prisma.user.findMany({
    orderBy: [{ role: "asc" }, { createdAt: "asc" }],
    select: { id: true, name: true, email: true, username: true, role: true, createdAt: true },
  });
}

export function getContactMessages() {
  return prisma.contactMessage.findMany({
    orderBy: { createdAt: "desc" },
    include: { author: { select: { name: true } } },
  });
}

export function getAssignableAgents() {
  return prisma.user.findMany({
    where: { role: "AGENT" },
    select: { id: true, name: true, email: true },
    orderBy: { name: "asc" },
  });
}

/* ------------------------------------------------------------------ *
 * Dashboard / activity
 * ------------------------------------------------------------------ */

export async function getPlatformStats() {
  const [citizens, agents, services, announcements, requests, actionable, contacts] =
    await Promise.all([
      prisma.user.count({ where: { role: "CITIZEN" } }),
      prisma.user.count({ where: { role: "AGENT" } }),
      prisma.municipalService.count({ where: { published: true } }),
      prisma.announcement.count({ where: { published: true } }),
      prisma.serviceRequest.count(),
      prisma.serviceRequest.count({ where: { status: { in: [...ACTIONABLE_STATUSES] } } }),
      prisma.contactMessage.count(),
    ]);

  return { citizens, agents, services, announcements, requests, actionable, contacts };
}

export type ActivityItem = {
  id: string;
  kind: "request" | "contact" | "announcement";
  title: string;
  subtitle: string;
  date: Date;
  href: string;
};

/** Unified activity feed consumed by the agent workspace (D19). */
export async function getActivityFeed(limit = 8): Promise<ActivityItem[]> {
  const [requests, contacts, announcements] = await Promise.all([
    prisma.serviceRequest.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
      include: { author: { select: { name: true } } },
    }),
    prisma.contactMessage.findMany({ orderBy: { createdAt: "desc" }, take: limit }),
    prisma.announcement.findMany({ orderBy: { createdAt: "desc" }, take: limit }),
  ]);

  const items: ActivityItem[] = [
    ...requests.map((request) => ({
      id: `request-${request.id}`,
      kind: "request" as const,
      title: `Demande — ${request.subject}`,
      subtitle: `${request.author?.name ?? "Habitant"} · ${request.status}`,
      date: request.createdAt,
      href: `/agents/demandes/${request.id}`,
    })),
    ...contacts.map((message) => ({
      id: `contact-${message.id}`,
      kind: "contact" as const,
      title: `Message — ${message.subject}`,
      subtitle: message.email,
      date: message.createdAt,
      href: "/agents",
    })),
    ...announcements.map((announcement) => ({
      id: `announcement-${announcement.id}`,
      kind: "announcement" as const,
      title: `Annonce — ${announcement.title}`,
      subtitle: announcement.published ? "Publiée" : "Brouillon",
      date: announcement.createdAt,
      href: `/announcements/${announcement.slug}`,
    })),
  ];

  return items.sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, limit);
}

// ------------------------------------------------------------------
// Terra Nova ecosystem — reports, orders, wallet, notifications
// ------------------------------------------------------------------

export function getReports(
  filters: {
    type?: string;
    statuses?: readonly string[];
    authorId?: string;
    assigneeId?: string;
  } = {},
) {
  const { type, statuses, authorId, assigneeId } = filters;
  return prisma.report.findMany({
    where: {
      ...(type ? { type } : {}),
      ...(statuses?.length ? { status: { in: [...statuses] } } : {}),
      ...(authorId ? { authorId } : {}),
      ...(assigneeId ? { assigneeId } : {}),
    },
    orderBy: [{ createdAt: "desc" }],
    include: {
      author: { select: { name: true, sector: true } },
      assignee: { select: { name: true } },
    },
  });
}

/** Read exactly the fields the live incident board displays, for its unit only. */
export function getIncidentReports(types: readonly string[]) {
  return prisma.report.findMany({
    where: { type: { in: [...types] } },
    orderBy: { createdAt: "desc" },
    select: {
      id: true, reference: true, type: true, title: true, priority: true,
      status: true, sector: true, unit: true, createdAt: true,
      author: { select: { name: true } },
      assignee: { select: { name: true } },
    } satisfies Prisma.ReportSelect,
  });
}

export function getReportById(id: string) {
  return prisma.report.findUnique({
    where: { id },
    include: {
      author: { select: { id: true, name: true, email: true, sector: true } },
      assignee: { select: { id: true, name: true } },
      events: { orderBy: { createdAt: "asc" } },
      policeCase: true,
    },
  });
}

export async function getReportStats(type?: string) {
  const where = type ? { type } : {};
  const [total, actionable, critical, resolved] = await Promise.all([
    prisma.report.count({ where }),
    prisma.report.count({ where: { ...where, status: { in: [...REPORT_ACTIONABLE] } } }),
    prisma.report.count({
      where: { ...where, priority: "CRITICAL", status: { in: [...REPORT_ACTIONABLE] } },
    }),
    prisma.report.count({ where: { ...where, status: { in: ["RESOLVED", "CLOSED"] } } }),
  ]);
  return { total, actionable, critical, resolved };
}

export function getOrders(
  filters: { type?: string; customerId?: string; providerId?: string; statuses?: readonly string[] } = {},
) {
  const { type, customerId, providerId, statuses } = filters;
  return prisma.order.findMany({
    where: {
      ...(type ? { type } : {}),
      ...(customerId ? { customerId } : {}),
      ...(providerId ? { providerId } : {}),
      ...(statuses?.length ? { status: { in: [...statuses] } } : {}),
    },
    orderBy: [{ createdAt: "desc" }],
    include: { customer: { select: { name: true, sector: true } } },
  });
}

export function getOrderById(id: string) {
  return prisma.order.findUnique({
    where: { id },
    include: { customer: { select: { name: true, email: true } } },
  });
}

export async function getWallet(userId: string) {
  const [user, transactions] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { balance: true } }),
    prisma.walletTransaction.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 20 }),
  ]);
  return { balance: user?.balance ?? 0, transactions };
}

export function getNotifications(userId: string) {
  return prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
}

export function getUnreadNotificationCount(userId: string) {
  return prisma.notification.count({ where: { userId, read: false } });
}

/* ------------------------------------------------------------------ *
 * Rendez-vous (F40) — slots and a resident's appointments
 * ------------------------------------------------------------------ */

const APPOINTMENT_SLOT_START = 9; // 09:00 local
const APPOINTMENT_SLOT_END = 17; // 17:00 local
const APPOINTMENT_SLOT_STEP = 30; // minutes
const APPOINTMENT_SLOT_DAYS = 7;

export type AppointmentSlot = { date: Date; available: boolean };

/** Next `APPOINTMENT_SLOT_DAYS` of bookable 30-min slots for a service. */
export async function getAvailableSlots(serviceId: string): Promise<AppointmentSlot[]> {
  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + APPOINTMENT_SLOT_DAYS);

  const booked = await prisma.appointment.findMany({
    where: { serviceId, status: "BOOKED", date: { gte: start, lt: end } },
    select: { date: true },
  });
  const taken = new Set(booked.map((item) => item.date.getTime()));

  const slots: AppointmentSlot[] = [];
  for (let day = 0; day < APPOINTMENT_SLOT_DAYS; day++) {
    const cursor = new Date(start);
    cursor.setDate(cursor.getDate() + day);
    for (let hour = APPOINTMENT_SLOT_START; hour < APPOINTMENT_SLOT_END; hour++) {
      for (let minute = 0; minute < 60; minute += APPOINTMENT_SLOT_STEP) {
        const date = new Date(cursor);
        date.setHours(hour, minute, 0, 0);
        if (date.getTime() <= now.getTime()) continue;
        slots.push({ date, available: !taken.has(date.getTime()) });
      }
    }
  }
  return slots;
}

export function getAppointments(citizenId: string) {
  return prisma.appointment.findMany({
    where: { citizenId },
    orderBy: [{ date: "asc" }],
    include: { service: { select: { name: true, icon: true, sector: true } } },
  });
}

export function getUpcomingAppointments(citizenId: string) {
  return prisma.appointment.findMany({
    where: { citizenId, status: "BOOKED", date: { gt: new Date() } },
    orderBy: [{ date: "asc" }],
    include: { service: { select: { name: true, icon: true, sector: true } } },
  });
}

export function getMessages(channel: string) {
  return prisma.message.findMany({
    where: { channel },
    orderBy: { createdAt: "asc" },
    take: 30,
    include: { sender: { select: { name: true, role: true } } },
  });
}

export async function getCouncilStats() {
  const [openReports, inProgress, services, announcements, users, orders] = await Promise.all([
    prisma.report.count({ where: { status: "OPEN" } }),
    prisma.report.count({ where: { status: { in: [...REPORT_ACTIONABLE] } } }),
    prisma.municipalService.count({ where: { published: true } }),
    prisma.announcement.count({ where: { published: true } }),
    prisma.user.count(),
    prisma.order.count(),
  ]);
  return { openReports, inProgress, services, announcements, users, orders };
}

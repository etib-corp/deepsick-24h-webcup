import "server-only";

import { getAppointments, getOrders } from "@/lib/data";
import { prisma } from "@/lib/prisma";

export type TrackingKind = "request" | "report" | "order" | "appointment" | "contact";
export type TrackingStep = { status: string; createdAt: Date; note?: string | null };
export type TrackedRequest = {
  id: string;
  kind: TrackingKind;
  reference: string;
  title: string;
  type?: string;
  priority?: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  description?: string | null;
  scheduledAt?: Date;
  origin?: string | null;
  destination?: string | null;
  total?: number;
  steps: TrackingStep[];
  hasHistory: boolean;
};

/** Read-only citizen feed. Ownership always comes from the authenticated session. */
export async function getCitizenRequestTracking(userId: string): Promise<TrackedRequest[]> {
  // Never let an absent session identifier turn into an unfiltered Prisma query.
  if (!userId) throw new Error("A citizen identifier is required.");

  const [requests, reports, orders, appointments, contacts] = await Promise.all([
    prisma.serviceRequest.findMany({
      where: { authorId: userId },
      include: { history: { orderBy: { createdAt: "asc" } } },
    }),
    prisma.report.findMany({
      where: { authorId: userId },
      include: { events: { orderBy: { createdAt: "asc" } } },
    }),
    getOrders({ customerId: userId }),
    getAppointments(userId),
    prisma.contactMessage.findMany({ where: { authorId: userId } }),
  ]);

  const items: TrackedRequest[] = [
    ...requests.map((request) => ({
      ...request, kind: "request" as const, title: request.subject,
      steps: request.history, hasHistory: true,
    })),
    ...reports.map((report) => ({
      ...report, kind: "report" as const, steps: report.events, hasHistory: true,
    })),
    ...orders.map((order) => ({
      ...order, kind: "order" as const, title: order.summary, steps: [], hasHistory: false,
    })),
    ...appointments.map((appointment) => ({
      ...appointment, kind: "appointment" as const, title: appointment.service.name,
      description: appointment.subject, scheduledAt: appointment.date,
      steps: [], hasHistory: false,
    })),
    ...contacts.map((contact) => ({
      ...contact, kind: "contact" as const, title: contact.subject,
      description: contact.body, steps: [], hasHistory: false,
    })),
  ];

  return items.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

/** A detail view reads one category and always applies ownership in the query. */
export async function getCitizenRequestDetail(
  userId: string, kind: string, id: string,
): Promise<TrackedRequest | null> {
  if (!userId) throw new Error("A citizen identifier is required.");
  switch (kind) {
    case "request": {
      const request = await prisma.serviceRequest.findFirst({
        where: { id, authorId: userId },
        include: { history: { orderBy: { createdAt: "asc" } } },
      });
      return request ? { ...request, kind, title: request.subject, steps: request.history, hasHistory: true } : null;
    }
    case "report": {
      const report = await prisma.report.findFirst({
        where: { id, authorId: userId },
        include: { events: { orderBy: { createdAt: "asc" } } },
      });
      return report ? { ...report, kind, steps: report.events, hasHistory: true } : null;
    }
    case "order": {
      const order = await prisma.order.findFirst({ where: { id, customerId: userId } });
      return order ? { ...order, kind, title: order.summary, steps: [], hasHistory: false } : null;
    }
    case "appointment": {
      const appointment = await prisma.appointment.findFirst({
        where: { id, citizenId: userId },
        include: { service: { select: { name: true } } },
      });
      return appointment ? {
        ...appointment, kind, title: appointment.service.name, description: appointment.subject,
        scheduledAt: appointment.date, steps: [], hasHistory: false,
      } : null;
    }
    case "contact": {
      const contact = await prisma.contactMessage.findFirst({ where: { id, authorId: userId } });
      return contact ? { ...contact, kind, title: contact.subject, description: contact.body, steps: [], hasHistory: false } : null;
    }
    default:
      return null;
  }
}

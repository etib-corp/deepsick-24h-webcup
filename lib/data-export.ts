import "server-only";

import { prisma } from "@/lib/prisma";
import type { Dictionary } from "@/lib/i18n/types";

const iso = (date: Date | null | undefined): string | null => (date ? date.toISOString() : null);

function label(map: Record<string, string>, key: string | null | undefined): string | null {
  if (!key) return null;
  return map[key] ?? key;
}

const statusMaps = (t: Dictionary) => ({
  request: t.requestStatus as Record<string, string>,
  report: t.reportStatus as Record<string, string>,
  order: t.orderStatus as Record<string, string>,
  appointment: t.appointmentStatus as Record<string, string>,
  contact: t.citizen.tracking.contactStatus as Record<string, string>,
});

export type DataExportSection = { key: string; label: string; count: number };

function sectionDefs(t: Dictionary): { key: string; label: string }[] {
  const s = t.citizen.account.export.sections;
  return [
    { key: "requests", label: s.requests },
    { key: "reports", label: s.reports },
    { key: "orders", label: s.orders },
    { key: "appointments", label: s.appointments },
    { key: "opinions", label: s.opinions },
    { key: "contactMessages", label: s.contactMessages },
    { key: "wallet", label: s.wallet },
    { key: "notifications", label: s.notifications },
    { key: "messages", label: s.messages },
  ];
}

/** Lightweight per-section counts for the account page summary. */
export async function getCitizenDataCounts(userId: string, t: Dictionary): Promise<DataExportSection[]> {
  const [requests, reports, orders, appointments, opinions, contactMessages, wallet, notifications, messages] =
    await Promise.all([
      prisma.serviceRequest.count({ where: { authorId: userId } }),
      prisma.report.count({ where: { authorId: userId } }),
      prisma.order.count({ where: { customerId: userId } }),
      prisma.appointment.count({ where: { citizenId: userId } }),
      prisma.opinion.count({ where: { authorId: userId } }),
      prisma.contactMessage.count({ where: { authorId: userId } }),
      prisma.walletTransaction.count({ where: { userId } }),
      prisma.notification.count({ where: { userId } }),
      prisma.message.count({ where: { senderId: userId } }),
    ]);
  const counts: Record<string, number> = {
    requests,
    reports,
    orders,
    appointments,
    opinions,
    contactMessages,
    wallet,
    notifications,
    messages,
  };
  return sectionDefs(t).map((def) => ({ ...def, count: counts[def.key] ?? 0 }));
}

/**
 * Assembles the citizen's full personal-data export. Scoped to `userId` only;
 * uses human references and localized labels, and ISO dates — never database
 * identifiers, and never another user's data.
 */
export async function buildCitizenDataExport(userId: string, t: Dictionary) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error("USER_NOT_FOUND");

  const [requests, reports, orders, appointments, opinions, contacts, transactions, notifications, messages] =
    await Promise.all([
      prisma.serviceRequest.findMany({
        where: { authorId: userId },
        orderBy: { createdAt: "desc" },
        include: { history: { orderBy: { createdAt: "asc" } } },
      }),
      prisma.report.findMany({
        where: { authorId: userId },
        orderBy: { createdAt: "desc" },
        include: { events: { orderBy: { createdAt: "asc" } } },
      }),
      prisma.order.findMany({ where: { customerId: userId }, orderBy: { createdAt: "desc" } }),
      prisma.appointment.findMany({
        where: { citizenId: userId },
        orderBy: { date: "desc" },
        include: { service: { select: { name: true } } },
      }),
      prisma.opinion.findMany({
        where: { authorId: userId },
        orderBy: { createdAt: "desc" },
        include: { consultation: { select: { title: true } } },
      }),
      prisma.contactMessage.findMany({ where: { authorId: userId }, orderBy: { createdAt: "desc" } }),
      prisma.walletTransaction.findMany({ where: { userId }, orderBy: { createdAt: "desc" } }),
      prisma.notification.findMany({ where: { userId }, orderBy: { createdAt: "desc" } }),
      prisma.message.findMany({ where: { senderId: userId }, orderBy: { createdAt: "desc" } }),
    ]);

  const status = statusMaps(t);

  const data = {
    requests: requests.map((request) => ({
      reference: request.reference,
      subject: request.subject,
      description: request.description,
      category: request.category,
      priority: label(t.requestPriority as Record<string, string>, request.priority),
      status: label(status.request, request.status),
      createdAt: iso(request.createdAt),
      updatedAt: iso(request.updatedAt),
      history: request.history.map((event) => ({
        status: label(status.request, event.status),
        note: event.note,
        at: iso(event.createdAt),
      })),
    })),
    reports: reports.map((report) => ({
      reference: report.reference,
      type: label(t.reportType as Record<string, string>, report.type),
      title: report.title,
      description: report.description,
      priority: label(t.reportPriority as Record<string, string>, report.priority),
      status: label(status.report, report.status),
      sector: report.sector,
      createdAt: iso(report.createdAt),
      updatedAt: iso(report.updatedAt),
      events: report.events.map((event) => ({
        status: label(status.report, event.status),
        note: event.note,
        at: iso(event.createdAt),
      })),
    })),
    orders: orders.map((order) => ({
      reference: order.reference,
      type: label(t.orderType as Record<string, string>, order.type),
      status: label(status.order, order.status),
      summary: order.summary,
      total: order.total,
      origin: order.origin,
      destination: order.destination,
      etaMinutes: order.etaMinutes,
      createdAt: iso(order.createdAt),
      updatedAt: iso(order.updatedAt),
    })),
    appointments: appointments.map((appointment) => ({
      reference: appointment.reference,
      service: appointment.service?.name ?? null,
      subject: appointment.subject,
      status: label(status.appointment, appointment.status),
      sector: appointment.sector,
      date: iso(appointment.date),
      durationMinutes: appointment.durationMinutes,
      createdAt: iso(appointment.createdAt),
    })),
    opinions: opinions.map((opinion) => ({
      reference: opinion.reference,
      consultation: opinion.consultation?.title ?? null,
      stance: label(t.citizen.consultations.stance as Record<string, string>, opinion.stance),
      comment: opinion.comment,
      createdAt: iso(opinion.createdAt),
      updatedAt: iso(opinion.updatedAt),
    })),
    contactMessages: contacts.map((message) => ({
      reference: message.reference,
      subject: message.subject,
      body: message.body,
      status: label(status.contact, message.status),
      createdAt: iso(message.createdAt),
    })),
    wallet: transactions.map((transaction) => ({
      label: transaction.label,
      amount: transaction.amount,
      at: iso(transaction.createdAt),
    })),
    notifications: notifications.map((notification) => ({
      title: notification.title,
      body: notification.body,
      href: notification.href,
      read: notification.read,
      at: iso(notification.createdAt),
    })),
    messages: messages.map((message) => ({
      channel: message.channel,
      content: message.content,
      at: iso(message.createdAt),
    })),
  };

  const sections = sectionDefs(t).map((def) => ({
    ...def,
    count: (data[def.key as keyof typeof data] as unknown[]).length,
  }));

  return {
    generatedAt: new Date().toISOString(),
    profile: {
      name: user.name,
      email: user.email,
      role: label(t.roles as Record<string, string>, user.role),
      sector: user.sector,
      balance: user.balance,
      registeredAt: iso(user.createdAt),
    },
    manifest: {
      sections,
      totalRecords: sections.reduce((sum, section) => sum + section.count, 0),
    },
    data,
  };
}

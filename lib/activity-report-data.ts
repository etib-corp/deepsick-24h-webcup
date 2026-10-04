import "server-only";

import { reportWindow, type ActivityMetricInput } from "@/lib/activity-report";
import { prisma } from "@/lib/prisma";
import { ACTIONABLE_STATUSES, REPORT_ACTIONABLE } from "@/lib/roles";
import { getAlertStats } from "@/lib/sentinel";

/**
 * F103 — data layer for the synthetic activity report.
 *
 * Aggregated only: period-scoped counts per domain plus a short list of items
 * needing attention. No raw rows and no personal data cross this boundary.
 */

export type AttentionItem = { key: string; count: number; href: string };

export type ActivityReportData = {
  metrics: ActivityMetricInput[];
  attention: AttentionItem[];
};

export async function getActivityReportData({
  days,
  now = new Date(),
}: {
  days: number;
  now?: Date;
}): Promise<ActivityReportData> {
  const { currentStart, previousStart } = reportWindow(days, now);
  const current = { gte: currentStart, lte: now };
  const previous = { gte: previousStart, lt: currentStart };

  const [
    requestsC,
    requestsP,
    reportsC,
    reportsP,
    servicesC,
    servicesP,
    announcementsC,
    announcementsP,
    accountsC,
    accountsP,
    appointmentsC,
    appointmentsP,
    ordersC,
    ordersP,
    contactsC,
    contactsP,
    opinionsC,
    opinionsP,
  ] = await Promise.all([
    prisma.serviceRequest.count({ where: { createdAt: current } }),
    prisma.serviceRequest.count({ where: { createdAt: previous } }),
    prisma.report.count({ where: { createdAt: current } }),
    prisma.report.count({ where: { createdAt: previous } }),
    prisma.municipalService.count({ where: { createdAt: current } }),
    prisma.municipalService.count({ where: { createdAt: previous } }),
    prisma.announcement.count({ where: { createdAt: current } }),
    prisma.announcement.count({ where: { createdAt: previous } }),
    prisma.user.count({ where: { createdAt: current } }),
    prisma.user.count({ where: { createdAt: previous } }),
    prisma.appointment.count({ where: { createdAt: current } }),
    prisma.appointment.count({ where: { createdAt: previous } }),
    prisma.order.count({ where: { createdAt: current } }),
    prisma.order.count({ where: { createdAt: previous } }),
    prisma.contactMessage.count({ where: { createdAt: current } }),
    prisma.contactMessage.count({ where: { createdAt: previous } }),
    prisma.opinion.count({ where: { createdAt: current } }),
    prisma.opinion.count({ where: { createdAt: previous } }),
  ]);

  const metrics: ActivityMetricInput[] = [
    { key: "requests", current: requestsC, previous: requestsP },
    { key: "reports", current: reportsC, previous: reportsP },
    { key: "services", current: servicesC, previous: servicesP },
    { key: "announcements", current: announcementsC, previous: announcementsP },
    { key: "accounts", current: accountsC, previous: accountsP },
    { key: "appointments", current: appointmentsC, previous: appointmentsP },
    { key: "orders", current: ordersC, previous: ordersP },
    { key: "contacts", current: contactsC, previous: contactsP },
    { key: "opinions", current: opinionsC, previous: opinionsP },
  ];

  const [
    actionableRequests,
    openReports,
    disabledServices,
    announcementsWithoutDate,
    appointmentsOnDisabledService,
    blockedSignIns,
    deniedAccess,
    alertStats,
  ] = await Promise.all([
    prisma.serviceRequest.count({ where: { status: { in: [...ACTIONABLE_STATUSES] } } }),
    prisma.report.count({ where: { status: { in: [...REPORT_ACTIONABLE] } } }),
    prisma.municipalService.count({ where: { published: false } }),
    prisma.announcement.count({ where: { published: true, publishedAt: null } }),
    prisma.appointment.count({ where: { status: "BOOKED", service: { published: false } } }),
    prisma.securityEvent.count({ where: { type: "LOGIN_BLOCKED", createdAt: current } }),
    prisma.securityEvent.count({ where: { type: "ACCESS_DENIED", createdAt: current } }),
    getAlertStats(),
  ]);

  const attention: AttentionItem[] = [
    { key: "actionableRequests", count: actionableRequests, href: "/operations/administration" },
    { key: "openReports", count: openReports, href: "/operations/security" },
    { key: "disabledServices", count: disabledServices, href: "/council/services" },
    {
      key: "announcementsWithoutDate",
      count: announcementsWithoutDate,
      href: "/council/announcements",
    },
    {
      key: "appointmentsOnDisabledService",
      count: appointmentsOnDisabledService,
      href: "/council/services",
    },
    { key: "criticalAlerts", count: alertStats.critical, href: "/operations/security" },
    { key: "blockedSignIns", count: blockedSignIns, href: "/council/security" },
    { key: "deniedAccess", count: deniedAccess, href: "/council/security" },
  ].filter((item) => item.count > 0);

  return { metrics, attention };
}

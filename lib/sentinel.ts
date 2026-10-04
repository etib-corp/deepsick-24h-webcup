import "server-only";

import {
  detectBaselineSpikes,
  detectBursts,
  detectInconsistencies,
  sentinelConfig,
  type DetectedAlert,
  type SecurityEventLike,
} from "@/lib/anomaly";
import { prisma } from "@/lib/prisma";
import { recordSecurityEvent } from "@/lib/security";

/**
 * F85 — sentinel orchestration.
 *
 * Runs the pure detectors over the live `SecurityEvent` trail + a few records,
 * then persists graded, deduplicated `SecurityAlert` rows. Every run is a
 * best-effort observation that must never break the request it rides on, and
 * it never blocks or locks a user (normal use stays untouched).
 */

/** Minimum delay between two scans on the same instance (consoles poll every 5 s). */
const SCAN_INTERVAL_MS = 8_000;
let lastScanAt = 0;

export type ScanSummary = {
  ran: boolean;
  created: number;
  reopened: number;
  resolved: number;
};

export async function runSecurityScan(options?: {
  force?: boolean;
  now?: Date;
}): Promise<ScanSummary> {
  const now = options?.now ?? new Date();
  if (!options?.force && now.getTime() - lastScanAt < SCAN_INTERVAL_MS) {
    return { ran: false, created: 0, reopened: 0, resolved: 0 };
  }
  lastScanAt = now.getTime();

  try {
    const config = sentinelConfig();
    const since = new Date(now.getTime() - 49 * 60 * 60 * 1000);

    const [events, requestRows, reportRows, appointmentRows, announcementRows] = await Promise.all([
      prisma.securityEvent.findMany({
        where: { createdAt: { gte: since } },
        select: { type: true, ip: true, actorId: true, createdAt: true },
        orderBy: { createdAt: "desc" },
        take: 5000,
      }),
      prisma.serviceRequest.findMany({
        take: 200,
        orderBy: { updatedAt: "desc" },
        select: {
          id: true,
          reference: true,
          status: true,
          history: { orderBy: { createdAt: "desc" }, take: 1, select: { status: true } },
        },
      }),
      prisma.report.findMany({
        take: 200,
        orderBy: { updatedAt: "desc" },
        select: {
          id: true,
          reference: true,
          status: true,
          events: { orderBy: { createdAt: "desc" }, take: 1, select: { status: true } },
        },
      }),
      prisma.appointment.findMany({
        where: { status: "BOOKED" },
        take: 200,
        select: { id: true, reference: true, service: { select: { name: true, published: true } } },
      }),
      prisma.announcement.findMany({
        where: { published: true, publishedAt: null },
        take: 200,
        select: { id: true, slug: true },
      }),
    ]);

    const detected: DetectedAlert[] = [
      ...detectBursts(events as SecurityEventLike[], now, config),
      ...detectBaselineSpikes(events as SecurityEventLike[], now, config),
      ...detectInconsistencies({
        requestMismatches: requestRows
          .filter((row) => row.history[0] && row.history[0].status !== row.status)
          .map((row) => ({
            id: row.id,
            reference: row.reference,
            status: row.status,
            timelineStatus: row.history[0]!.status,
          })),
        reportMismatches: reportRows
          .filter((row) => row.events[0] && row.events[0].status !== row.status)
          .map((row) => ({
            id: row.id,
            reference: row.reference,
            status: row.status,
            timelineStatus: row.events[0]!.status,
          })),
        appointmentsOnDisabledService: appointmentRows
          .filter((row) => row.service?.published === false)
          .map((row) => ({ id: row.id, reference: row.reference, serviceName: row.service!.name })),
        announcementsWithoutDate: announcementRows.map((row) => ({ id: row.id, slug: row.slug })),
      }),
    ];

    const current = new Map(detected.map((alert) => [alert.fingerprint, alert]));
    const known = await prisma.securityAlert.findMany({
      where: { fingerprint: { in: [...current.keys()] } },
      select: { fingerprint: true, status: true },
    });
    const knownStatus = new Map(known.map((row) => [row.fingerprint, row.status]));

    let created = 0;
    let reopened = 0;
    const newlyCritical: DetectedAlert[] = [];

    for (const alert of detected) {
      const prior = knownStatus.get(alert.fingerprint);
      if (!prior) {
        await prisma.securityAlert.create({
          data: {
            fingerprint: alert.fingerprint,
            kind: alert.kind,
            rule: alert.rule,
            severity: alert.severity,
            status: "OPEN",
            title: alert.rule,
            detail: alert.detail,
            sourceType: alert.sourceType,
            sourceId: alert.sourceId,
            detectedAt: now,
          },
        });
        created += 1;
        if (alert.severity === "CRITICAL") newlyCritical.push(alert);
      } else {
        const reopen = prior === "RESOLVED";
        await prisma.securityAlert.update({
          where: { fingerprint: alert.fingerprint },
          data: {
            severity: alert.severity,
            detail: alert.detail,
            detectedAt: now,
            ...(reopen ? { status: "OPEN", reviewedById: null, reviewedAt: null } : {}),
          },
        });
        if (reopen) {
          reopened += 1;
          if (alert.severity === "CRITICAL") newlyCritical.push(alert);
        }
      }
    }

    const resolved = await prisma.securityAlert.updateMany({
      where: { status: "OPEN", fingerprint: { notIn: [...current.keys()] } },
      data: { status: "RESOLVED", reviewedAt: now },
    });

    for (const alert of detected) {
      if (knownStatus.has(alert.fingerprint)) continue;
      await recordSecurityEvent({
        type: "ANOMALY_DETECTED",
        outcome: "FLAGGED",
        actorRole: "SYSTEM",
        detail: `${alert.rule} · ${alert.detail}`,
        targetType: alert.sourceType,
        targetId: alert.sourceId,
      });
    }

    if (newlyCritical.length > 0) await notifySecurityTeam(newlyCritical);

    return { ran: true, created, reopened, resolved: resolved.count };
  } catch {
    return { ran: false, created: 0, reopened: 0, resolved: 0 };
  }
}

/**
 * Notifies the authorised profiles about critical detections. Best-effort; the
 * link targets the security station, reachable by both COUNCIL and SECURITY.
 */
async function notifySecurityTeam(alerts: DetectedAlert[]): Promise<void> {
  try {
    const recipients = await prisma.user.findMany({
      where: { role: { in: ["COUNCIL", "SECURITY"] } },
      select: { id: true },
    });
    if (recipients.length === 0) return;

    const title =
      alerts.length === 1
        ? `Alerte sécurité · ${alerts[0].rule}`
        : `${alerts.length} alertes de sécurité critiques`;
    const body = alerts.map((alert) => alert.detail).join(" · ").slice(0, 2000);

    await prisma.notification.createMany({
      data: recipients.map((user) => ({
        userId: user.id,
        title,
        body,
        href: "/operations/security",
      })),
    });
  } catch {
    // Never let a notification failure break the scan.
  }
}

/* ------------------------------------------------------------------ *
 * Reading & reviewing alerts
 * ------------------------------------------------------------------ */

export function getSecurityAlerts(limit = 60) {
  return prisma.securityAlert.findMany({
    orderBy: { detectedAt: "desc" },
    take: limit,
  });
}

export async function getAlertStats() {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const [open, critical, resolvedToday, detectedToday] = await Promise.all([
    prisma.securityAlert.count({ where: { status: "OPEN" } }),
    prisma.securityAlert.count({ where: { status: "OPEN", severity: "CRITICAL" } }),
    prisma.securityAlert.count({ where: { status: "RESOLVED", detectedAt: { gte: since } } }),
    prisma.securityAlert.count({ where: { detectedAt: { gte: since } } }),
  ]);
  return { open, critical, resolvedToday, detectedToday };
}

export async function reviewSecurityAlert(
  id: string,
  status: "REVIEWED" | "RESOLVED",
  reviewerId: string,
) {
  return prisma.securityAlert.update({
    where: { id },
    data: { status, reviewedById: reviewerId, reviewedAt: new Date() },
  });
}

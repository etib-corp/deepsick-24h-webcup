import "server-only";

import type { Session } from "next-auth";
import { headers } from "next/headers";

import { prisma } from "@/lib/prisma";
import { findDangerousFields } from "@/lib/sanitize";

/**
 * Security audit trail (F69).
 *
 * Sensitive operations — authentication failures/blocks, access denials,
 * privilege and content changes, workflow transitions, case files and
 * neutralised payloads — are appended to `SecurityEvent` so the High Council
 * can analyse incidents after the fact. Writing an audit row must never break
 * the request it observes, so every failure here is swallowed.
 */

export const SECURITY_EVENT_TYPES = [
  "LOGIN_FAILED",
  "LOGIN_BLOCKED",
  "ACCESS_DENIED",
  "ROLE_CHANGED",
  "CONTENT_CHANGED",
  "REQUEST_STATUS_CHANGED",
  "REPORT_STATUS_CHANGED",
  "ORDER_STATUS_CHANGED",
  "RECORD_ASSIGNED",
  "CASE_FILED",
  "INPUT_NEUTRALIZED",
] as const;
export type SecurityEventType = (typeof SECURITY_EVENT_TYPES)[number];

export const SECURITY_OUTCOMES = ["INFO", "SUCCESS", "DENIED", "FLAGGED"] as const;
export type SecurityOutcome = (typeof SECURITY_OUTCOMES)[number];

export function isSecurityEventType(value: unknown): value is SecurityEventType {
  return typeof value === "string" && (SECURITY_EVENT_TYPES as readonly string[]).includes(value);
}

export function isSecurityOutcome(value: unknown): value is SecurityOutcome {
  return typeof value === "string" && (SECURITY_OUTCOMES as readonly string[]).includes(value);
}

/** Session-derived columns shared by every audit row. */
export function auditActor(session: Session | null | undefined) {
  return { actorId: session?.user?.id ?? null, actorRole: session?.user?.role ?? null };
}

export type SecurityAuditInput = {
  type: SecurityEventType;
  outcome?: SecurityOutcome;
  actorId?: string | null;
  actorRole?: string | null;
  targetType?: string | null;
  targetId?: string | null;
  detail?: string | null;
  ip?: string | null;
  userAgent?: string | null;
};

/** Best-effort client information from the proxy headers. */
function readRequestContext(): { ip: string | null; userAgent: string | null } {
  try {
    const value = headers();
    const forwarded = value.get("x-forwarded-for");
    const ip = (forwarded ? forwarded.split(",")[0] : value.get("x-real-ip"))?.trim();
    return {
      ip: ip || null,
      userAgent: value.get("user-agent")?.slice(0, 255) ?? null,
    };
  } catch {
    // Called outside a request scope (tests, scripts) — no source info.
    return { ip: null, userAgent: null };
  }
}

/** Appends one audit row. Never throws. */
export async function recordSecurityEvent(input: SecurityAuditInput): Promise<void> {
  try {
    const context = readRequestContext();
    await prisma.securityEvent.create({
      data: {
        type: input.type,
        outcome: input.outcome ?? "INFO",
        actorId: input.actorId ?? null,
        actorRole: input.actorRole ?? null,
        targetType: input.targetType ?? null,
        targetId: input.targetId ?? null,
        detail: input.detail?.slice(0, 2000) ?? null,
        ip: input.ip ?? context.ip,
        userAgent: input.userAgent ?? context.userAgent,
      },
    });
  } catch {
    // The audit trail must never break the request it observes.
  }
}

/**
 * Records one `INPUT_NEUTRALIZED` event when raw form values contained markup,
 * control characters or executable URL schemes. The values themselves are not
 * stored — only the context and the field names.
 */
export async function auditNeutralizedInputs(
  fields: Record<string, unknown>,
  context: string,
  session?: Session | null,
  target?: { targetType?: string; targetId?: string },
): Promise<void> {
  const flagged = findDangerousFields(fields);
  if (flagged.length === 0) return;

  await recordSecurityEvent({
    type: "INPUT_NEUTRALIZED",
    outcome: "FLAGGED",
    ...auditActor(session),
    detail: `${context} · ${flagged.join(", ")}`,
    targetType: target?.targetType ?? null,
    targetId: target?.targetId ?? null,
  });
}

/* ------------------------------------------------------------------ *
 * Reading the trail (High Council security console)
 * ------------------------------------------------------------------ */

export function getSecurityEvents(limit = 60) {
  return prisma.securityEvent.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

/** Counts for the last 24 h, shown as tiles on the security console. */
export async function getSecurityStats() {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const [blocked, denied, neutralized, traced] = await Promise.all([
    prisma.securityEvent.count({
      where: { type: "LOGIN_BLOCKED", createdAt: { gte: since } },
    }),
    prisma.securityEvent.count({ where: { type: "ACCESS_DENIED", createdAt: { gte: since } } }),
    prisma.securityEvent.count({
      where: { type: "INPUT_NEUTRALIZED", createdAt: { gte: since } },
    }),
    prisma.securityEvent.count({
      where: { outcome: { in: ["INFO", "SUCCESS"] }, createdAt: { gte: since } },
    }),
  ]);
  return { blocked, denied, neutralized, traced };
}

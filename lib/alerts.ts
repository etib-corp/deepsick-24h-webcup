/**
 * F101 — colony incident alerts (power outage, water cut, …).
 *
 * An alert carries the situation and the instructions residents must follow,
 * targets a sector (null = whole colony) and stays live until resolved or
 * until its optional start time has passed. Pure helpers, unit-tested.
 */

export const ALERT_SEVERITIES = ["ADVISORY", "WARNING", "CRITICAL"] as const;
export type AlertSeverity = (typeof ALERT_SEVERITIES)[number];

export function isAlertSeverity(value: unknown): value is AlertSeverity {
  return typeof value === "string" && (ALERT_SEVERITIES as readonly string[]).includes(value);
}

/** Most severe first. */
export const ALERT_SEVERITY_RANK: Record<AlertSeverity, number> = {
  CRITICAL: 0,
  WARNING: 1,
  ADVISORY: 2,
};

export type AlertWindow = {
  status: string;
  startsAt: Date | null;
};

/** An alert is live while it is ACTIVE and its optional start time has passed. */
export function isAlertLive(alert: AlertWindow, now: Date = new Date()): boolean {
  if (alert.status !== "ACTIVE") return false;
  if (alert.startsAt && alert.startsAt.getTime() > now.getTime()) return false;
  return true;
}

/** Orders alerts: most severe first, then most recent first. */
export function sortAlertsBySeverity<
  T extends { severity: string; startsAt: Date | null; createdAt: Date },
>(alerts: readonly T[]): T[] {
  return [...alerts].sort((a, b) => {
    const rankA = isAlertSeverity(a.severity) ? ALERT_SEVERITY_RANK[a.severity] : 9;
    const rankB = isAlertSeverity(b.severity) ? ALERT_SEVERITY_RANK[b.severity] : 9;
    if (rankA !== rankB) return rankA - rankB;
    const timeA = (a.startsAt ?? a.createdAt).getTime();
    const timeB = (b.startsAt ?? b.createdAt).getTime();
    return timeB - timeA;
  });
}

/** Splits a free-text instruction block into readable steps (one per line). */
export function instructionSteps(instructions: string): string[] {
  return instructions
    .split(/\r?\n/)
    .map((line) => line.replace(/^[-•*]\s*/, "").trim())
    .filter((line) => line.length > 0);
}

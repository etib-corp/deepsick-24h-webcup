/**
 * F85 — automatic anomaly & integrity detection (pure, dependency-free).
 *
 * The sentinel reads the append-only `SecurityEvent` trail and a handful of
 * records, then flags two families of signals:
 *  - ANOMALY: unusual activity — short bursts of hostile events per IP/actor,
 *    or an hourly volume that deviates from the recent baseline (z-score).
 *  - INCONSISTENCY: records whose stored state disagrees with their timeline.
 *
 * Everything here is deterministic and side-effect free so it can be unit
 * tested without a database. The server orchestration lives in `lib/sentinel.ts`.
 */

/** Event types that carry a security signal worth spiking on. */
export const SENTINEL_EVENT_TYPES = [
  "LOGIN_FAILED",
  "LOGIN_BLOCKED",
  "ACCESS_DENIED",
  "FORM_BLOCKED",
  "INPUT_NEUTRALIZED",
  "ROLE_CHANGED",
] as const;

/** Types where a burst is directly hostile (higher severity). */
export const BURST_EVENT_TYPES = [
  "LOGIN_FAILED",
  "LOGIN_BLOCKED",
  "ACCESS_DENIED",
  "FORM_BLOCKED",
] as const;

export type SentinelSeverity = "WARNING" | "CRITICAL";
export type AlertKind = "ANOMALY" | "INCONSISTENCY";

export type DetectedAlert = {
  fingerprint: string;
  kind: AlertKind;
  rule: string;
  severity: SentinelSeverity;
  detail: string;
  sourceType: string | null;
  sourceId: string | null;
};

export type SecurityEventLike = {
  type: string;
  ip: string | null;
  actorId: string | null;
  createdAt: Date;
};

export type SentinelConfig = {
  windowMinutes: number;
  burstThreshold: number;
  zscoreThreshold: number;
  minSamples: number;
};

function positiveInt(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
}

/** Env-overridable thresholds (safe defaults for a small colony). */
export function sentinelConfig(env: NodeJS.ProcessEnv = process.env): SentinelConfig {
  return {
    windowMinutes: positiveInt(env.SENTINEL_WINDOW_MINUTES, 10),
    burstThreshold: positiveInt(env.SENTINEL_BURST_THRESHOLD, 10),
    zscoreThreshold: positiveInt(env.SENTINEL_ZSCORE_THRESHOLD, 4),
    minSamples: positiveInt(env.SENTINEL_MIN_SAMPLES, 3),
  };
}

/** Short bursts of a hostile event for the same IP or the same actor. */
export function detectBursts(
  events: SecurityEventLike[],
  now: Date,
  config: SentinelConfig,
): DetectedAlert[] {
  const since = now.getTime() - config.windowMinutes * 60_000;
  const recent = events.filter((event) => event.createdAt.getTime() >= since);
  const alerts: DetectedAlert[] = [];

  for (const type of BURST_EVENT_TYPES) {
    const dimensions = [
      { key: "ip" as const, pick: (event: SecurityEventLike) => event.ip },
      { key: "actor" as const, pick: (event: SecurityEventLike) => event.actorId },
    ];

    for (const dimension of dimensions) {
      const groups = new Map<string, number>();
      for (const event of recent) {
        if (event.type !== type) continue;
        const key = dimension.pick(event);
        if (!key) continue;
        groups.set(key, (groups.get(key) ?? 0) + 1);
      }

      for (const [key, count] of groups) {
        if (count < config.burstThreshold) continue;
        alerts.push({
          fingerprint: `ANOMALY:BURST_${type}:${dimension.key}:${key}`,
          kind: "ANOMALY",
          rule: `BURST_${type}`,
          severity: count >= config.burstThreshold * 2 ? "CRITICAL" : "WARNING",
          detail: `${count} × ${type} · ${config.windowMinutes} min · ${dimension.key}`,
          sourceType: dimension.key,
          sourceId: key,
        });
      }
    }
  }

  return alerts;
}

const HOUR_MS = 60 * 60 * 1000;

function hourKey(date: Date): number {
  return Math.floor(date.getTime() / HOUR_MS);
}

/**
 * Flags an hourly volume that deviates from the recent baseline (mean + k·σ).
 * Only completed baseline hours are compared, so the signal cannot poison
 * itself; sparse types are ignored via `minSamples`.
 */
export function detectBaselineSpikes(
  events: SecurityEventLike[],
  now: Date,
  config: SentinelConfig,
): DetectedAlert[] {
  const currentHour = hourKey(now);
  const alerts: DetectedAlert[] = [];

  for (const type of SENTINEL_EVENT_TYPES) {
    const buckets = new Map<number, number>();
    for (const event of events) {
      if (event.type !== type) continue;
      const key = hourKey(event.createdAt);
      if (key === currentHour) continue;
      buckets.set(key, (buckets.get(key) ?? 0) + 1);
    }

    const samples = [...buckets.values()];
    if (samples.length < config.minSamples) continue;

    const mean = samples.reduce((sum, value) => sum + value, 0) / samples.length;
    const variance =
      samples.reduce((sum, value) => sum + (value - mean) ** 2, 0) / samples.length;
    const std = Math.max(Math.sqrt(variance), 1);

    const current = events.filter(
      (event) => event.type === type && hourKey(event.createdAt) === currentHour,
    ).length;

    if (current < config.burstThreshold) continue;

    const zscore = (current - mean) / std;
    if (zscore < config.zscoreThreshold) continue;

    alerts.push({
      fingerprint: `ANOMALY:SPIKE_${type}:bucket:${currentHour}`,
      kind: "ANOMALY",
      rule: `SPIKE_${type}`,
      severity: zscore >= config.zscoreThreshold * 2 ? "CRITICAL" : "WARNING",
      detail: `${current} in the hour vs μ ${mean.toFixed(1)} (z ${zscore.toFixed(1)})`,
      sourceType: "bucket",
      sourceId: String(currentHour),
    });
  }

  return alerts;
}

export type ConsistencyInput = {
  /** Requests whose stored status disagrees with their latest timeline event. */
  requestMismatches: { id: string; reference: string; status: string; timelineStatus: string }[];
  reportMismatches: { id: string; reference: string; status: string; timelineStatus: string }[];
  /** BOOKED appointments whose service is currently disabled. */
  appointmentsOnDisabledService: { id: string; reference: string; serviceName: string }[];
  /** Published announcements with no publication date. */
  announcementsWithoutDate: { id: string; slug: string }[];
};

/** Records whose stored state contradicts their timeline / availability. */
export function detectInconsistencies(input: ConsistencyInput): DetectedAlert[] {
  const alerts: DetectedAlert[] = [];

  for (const item of input.requestMismatches) {
    alerts.push({
      fingerprint: `INCONSISTENCY:REQUEST_STATUS_MISMATCH:request:${item.id}`,
      kind: "INCONSISTENCY",
      rule: "REQUEST_STATUS_MISMATCH",
      severity: "WARNING",
      detail: `${item.reference}: ${item.status} ≠ timeline ${item.timelineStatus}`,
      sourceType: "request",
      sourceId: item.id,
    });
  }

  for (const item of input.reportMismatches) {
    alerts.push({
      fingerprint: `INCONSISTENCY:REPORT_STATUS_MISMATCH:report:${item.id}`,
      kind: "INCONSISTENCY",
      rule: "REPORT_STATUS_MISMATCH",
      severity: "WARNING",
      detail: `${item.reference}: ${item.status} ≠ timeline ${item.timelineStatus}`,
      sourceType: "report",
      sourceId: item.id,
    });
  }

  for (const item of input.appointmentsOnDisabledService) {
    alerts.push({
      fingerprint: `INCONSISTENCY:ACTIVE_APPOINTMENT_ON_DISABLED_SERVICE:appointment:${item.id}`,
      kind: "INCONSISTENCY",
      rule: "ACTIVE_APPOINTMENT_ON_DISABLED_SERVICE",
      severity: "WARNING",
      detail: `${item.reference} → ${item.serviceName}`,
      sourceType: "appointment",
      sourceId: item.id,
    });
  }

  for (const item of input.announcementsWithoutDate) {
    alerts.push({
      fingerprint: `INCONSISTENCY:ANNOUNCEMENT_PUBLISHED_WITHOUT_DATE:announcement:${item.id}`,
      kind: "INCONSISTENCY",
      rule: "ANNOUNCEMENT_PUBLISHED_WITHOUT_DATE",
      severity: "WARNING",
      detail: item.slug,
      sourceType: "announcement",
      sourceId: item.id,
    });
  }

  return alerts;
}

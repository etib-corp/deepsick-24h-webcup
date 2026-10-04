/**
 * F103 — "a synthetic report of the platform's activity for managers".
 *
 * The data layer scopes every domain to the current and previous period; this
 * module turns those aggregates into a readable report: per-domain trends,
 * the overall total and the period it covers. Pure and deterministic, so the
 * on-screen report and its CSV export agree exactly (same pattern as F98's
 * `lib/insights.ts`).
 */

import { startOfUtcDay } from "@/lib/insights";

export type ActivityMetricInput = { key: string; current: number; previous: number };

export type ActivityTrend = {
  key: string;
  current: number;
  previous: number;
  /** Percentage change vs the previous period; null when there was no baseline. */
  change: number | null;
};

export type ActivityReport = {
  days: number;
  /** First day of the current period (ISO date, UTC). */
  from: string;
  /** Last day of the current period (ISO date, UTC). */
  to: string;
  totals: { current: number; previous: number; change: number | null };
  trends: ActivityTrend[];
  generatedAt: string;
};

export const REPORT_DAY_OPTIONS = [7, 30, 90] as const;
export type ReportDays = (typeof REPORT_DAY_OPTIONS)[number];

export function isReportDays(value: unknown): value is ReportDays {
  return (REPORT_DAY_OPTIONS as readonly number[]).includes(Number(value));
}

/** Half-open windows: current `[currentStart, now]`, previous `[previousStart, currentStart)`. */
export function reportWindow(days: number, now: Date = new Date()) {
  const to = startOfUtcDay(now);
  const currentStart = new Date(to.getTime() - (days - 1) * 86_400_000);
  const previousStart = new Date(currentStart.getTime() - days * 86_400_000);
  return { currentStart, previousStart, currentEnd: now };
}

function changeTo(current: number, previous: number): number | null {
  return previous > 0 ? Math.round(((current - previous) / previous) * 100) : null;
}

const isoDay = (date: Date): string => date.toISOString().slice(0, 10);

/**
 * Builds the synthetic report. `metrics` arrive already scoped to the periods;
 * `days` drives the stated window; `now` is injectable for tests.
 */
export function buildActivityReport(
  metrics: readonly ActivityMetricInput[],
  { days, now = new Date() }: { days: number; now?: Date },
): ActivityReport {
  const { currentStart } = reportWindow(days, now);

  const trends: ActivityTrend[] = metrics.map((metric) => ({
    key: metric.key,
    current: metric.current,
    previous: metric.previous,
    change: changeTo(metric.current, metric.previous),
  }));

  const current = metrics.reduce((sum, metric) => sum + metric.current, 0);
  const previous = metrics.reduce((sum, metric) => sum + metric.previous, 0);

  return {
    days,
    from: isoDay(currentStart),
    to: isoDay(startOfUtcDay(now)),
    totals: { current, previous, change: changeTo(current, previous) },
    trends,
    generatedAt: now.toISOString(),
  };
}

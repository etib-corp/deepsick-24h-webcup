/**
 * F98 — "which services are used the most?".
 *
 * Usage is recorded as anonymous per-day counters (`ServiceVisit`, no user
 * identity). This module turns the raw counters into a readable report: the
 * share of each service, the comparison with the previous period and the
 * concentration line ("the top 3 services account for X %"). Pure and
 * deterministic, so the console and its CSV export agree exactly.
 */

export type VisitRow = { serviceId: string; day: Date; count: number };
export type ReportService = { id: string; name: string; slug: string };

export type UsageEntry = {
  serviceId: string;
  name: string;
  slug: string;
  count: number;
  previous: number;
  /** Percentage of the current period's consultations (0..100). */
  share: number;
  /** Percentage change vs the previous period; null when it was not used. */
  change: number | null;
};

export type UsageReport = {
  days: number;
  total: number;
  previousTotal: number;
  entries: UsageEntry[];
  /** Share of the top three services, as a percentage. */
  topShare: number;
};

/** UTC midnight of a date — the canonical day bucket of a visit counter. */
export function startOfUtcDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

export function buildUsageReport(
  rows: readonly VisitRow[],
  services: readonly ReportService[],
  { days, now = new Date() }: { days: number; now?: Date },
): UsageReport {
  const today = startOfUtcDay(now).getTime();
  const currentStart = today - (days - 1) * 86_400_000;
  const previousStart = currentStart - days * 86_400_000;

  const current = new Map<string, number>();
  const previous = new Map<string, number>();

  for (const row of rows) {
    const time = startOfUtcDay(row.day).getTime();
    const bucket = time >= currentStart ? current : time >= previousStart ? previous : null;
    if (!bucket) continue;
    bucket.set(row.serviceId, (bucket.get(row.serviceId) ?? 0) + row.count);
  }

  const total = [...current.values()].reduce((sum, value) => sum + value, 0);
  const previousTotal = [...previous.values()].reduce((sum, value) => sum + value, 0);
  const byId = new Map(services.map((service) => [service.id, service]));

  const entries: UsageEntry[] = [...new Set([...current.keys(), ...previous.keys()])]
    .map((serviceId) => {
      const service = byId.get(serviceId);
      const count = current.get(serviceId) ?? 0;
      const before = previous.get(serviceId) ?? 0;
      return {
        serviceId,
        name: service?.name ?? serviceId,
        slug: service?.slug ?? "",
        count,
        previous: before,
        share: total > 0 ? Math.round((count / total) * 100) : 0,
        change: before > 0 ? Math.round(((count - before) / before) * 100) : null,
      };
    })
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));

  const topShare = total > 0
    ? Math.round(((entries[0]?.count ?? 0) + (entries[1]?.count ?? 0) + (entries[2]?.count ?? 0)) / total * 100)
    : 0;

  return { days, total, previousTotal, entries, topShare };
}

"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { FeedRow, LiveBadge, SectionHeader } from "@/components/colony/FeedRow";
import { StatTile } from "@/components/colony/StatTile";
import { EmptyState } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { reviewAlertAction } from "@/lib/actions/security";
import { useT } from "@/lib/i18n/client";
import type { SecurityAlertDto } from "@/lib/serialize";

export type SecurityAlertView = SecurityAlertDto & { detectedLabel: string };

type Filter = "ALL" | "OPEN" | "CRITICAL" | "RESOLVED";

const SEVERITY_TONES: Record<string, "info" | "warning" | "danger"> = {
  INFO: "info",
  WARNING: "warning",
  CRITICAL: "danger",
};

const STATUS_TONES: Record<string, "info" | "warning" | "success"> = {
  OPEN: "warning",
  REVIEWED: "info",
  RESOLVED: "success",
};

/**
 * F85 — live security-alert board. Mirrors the incident console's 5 s
 * `router.refresh()` polling so detections surface as the platform is used.
 */
export function SecurityAlertBoard({
  alerts,
  stats,
}: {
  alerts: SecurityAlertView[];
  stats: { open: number; critical: number; resolvedToday: number; detectedToday: number };
}) {
  const t = useT();
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>("OPEN");
  const [refreshing, startRefresh] = useTransition();
  const refreshPending = useRef(false);

  useEffect(() => {
    if (!refreshing) refreshPending.current = false;
  }, [refreshing]);

  useEffect(() => {
    const refresh = () => {
      if (refreshPending.current || document.visibilityState === "hidden" || !navigator.onLine) {
        return;
      }
      refreshPending.current = true;
      startRefresh(() => router.refresh());
    };
    const interval = window.setInterval(refresh, 5000);
    document.addEventListener("visibilitychange", refresh);
    window.addEventListener("online", refresh);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", refresh);
      window.removeEventListener("online", refresh);
    };
  }, [router]);

  const copy = t.council.security.alerts;
  const rules = copy.rules as Record<string, string>;
  const severities = copy.severities as Record<string, string>;
  const statuses = copy.statuses as Record<string, string>;

  const filters: { key: Filter; label: string }[] = [
    { key: "OPEN", label: copy.filters.open },
    { key: "CRITICAL", label: copy.filters.critical },
    { key: "RESOLVED", label: copy.filters.resolved },
    { key: "ALL", label: copy.filters.all },
  ];

  const visible = useMemo(
    () =>
      alerts.filter((alert) => {
        if (filter === "OPEN") return alert.status === "OPEN";
        if (filter === "CRITICAL") return alert.severity === "CRITICAL" && alert.status !== "RESOLVED";
        if (filter === "RESOLVED") return alert.status === "RESOLVED";
        return true;
      }),
    [alerts, filter],
  );

  return (
    <section className="space-y-4" data-tour="security-alerts">
      <SectionHeader
        title={copy.title}
        badge={<LiveBadge label={copy.live} />}
        action={<span className="font-mono text-[11px] text-muted-foreground">{visible.length}</span>}
      />
      <p className="-mt-2 text-sm text-muted-foreground">{copy.subtitle}</p>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label={copy.open} value={stats.open} hint={copy.openHint} tone="warning" />
        <StatTile
          label={copy.critical}
          value={stats.critical}
          hint={copy.criticalHint}
          tone="danger"
        />
        <StatTile
          label={copy.detectedToday}
          value={stats.detectedToday}
          hint={copy.detectedTodayHint}
          tone="info"
        />
        <StatTile
          label={copy.resolvedToday}
          value={stats.resolvedToday}
          hint={copy.resolvedTodayHint}
          tone="success"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {filters.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setFilter(item.key)}
            aria-pressed={filter === item.key}
            className={`rounded-md border px-3 py-1.5 font-mono text-[11px] uppercase tracking-wide transition ${
              filter === item.key
                ? "border-primary/50 bg-primary/10 text-primary"
                : "border-border text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <EmptyState title={copy.empty} description={copy.emptyHint} />
      ) : (
        <div className="space-y-2">
          {visible.map((alert) => {
            const severity = severities[alert.severity] ?? alert.severity;
            const status = statuses[alert.status] ?? alert.status;
            const source =
              alert.sourceType && alert.sourceId
                ? `${alert.sourceType}: ${alert.sourceId}`
                : alert.sourceType;
            return (
              <Card key={alert.id} className="space-y-2 p-3">
                <FeedRow
                  icon={alert.kind === "INCONSISTENCY" ? "🧩" : "🚨"}
                  title={rules[alert.rule] ?? alert.rule}
                  meta={[alert.detail, source, alert.detectedLabel].filter(Boolean).join(" · ")}
                  className="border-0 bg-transparent px-0 py-0"
                  trailing={
                    <div className="flex items-center gap-1.5">
                      <Badge tone={SEVERITY_TONES[alert.severity] ?? "neutral"}>{severity}</Badge>
                      <Badge tone={STATUS_TONES[alert.status] ?? "neutral"}>{status}</Badge>
                    </div>
                  }
                />
                {alert.status !== "RESOLVED" ? (
                  <div className="flex flex-wrap gap-2">
                    {alert.status === "OPEN" ? (
                      <form action={reviewAlertAction}>
                        <input type="hidden" name="id" value={alert.id} />
                        <input type="hidden" name="status" value="REVIEWED" />
                        <Button type="submit" variant="secondary" size="sm">
                          {copy.review}
                        </Button>
                      </form>
                    ) : null}
                    <form action={reviewAlertAction}>
                      <input type="hidden" name="id" value={alert.id} />
                      <input type="hidden" name="status" value="RESOLVED" />
                      <Button type="submit" variant="ghost" size="sm">
                        {copy.resolve}
                      </Button>
                    </form>
                  </div>
                ) : null}
              </Card>
            );
          })}
        </div>
      )}

      <p className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
        {t.common.updatedEvery5s}
      </p>
    </section>
  );
}

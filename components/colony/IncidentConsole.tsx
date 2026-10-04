"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { FeedRow, LiveBadge, SectionHeader } from "@/components/colony/FeedRow";
import { RadarCard } from "@/components/colony/RadarCard";
import { StatTile } from "@/components/colony/StatTile";
import { EmptyState } from "@/components/ui/Alert";
import { ReportPriorityBadge, ReportStatusBadge } from "@/components/ui/StatusBadge";
import { useT } from "@/lib/i18n/client";
import { format } from "@/lib/i18n/format";
import { REPORT_ACTIONABLE } from "@/lib/roles";
import type { ReportRowDto } from "@/lib/serialize";

type Chip = "ALL" | "CRITICAL" | "ACTION" | "DONE";

/**
 * Live incident console shared by the security, medical and maintenance
 * stations: filter chips, four metric tiles, a radar and the incident feed.
 */
export function IncidentConsole({
  title,
  subtitle,
  station,
  reports,
  detailBase,
}: {
  title: string;
  subtitle: string;
  station: string;
  reports: ReportRowDto[];
  detailBase: string;
}) {
  const t = useT();
  const [chip, setChip] = useState<Chip>("ACTION");
  const router = useRouter();

  // Short polling (~5 s) so the console stays live during the demo. Skipped
  // while the tab is hidden so background tabs never do heavy work.
  useEffect(() => {
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") router.refresh();
    }, 5000);
    return () => clearInterval(interval);
  }, [router]);

  const chips: { key: Chip; label: string }[] = [
    { key: "ALL", label: t.ops.board.all },
    { key: "CRITICAL", label: t.ops.board.critical },
    { key: "ACTION", label: t.ops.board.action },
    { key: "DONE", label: t.ops.board.done },
  ];

  const actionable = useMemo(
    () => new Set<string>(REPORT_ACTIONABLE as readonly string[]),
    [],
  );

  const counts = useMemo(() => {
    const critical = reports.filter((r) => r.priority === "CRITICAL" && actionable.has(r.status)).length;
    const open = reports.filter((r) => r.status === "OPEN").length;
    const active = reports.filter((r) => r.status === "IN_PROGRESS" || r.status === "EN_ROUTE").length;
    const done = reports.filter((r) => !actionable.has(r.status)).length;
    return { critical, open, active, done, actionableTotal: reports.filter((r) => actionable.has(r.status)).length };
  }, [reports, actionable]);

  const visible = useMemo(() => {
    return reports.filter((report) => {
      if (chip === "CRITICAL") return report.priority === "CRITICAL" && actionable.has(report.status);
      if (chip === "ACTION") return actionable.has(report.status);
      if (chip === "DONE") return !actionable.has(report.status);
      return true;
    });
  }, [reports, chip, actionable]);

  const blips = reports.slice(0, 5).map((report, index) => ({
    x: 0.28 + ((index * 0.13) % 0.5),
    y: 0.3 + ((index * 0.17) % 0.45),
    tone: (report.priority === "CRITICAL"
      ? "danger"
      : report.status === "CLOSED" || report.status === "RESOLVED"
        ? "success"
        : "info") as "danger" | "success" | "info",
  }));

  return (
    <div className="space-y-5">
      <header>
        <div className="flex items-center justify-between gap-3">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            {station}
          </p>
          <LiveBadge />
        </div>
        <h1 className="mt-1 font-mono text-xl text-foreground">{title}</h1>
        <p className="text-sm text-muted-foreground">{subtitle}</p>
      </header>

      <div className="flex flex-wrap gap-2" data-tour="incident-filters">
        {chips.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setChip(item.key)}
            aria-pressed={chip === item.key}
            className={`rounded-md border px-3 py-1.5 font-mono text-[11px] uppercase tracking-wide transition ${
              chip === item.key
                ? "border-primary/50 bg-primary/10 text-primary"
                : "border-border text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile
          label={t.ops.board.action}
          value={counts.actionableTotal}
          hint={format(t.ops.board.openCount, { count: counts.open })}
          tone="danger"
        />
        <StatTile
          label={t.ops.board.critical}
          value={counts.critical}
          hint={t.ops.board.maxPriority}
          tone="danger"
        />
        <StatTile
          label={t.ops.board.engaged}
          value={counts.active}
          hint={t.ops.board.engagedHint}
          tone="info"
        />
        <StatTile
          label={t.ops.board.resolved}
          value={counts.done}
          hint={t.ops.board.thisCycle}
          tone="success"
        />
      </div>

      <div data-tour="radar">
        <RadarCard
          label={format(t.ops.board.sectorActive, { station })}
          caption={t.common.simulatedData}
          blips={blips}
        />
      </div>

      <section data-tour="incident-feed">
        <SectionHeader
          title={t.ops.board.feed}
          badge={<LiveBadge label={format(t.ops.board.activeCount, { count: visible.length })} />}
        />

        {visible.length === 0 ? (
          <EmptyState title={t.ops.board.empty} description={t.ops.board.emptyHint} />
        ) : (
          <div className="space-y-2">
            {visible.map((report) => (
              <Link key={report.id} href={`${detailBase}/${report.id}`}>
                <FeedRow
                  title={`${report.reference} · ${report.title}`}
                  meta={[report.sector, report.authorName, report.assigneeName ? `→ ${report.assigneeName}` : null]
                    .filter(Boolean)
                    .join(" · ")}
                  trailing={
                    <div className="flex items-center gap-1.5">
                      <ReportPriorityBadge priority={report.priority} />
                      <ReportStatusBadge status={report.status} />
                    </div>
                  }
                />
              </Link>
            ))}
          </div>
        )}
      </section>

      <p className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
        {t.common.updatedEvery5s}
      </p>
    </div>
  );
}

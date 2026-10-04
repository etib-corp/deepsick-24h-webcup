import type { Metadata } from "next";

import { SectionHeader } from "@/components/colony/FeedRow";
import { Badge } from "@/components/ui/Badge";
import { buttonClasses } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { runBackupVerificationAction } from "@/lib/actions/backup";
import type { BackupDatasetReport } from "@/lib/backup";
import { getBackupChecks } from "@/lib/data";
import { formatDateTime } from "@/lib/format";
import { format, getDictionary } from "@/lib/i18n/server";
import { requirePageRole } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export function generateMetadata(): Metadata {
  return { title: getDictionary().backup.title };
}

function parseDatasets(raw: string): BackupDatasetReport[] {
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as BackupDatasetReport[]) : [];
  } catch {
    return [];
  }
}

function kb(bytes: number): number {
  return Math.max(1, Math.round(bytes / 1024));
}

/**
 * F87 — backup verification report: run a drill, then read the verdict at a
 * glance (per dataset: rows, size, checksum, round-trip status). Each report
 * can be downloaded as JSON so it is exploitable outside the console.
 */
export default async function CouncilBackupsPage() {
  const t = getDictionary();
  await requirePageRole(["COUNCIL"]);
  const checks = await getBackupChecks(10);
  const latest = checks[0];
  const datasets = latest ? parseDatasets(latest.datasets) : [];

  return (
    <div className="space-y-5">
      <header>
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          {t.backup.eyebrow}
        </p>
        <h1 className="mt-1 font-mono text-xl text-foreground">{t.backup.title}</h1>
        <p className="text-sm text-muted-foreground">{t.backup.subtitle}</p>
      </header>

      <Card className="space-y-3 p-4">
        <SectionHeader title={t.backup.runTitle} />
        <p className="text-sm text-muted-foreground">{t.backup.runHint}</p>
        <form action={runBackupVerificationAction}>
          <button type="submit" className={buttonClasses("primary", "sm")}>
            {t.backup.run}
          </button>
        </form>
      </Card>

      {latest ? (
        <Card className="space-y-3 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <SectionHeader title={t.backup.latestTitle} />
            <Badge tone={latest.status === "VERIFIED" ? "success" : "danger"}>
              {latest.status === "VERIFIED" ? t.backup.verified : t.backup.failed}
            </Badge>
          </div>
          <p className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
            {format(t.backup.meta, {
              date: formatDateTime(latest.createdAt),
              rows: latest.totalRows,
              kb: kb(latest.totalSize),
              duration: latest.durationMs,
            })}
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
                  <th className="py-1 pr-3">{t.backup.colDataset}</th>
                  <th className="py-1 pr-3">{t.backup.colRows}</th>
                  <th className="py-1 pr-3">{t.backup.colSize}</th>
                  <th className="py-1 pr-3">{t.backup.colChecksum}</th>
                  <th className="py-1">{t.backup.colVerdict}</th>
                </tr>
              </thead>
              <tbody>
                {datasets.map((dataset) => (
                  <tr key={dataset.key} className="border-t border-border">
                    <td className="py-1.5 pr-3 text-foreground">
                      {t.backup.datasets[dataset.key as keyof typeof t.backup.datasets] ??
                        dataset.key}
                    </td>
                    <td className="py-1.5 pr-3 font-mono text-xs text-muted-foreground">
                      {dataset.rows}
                    </td>
                    <td className="py-1.5 pr-3 font-mono text-xs text-muted-foreground">
                      {format(t.backup.kb, { kb: kb(dataset.bytes) })}
                    </td>
                    <td className="py-1.5 pr-3 font-mono text-[11px] text-muted-foreground">
                      {dataset.checksum.slice(0, 12)}…
                    </td>
                    <td className="py-1.5">
                      <Badge tone={dataset.ok ? "success" : "danger"}>
                        {dataset.ok ? t.backup.ok : t.backup.ko}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <a
            href={`/api/council/backup-report?id=${latest.id}`}
            download
            className={buttonClasses("secondary", "sm")}
          >
            {t.backup.download}
          </a>
        </Card>
      ) : (
        <Card className="p-4 text-sm text-muted-foreground">{t.backup.noCheck}</Card>
      )}

      <section aria-labelledby="backup-history">
        <h2 id="backup-history" className="font-mono text-sm text-foreground">
          {t.backup.historyTitle}
        </h2>
        {checks.length === 0 ? (
          <p className="mt-1 text-sm text-muted-foreground">{t.backup.historyEmpty}</p>
        ) : (
          <ol className="mt-2 space-y-1.5">
            {checks.map((check) => (
              <li
                key={check.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border px-3 py-2 text-sm"
              >
                <span className="font-mono text-xs text-muted-foreground">
                  {formatDateTime(check.createdAt)}
                </span>
                <span className="flex items-center gap-2 text-xs text-muted-foreground">
                  {format(t.backup.historyMeta, {
                    rows: check.totalRows,
                    kb: kb(check.totalSize),
                    duration: check.durationMs,
                  })}
                  <Badge tone={check.status === "VERIFIED" ? "success" : "danger"}>
                    {check.status === "VERIFIED" ? t.backup.verified : t.backup.failed}
                  </Badge>
                </span>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}

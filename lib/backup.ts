import { createHash } from "node:crypto";

/**
 * F87 — backup verification.
 *
 * A "drill" exports the critical datasets to a canonical JSON snapshot and
 * verifies each dataset by re-reading its own serialisation (round-trip):
 * if the bytes cannot be parsed back to an identical structure and checksum,
 * the dataset is flagged as not safely backup-able. The report is stored with
 * per-dataset row counts, sizes and checksums so the result is exploitable,
 * not just a raw dump.
 */

export type BackupDatasetReport = {
  key: string;
  rows: number;
  bytes: number;
  checksum: string;
  ok: boolean;
};

export type BackupDataset = { key: string; rows: unknown[] };

export type BackupVerification = {
  ok: boolean;
  datasets: BackupDatasetReport[];
  totalRows: number;
  totalBytes: number;
};

/** Stable stringify: object keys are sorted recursively, so the bytes are canonical. */
export function canonicalJson(value: unknown): string {
  return JSON.stringify(sortValue(value));
}

function sortValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortValue);
  if (value && typeof value === "object" && !(value instanceof Date)) {
    const entries = Object.entries(value as Record<string, unknown>).sort(([a], [b]) =>
      a.localeCompare(b),
    );
    return Object.fromEntries(entries.map(([key, entry]) => [key, sortValue(entry)]));
  }
  if (value instanceof Date) return value.toISOString();
  return value;
}

export function checksumOf(json: string): string {
  return createHash("sha256").update(json).digest("hex");
}

/**
 * Verifies one dataset: serialise → parse back → re-serialise, then compare
 * checksums. A dataset that does not survive this round-trip cannot be
 * restored from its backup.
 */
export function verifyDataset(key: string, rows: unknown[]): BackupDatasetReport {
  const json = canonicalJson(rows);
  let ok = false;
  try {
    const jsonAgain = canonicalJson(JSON.parse(json));
    ok = checksumOf(json) === checksumOf(jsonAgain) && Array.isArray(JSON.parse(jsonAgain));
  } catch {
    ok = false;
  }
  return {
    key,
    rows: Array.isArray(rows) ? rows.length : 0,
    bytes: Buffer.byteLength(json, "utf8"),
    checksum: checksumOf(json),
    ok,
  };
}

/** Runs the drill over every dataset and aggregates the verdict. */
export function verifyBackup(datasets: readonly BackupDataset[]): BackupVerification {
  const reports = datasets.map((dataset) => verifyDataset(dataset.key, dataset.rows));
  const totalRows = reports.reduce((sum, report) => sum + report.rows, 0);
  const totalBytes = reports.reduce((sum, report) => sum + report.bytes, 0);

  return {
    // A drill with no rows at all proves nothing: treat it as failed.
    ok: reports.length > 0 && totalRows > 0 && reports.every((report) => report.ok),
    datasets: reports,
    totalRows,
    totalBytes,
  };
}

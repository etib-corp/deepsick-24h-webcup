import assert from "node:assert/strict";
import test from "node:test";
import { buildUsageReport, startOfUtcDay, type ReportService } from "../lib/insights";

const SERVICES: ReportService[] = [
  { id: "s1", name: "Navettes", slug: "transport" },
  { id: "s2", name: "Centre médical", slug: "medical" },
  { id: "s3", name: "Bureau des démarches", slug: "demarches" },
];

const NOW = new Date("2026-10-04T15:30:00Z");
const day = (iso: string) => new Date(`${iso}T00:00:00Z`);

test("day buckets normalise to UTC midnight", () => {
  assert.equal(startOfUtcDay(new Date("2026-10-04T23:59:59Z")).toISOString(), "2026-10-04T00:00:00.000Z");
});

test("current and previous periods are split around the window", () => {
  const report = buildUsageReport(
    [
      { serviceId: "s1", day: day("2026-10-03"), count: 10 },
      { serviceId: "s1", day: day("2026-09-24"), count: 4 },
      { serviceId: "s2", day: day("2026-10-01"), count: 6 },
    ],
    SERVICES,
    { days: 7, now: NOW },
  );

  assert.equal(report.total, 16);
  assert.equal(report.previousTotal, 4);
  const transport = report.entries.find((entry) => entry.serviceId === "s1");
  assert.equal(transport?.count, 10);
  assert.equal(transport?.previous, 4);
  assert.equal(transport?.change, 150);
});

test("rows older than the previous period are ignored", () => {
  const report = buildUsageReport(
    [{ serviceId: "s1", day: day("2026-08-01"), count: 99 }],
    SERVICES,
    { days: 7, now: NOW },
  );
  assert.equal(report.total, 0);
  assert.equal(report.previousTotal, 0);
});

test("share and top-share concentration are computed on the current period", () => {
  const report = buildUsageReport(
    [
      { serviceId: "s1", day: day("2026-10-04"), count: 50 },
      { serviceId: "s2", day: day("2026-10-04"), count: 25 },
      { serviceId: "s3", day: day("2026-10-04"), count: 25 },
    ],
    SERVICES,
    { days: 7, now: NOW },
  );
  assert.equal(report.total, 100);
  assert.equal(report.topShare, 100);
  assert.equal(report.entries[0]?.share, 50);
});

test("services that dropped to zero still appear (with a negative change)", () => {
  const report = buildUsageReport(
    [{ serviceId: "s3", day: day("2026-09-25"), count: 8 }],
    SERVICES,
    { days: 7, now: NOW },
  );
  const dropped = report.entries.find((entry) => entry.serviceId === "s3");
  assert.equal(dropped?.count, 0);
  assert.equal(dropped?.previous, 8);
  assert.equal(dropped?.change, -100);
});

test("an empty period yields a zeroed report instead of a crash", () => {
  const report = buildUsageReport([], SERVICES, { days: 30, now: NOW });
  assert.equal(report.total, 0);
  assert.equal(report.entries.length, 0);
  assert.equal(report.topShare, 0);
});

import assert from "node:assert/strict";
import test from "node:test";

import {
  buildActivityReport,
  isReportDays,
  reportWindow,
  type ActivityMetricInput,
} from "../lib/activity-report";

const NOW = new Date("2026-10-04T15:00:00.000Z");

test("reportWindow states the current period and the previous one", () => {
  const { currentStart, previousStart, currentEnd } = reportWindow(30, NOW);
  assert.equal(currentStart.toISOString(), "2026-09-05T00:00:00.000Z");
  assert.equal(previousStart.toISOString(), "2026-08-06T00:00:00.000Z");
  assert.equal(currentEnd, NOW);
});

test("isReportDays accepts only the supported periods", () => {
  assert.equal(isReportDays("7"), true);
  assert.equal(isReportDays(30), true);
  assert.equal(isReportDays("90"), true);
  assert.equal(isReportDays("14"), false);
  assert.equal(isReportDays(undefined), false);
});

test("buildActivityReport computes trends, changes and the stated period", () => {
  const metrics: ActivityMetricInput[] = [
    { key: "requests", current: 12, previous: 10 },
    { key: "reports", current: 3, previous: 6 },
    { key: "accounts", current: 5, previous: 0 },
  ];
  const report = buildActivityReport(metrics, { days: 30, now: NOW });

  assert.equal(report.days, 30);
  assert.equal(report.from, "2026-09-05");
  assert.equal(report.to, "2026-10-04");

  assert.deepEqual(report.trends, [
    { key: "requests", current: 12, previous: 10, change: 20 },
    { key: "reports", current: 3, previous: 6, change: -50 },
    { key: "accounts", current: 5, previous: 0, change: null },
  ]);

  assert.equal(report.totals.current, 20);
  assert.equal(report.totals.previous, 16);
  assert.equal(report.totals.change, 25);
});

test("buildActivityReport handles an empty period without dividing by zero", () => {
  const report = buildActivityReport([], { days: 7, now: NOW });
  assert.equal(report.totals.current, 0);
  assert.equal(report.totals.previous, 0);
  assert.equal(report.totals.change, null);
  assert.deepEqual(report.trends, []);
});

import assert from "node:assert/strict";
import test from "node:test";

import {
  detectBaselineSpikes,
  detectBursts,
  detectInconsistencies,
  type SecurityEventLike,
  type SentinelConfig,
} from "../lib/anomaly";

const CONFIG: SentinelConfig = {
  windowMinutes: 10,
  burstThreshold: 3,
  zscoreThreshold: 3,
  minSamples: 3,
};

const at = (minutesAgo: number, now: Date) => new Date(now.getTime() - minutesAgo * 60_000);
const now = new Date("2026-10-04T12:30:00.000Z");

function event(type: string, minutesAgo: number, extra: Partial<SecurityEventLike> = {}) {
  return { type, ip: null, actorId: null, createdAt: at(minutesAgo, now), ...extra };
}

test("detectBursts flags a burst per IP and per actor, escalating severity", () => {
  const warning = detectBursts(
    [event("LOGIN_FAILED", 1, { ip: "10.0.0.1" }), event("LOGIN_FAILED", 2, { ip: "10.0.0.1" }), event("LOGIN_FAILED", 3, { ip: "10.0.0.1" })],
    now,
    CONFIG,
  );
  assert.equal(warning.length, 1);
  assert.equal(warning[0].rule, "BURST_LOGIN_FAILED");
  assert.equal(warning[0].severity, "WARNING");
  assert.equal(warning[0].sourceType, "ip");

  const actorBurst = detectBursts(
    [event("ACCESS_DENIED", 1, { actorId: "u1" }), event("ACCESS_DENIED", 2, { actorId: "u1" }), event("ACCESS_DENIED", 3, { actorId: "u1" })],
    now,
    CONFIG,
  );
  assert.equal(actorBurst[0].sourceType, "actor");

  const critical = detectBursts(
    Array.from({ length: 6 }, (_, i) => event("FORM_BLOCKED", i + 1, { ip: "10.0.0.9" })),
    now,
    CONFIG,
  );
  assert.equal(critical[0].severity, "CRITICAL");
});

test("detectBursts ignores below-threshold and out-of-window events", () => {
  const below = detectBursts(
    [event("LOGIN_BLOCKED", 1, { ip: "10.0.0.2" }), event("LOGIN_BLOCKED", 2, { ip: "10.0.0.2" })],
    now,
    CONFIG,
  );
  assert.equal(below.length, 0);

  const stale = detectBursts(
    [
      event("LOGIN_FAILED", 30, { ip: "10.0.0.3" }),
      event("LOGIN_FAILED", 31, { ip: "10.0.0.3" }),
      event("LOGIN_FAILED", 32, { ip: "10.0.0.3" }),
    ],
    now,
    CONFIG,
  );
  assert.equal(stale.length, 0);
});

test("detectBursts attributes an IP-null burst to the actor only", () => {
  const alerts = detectBursts(
    [event("ACCESS_DENIED", 1, { actorId: "u9" }), event("ACCESS_DENIED", 2, { actorId: "u9" }), event("ACCESS_DENIED", 3, { actorId: "u9" })],
    now,
    CONFIG,
  );
  assert.equal(alerts.length, 1);
  assert.equal(alerts[0].sourceId, "u9");
});

test("detectBaselineSpikes flags an hourly deviation and ignores sparse types", () => {
  const baseline = [
    event("LOGIN_FAILED", 60 * 1 + 5, { ip: "a" }),
    event("LOGIN_FAILED", 60 * 2 + 5, { ip: "b" }),
    event("LOGIN_FAILED", 60 * 3 + 5, { ip: "c" }),
  ];
  const current = Array.from({ length: 5 }, (_, i) => event("LOGIN_FAILED", i + 1, { ip: "x" }));

  const alerts = detectBaselineSpikes([...baseline, ...current], now, CONFIG);
  assert.equal(alerts.length, 1);
  assert.equal(alerts[0].rule, "SPIKE_LOGIN_FAILED");
  assert.equal(alerts[0].severity, "WARNING");

  const sparse = detectBaselineSpikes(
    [event("ROLE_CHANGED", 60), event("ROLE_CHANGED", 1), event("ROLE_CHANGED", 2), event("ROLE_CHANGED", 3)],
    now,
    CONFIG,
  );
  assert.equal(sparse.length, 0);
});

test("detectInconsistencies reports one alert per inconsistent record", () => {
  const alerts = detectInconsistencies({
    requestMismatches: [
      { id: "r1", reference: "NT-1", status: "IN_PROGRESS", timelineStatus: "SUBMITTED" },
    ],
    reportMismatches: [
      { id: "p1", reference: "SIG-1", status: "RESOLVED", timelineStatus: "OPEN" },
    ],
    appointmentsOnDisabledService: [{ id: "a1", reference: "APT-1", serviceName: "BioDôme" }],
    announcementsWithoutDate: [{ id: "n1", slug: "avis" }],
  });

  assert.equal(alerts.length, 4);
  assert.deepEqual(
    alerts.map((alert) => alert.rule).sort(),
    [
      "ACTIVE_APPOINTMENT_ON_DISABLED_SERVICE",
      "ANNOUNCEMENT_PUBLISHED_WITHOUT_DATE",
      "REPORT_STATUS_MISMATCH",
      "REQUEST_STATUS_MISMATCH",
    ],
  );
  assert.ok(alerts.every((alert) => alert.kind === "INCONSISTENCY"));
  assert.ok(alerts.every((alert) => alert.fingerprint.startsWith("INCONSISTENCY:")));
});

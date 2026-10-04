import assert from "node:assert/strict";
import test from "node:test";
import {
  instructionSteps,
  isAlertLive,
  isAlertSeverity,
  sortAlertsBySeverity,
} from "../lib/alerts";

const now = new Date("2026-10-04T12:00:00Z");

test("severity values are validated", () => {
  assert.equal(isAlertSeverity("CRITICAL"), true);
  assert.equal(isAlertSeverity("URGENT"), false);
});

test("alerts are live only while ACTIVE and past their start time", () => {
  assert.equal(isAlertLive({ status: "ACTIVE", startsAt: null }, now), true);
  assert.equal(isAlertLive({ status: "RESOLVED", startsAt: null }, now), false);
  assert.equal(
    isAlertLive({ status: "ACTIVE", startsAt: new Date("2026-10-04T13:00:00Z") }, now),
    false,
  );
  assert.equal(
    isAlertLive({ status: "ACTIVE", startsAt: new Date("2026-10-04T11:00:00Z") }, now),
    true,
  );
});

test("sorting puts the most severe first, then the most recent", () => {
  const sorted = sortAlertsBySeverity([
    { severity: "ADVISORY", startsAt: null, createdAt: new Date("2026-10-04T10:00:00Z"), name: "a" },
    { severity: "CRITICAL", startsAt: null, createdAt: new Date("2026-10-04T08:00:00Z"), name: "b" },
    { severity: "CRITICAL", startsAt: new Date("2026-10-04T11:30:00Z"), createdAt: new Date("2026-10-04T09:00:00Z"), name: "c" },
  ]);
  assert.deepEqual(sorted.map((entry) => entry.name), ["c", "b", "a"]);
});

test("instruction blocks split into readable steps", () => {
  const steps = instructionSteps("- Coupez le chauffage\n• Évitez l'ascenseur\n\n  Restez calme  ");
  assert.deepEqual(steps, ["Coupez le chauffage", "Évitez l'ascenseur", "Restez calme"]);
});

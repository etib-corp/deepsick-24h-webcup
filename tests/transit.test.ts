import assert from "node:assert/strict";
import test from "node:test";
import { isDisruptionLive, isLineRunning, nextDepartures, type TransitLine } from "../lib/transit";

const LINE: TransitLine = {
  id: "navette-test",
  name: "Navette test",
  service: "Hermes Mobility Net",
  firstDeparture: 6 * 60,
  lastDeparture: 10 * 60,
  frequencyMinutes: 15,
  stops: ["A", "B"],
};

function at(hours: number, minutes: number): Date {
  return new Date(2026, 9, 4, hours, minutes);
}

test("departures follow the line frequency from the current time", () => {
  assert.deepEqual(nextDepartures(LINE, 3, at(7, 2)), ["07:15", "07:30", "07:45"]);
});

test("a departure exactly now is skipped in favour of the next one", () => {
  assert.deepEqual(nextDepartures(LINE, 1, at(7, 15)), ["07:30"]);
});

test("after the last departure the line returns no time", () => {
  assert.deepEqual(nextDepartures(LINE, 3, at(10, 30)), []);
  assert.equal(isLineRunning(LINE, at(10, 30)), false);
});

test("before the first departure the line is not running yet", () => {
  assert.equal(isLineRunning(LINE, at(5, 0)), false);
  assert.deepEqual(nextDepartures(LINE, 1, at(5, 0)), ["06:00"]);
});

test("the line is running inside its time window", () => {
  assert.equal(isLineRunning(LINE, at(8, 0)), true);
});

test("F97 — a disruption is live only while active and inside its window", () => {
  const now = at(8, 0);
  assert.equal(isDisruptionLive({ active: true, startsAt: null, endsAt: null }, now), true);
  assert.equal(isDisruptionLive({ active: false, startsAt: null, endsAt: null }, now), false);
  assert.equal(
    isDisruptionLive({ active: true, startsAt: new Date(2026, 9, 4, 9, 0), endsAt: null }, now),
    false,
  );
  assert.equal(
    isDisruptionLive({ active: true, startsAt: null, endsAt: new Date(2026, 9, 4, 7, 0) }, now),
    false,
  );
  assert.equal(
    isDisruptionLive(
      { active: true, startsAt: new Date(2026, 9, 4, 7, 0), endsAt: new Date(2026, 9, 4, 9, 0) },
      now,
    ),
    true,
  );
});
